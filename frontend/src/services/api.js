import axios from "axios";

//  InsightAgent Enterprise API Gateway Service
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/**
 * Helper to retrieve JWT Token from localStorage
 */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Centralized Axios Instance for generic API calls
 */
export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

//  Axios Response Interceptor (Updated with full clear & 403 support)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Unauthorized/Forbidden token detected by Axios. Clearing all session data...");
      
      localStorage.clear();
      sessionStorage.clear();
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Global 401/403 guard for fetch responses — when any authenticated request gets a 401/403, the stale
 * token and cache are cleared and the user is hard-redirected to /login.
 * This eliminates the infinite auth loop caused by expired tokens.
 */
const handleResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    console.warn("Unauthorized/Forbidden token detected by Fetch. Clearing all session data...");
    
   
    localStorage.clear();
    sessionStorage.clear();
    
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }
  return response;
};

export const apiService = {
  /**
   * 1. Authenticate user and store JWT token
   */
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI OAuth2 expects 'username'
    formData.append("password", password);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Authentication failed. Please check your credentials.");
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    if (data.user?.role) {
      localStorage.setItem("user_role", data.user.role);
    }
    return data;
  },

  /**
   * 2. Create a new chat session
   */
  createChatSession: async (title) => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ title }),
      })
    );
    if (!response.ok) throw new Error("Failed to create chat workspace.");
    return await response.json();
  },

  /**
   * 3. Retrieve all chat sessions for the authenticated user
   */
  getUserSessions: async () => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/session`, {
        method: "GET",
        headers: getAuthHeader(),
      })
    );
    if (!response.ok) throw new Error("Failed to retrieve chat sessions.");
    return await response.json();
  },

  /**
   * 4. Soft-delete a chat session
   */
  deleteChatSession: async (sessionId) => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      })
    );
    if (!response.ok) throw new Error("Failed to delete chat session.");
    return await response.json();
  },

  /**
   * 5. Trigger live SSE streaming response from the RAG agent
   */
  streamChatResponse: async (sessionId, prompt, onChunkReceived, onStreamComplete, onError) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/stream/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ user_prompt: prompt }),
      });

      await handleResponse(response);

      if (!response.ok) {
        throw new Error("Streaming connection failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Hold last incomplete line

        for (const line of lines) {
          if (!line || line === "\r") continue;
          if (line.startsWith("data:")) {
            let rawData = line.substring(5);
            if (rawData.startsWith(" ")) rawData = rawData.substring(1);
            if (rawData.endsWith("\r")) rawData = rawData.slice(0, -1);
            if (rawData) onChunkReceived(rawData);
          }
        }
      }

      if (onStreamComplete) onStreamComplete();
    } catch (err) {
      if (onError) onError(err.message || String(err));
    }
  },

  /**
   * 6. Fetch historical messages for a session
   */
  getChatHistory: async (sessionId) => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/session/${sessionId}/messages`, {
        method: "GET",
        headers: getAuthHeader(),
      })
    );
    if (!response.ok) throw new Error("Failed to load chat history.");
    return await response.json();
  },

  /**
   * 7. Commit a file to the vector DB (background-indexed)
   */
  indexPayload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/index-payload`, {
        method: "POST",
        headers: getAuthHeader(), // No Content-Type — browser sets multipart boundary
        body: formData,
      })
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Failed to upload file to pipeline.");
    }
    return await response.json();
  },

  /**
   * 8. Get list of indexed documents from Qdrant for the current user
   */
  getUploadedFiles: async () => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/uploaded-files`, {
        method: "GET",
        headers: getAuthHeader(),
      })
    );
    if (!response.ok) throw new Error("Failed to retrieve uploaded file list.");
    return await response.json();
  },

  /**
   * 9. Purge a document's vectors from Qdrant by document_id
   */
  deleteFile: async (documentId) => {
    const response = await handleResponse(
      await fetch(`${BASE_URL}/chat/delete-file/${documentId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      })
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Failed to delete file from vector store.");
    }
    return await response.json();
  },
};