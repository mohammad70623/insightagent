import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { apiService } from "../services/api";

const Chat = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const chatBottomRef = useRef(null);
  const bufferRef = useRef("");
  const throttleTimerRef = useRef(null);

  // Auto Scroll Engine
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load User Chat Sessions on Mount
  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        const historySessions = await apiService.getUserSessions();
        setSessions(historySessions);
      } catch (err) {
        setErrorBanner(`Failed to load chat workspace list: ${err.message}`);
      }
    };
    fetchUserSessions();
  }, []);

  /**
   * Advanced Session Switching (Pulls Real History from DB)
   */
  const handleSessionSwitch = async (id) => {
    if (isStreaming) return;

    // 🧹 UX Guard: Flush buffer and clear previous messages list instantly
    bufferRef.current = "";
    setMessages([]);

    setActiveSessionId(id);
    setErrorBanner(null);

    try {
      const history = await apiService.getChatHistory(id);
      setMessages(history);
    } catch (err) {
      setErrorBanner(`Failed to populate chat architecture: ${err.message}`);
    }
  };

  /**
   * soft-delete active/inactive session matrices cleanly
   */
  const handleDeleteSession = async (id) => {
    if (isStreaming) return;
    setErrorBanner(null);
    try {
      await apiService.deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));

      // 🔒 Active Session Deletion Guard: clear UI state instantly if the open session is deleted
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
        bufferRef.current = "";
      }
    } catch (err) {
      setErrorBanner(`Failed to terminate workspace container: ${err.message}`);
    }
  };

  /**
   * Protected Session Creation with loading guard
   */
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newChatTitle.trim() || creating) return;

    setCreating(true);
    setErrorBanner(null);
    try {
      const newSession = await apiService.createChatSession(newChatTitle.trim());
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setNewChatTitle("");
    } catch (err) {
      setErrorBanner(`Workspace Initialization Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  /**
   *  Advanced Streaming Engine with Token Buffering & Race-Condition Guard
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || !activeSessionId || isStreaming) return;

    const userPromptText = inputPrompt.trim();
    setInputPrompt("");
    setErrorBanner(null);

    const userMessageObj = { role: "user", content: userPromptText };
    const aiPlaceholderObj = { role: "assistant", content: "" };

    // Fix 1: Batch state mutations cleanly to secure single layout updates
    setMessages((prev) => [...prev, userMessageObj, aiPlaceholderObj]);

    setIsStreaming(true);
    bufferRef.current = ""; // Flush previous operational buffer

    await apiService.streamChatResponse(
      activeSessionId,
      userPromptText,
      // Optimized Token Chunk Receiver (Uses Buffered Throttling)
      (token) => {
        // Fix 2: Remove hardcoded spacing injection. Fallback onto raw tokenizer data matrix
        const cleanToken = token.startsWith("'") && token.endsWith("'") ? token.slice(1, -1) : token;
        const processedToken = cleanToken === "\\n" ? "\n" : cleanToken;

        bufferRef.current += processedToken;

        // Throttle layout triggers to 60ms to heavily guard React from freezing
        if (!throttleTimerRef.current) {
          throttleTimerRef.current = setTimeout(() => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (updated[lastIndex]) {
                updated[lastIndex].content = bufferRef.current;
              }
              return updated;
            });
            throttleTimerRef.current = null;
          }, 60);
        }
      },
      //  Complete Trigger Node
      () => {
        setIsStreaming(false);
        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      },
      //  Error Trigger Node
      (errorMsg) => {
        setIsStreaming(false);
        setErrorBanner(`Streaming Fault Detected: ${errorMsg}`);
      }
    );
  };

  return (
    <div className="flex h-screen bg-[#111827] text-gray-100 font-sans">

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSwitch={handleSessionSwitch}
        onSessionDelete={handleDeleteSession}
        newChatTitle={newChatTitle}
        setNewChatTitle={setNewChatTitle}
        onCreateSession={handleCreateSession}
        creating={creating}
        isStreaming={isStreaming}
      />

      <div className="flex-1 flex flex-col relative">
        {/* Production Error Banner UI */}
        {errorBanner && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white font-mono text-xs px-4 py-2 rounded-lg border border-red-600 shadow-2xl flex items-center gap-2 animate-bounce">
            ⚠️ {errorBanner}
            <button onClick={() => setErrorBanner(null)} className="font-bold hover:text-black ml-2">×</button>
          </div>
        )}

        <ChatWindow
          activeSessionId={activeSessionId}
          messages={messages}
          isStreaming={isStreaming}
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          onSendMessage={handleSendMessage}
          chatBottomRef={chatBottomRef}
        />
      </div>

    </div>
  );
};

export default Chat;