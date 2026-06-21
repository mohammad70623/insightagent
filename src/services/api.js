// 🌐 InsightAgent Enterprise API Gateway Service

const BASE_URL = "http://127.0.0.1:8000/api/v1";

/**
 *  Helper to retrieve JWT Token from localStorage
 */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiService = {
  /**
   *  1. Authenticate User and Store Token
   */
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI OAuth2 expects 'username'
    formData.append("password", password);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Authentication failed! Please check credentials.");
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    return data;
  },

  /**
   *  2. Initialize a Brand New Chat Room/Session
   */
  createChatSession: async (title) => {
    const response = await fetch(`${BASE_URL}/chat/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to initialize enterprise chat workspace.");
    }

    return await response.json(); // Returns { id, user_id, title, ... }
  },

  /**
   *  2b. Retrieve all Chat Sessions for the authenticated user
   */
  getUserSessions: async () => {
    const response = await fetch(`${BASE_URL}/chat/session`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve chat sessions.");
    }

    return await response.json(); // Expected: Array of ChatSession objects
  },

  /**
   *  2c. Soft-delete a Chat Session
   */
  deleteChatSession: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/chat/session/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete chat session.");
    }

    return await response.json(); // Expected: { status: "success", ... }
  },

  /**
   *  3. Trigger & Consume Live Server-Sent Events (SSE) Stream
   * This uses readable streams to read token-by-token from Groq Cloud
   */
  streamChatResponse: async (sessionId, prompt, onChunkReceived, onStreamComplete, onError) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/stream/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ user_prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error("Streaming connection interrupted by core engine.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Continuous stream reading loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Save the last incomplete line back to buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (line === "" || line === "\r") continue;

          // Catch raw streaming chunks coming from our FastAPI server
          if (line.startsWith("data:")) {
            let rawData = line.substring(5);
            
            // SSE spec: if there is a single space after 'data:', remove it
            if (rawData.startsWith(" ")) {
              rawData = rawData.substring(1);
            }
            
            // Clean carriage return if present
            if (rawData.endsWith("\r")) {
              rawData = rawData.slice(0, -1);
            }
            
            // Filter out system stream events if any, or pass text directly
            if (rawData.startsWith('{"event":')) {
              const eventObj = JSON.parse(rawData);
              if (eventObj.event === "stream_failed") {
                throw new Error(eventObj.error || "Stream cluster failure");
              }
            } else {
              // Pass the clean text token (preserving leading/trailing spaces) to our UI updater callback
              onChunkReceived(rawData);
            }
          }
        }
      }

      if (onStreamComplete) onStreamComplete();
    } catch (err) {
      if (onError) onError(err.message || err);
    }
  },
  /**
   * 4. Fetch Historical Messages for a specific session
   */
  getChatHistory: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/chat/session/${sessionId}/messages`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to pull historical session logs.");
    }
    return await response.json(); // Expected: Array of { role, content }
  },
  /**
   * 5. Alias to retrieve full message footprint of an older session
   */
  getSessionMessages: async (sessionId) => {
    return await apiService.getChatHistory(sessionId);
  },
  /**
   * 6. Commit raw binary file payload to vector DB index
   */
  indexPayload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/chat/index-payload`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || "Failed to commit data pipeline to vector db.");
    }

    return await response.json();
  }
};
