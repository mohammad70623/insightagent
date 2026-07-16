import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import { apiService } from '../services/api';

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "Last active: Just now";
    } else if (diffMins < 60) {
      return `Last active: ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `Last active: ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `Last active: ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return `Active: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (e) {
    return "";
  }
};

export default function IntegratedChatPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // Tracks if a session is loaded
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [pendingSessionTitle, setPendingSessionTitle] = useState("");

  const chatBottomRef = useRef(null);
  const bufferRef = useRef("");
  const throttleTimerRef = useRef(null);

  // Auto Scroll Engine
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up throttler on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, []);

  // Load User Chat Sessions on Mount
  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        const historySessions = await apiService.getUserSessions();
        const sorted = [...historySessions].sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at);
          const dateB = new Date(b.updated_at || b.created_at);
          return dateB - dateA;
        });
        setSessions(sorted);
      } catch (err) {
        setErrorBanner(`Failed to load chat workspace list: ${err.message}`);
      }
    };
    fetchUserSessions();
  }, []);

  const bumpSessionActivity = (sessionId) => {
    setSessions((prevSessions) => {
      const updatedSessions = prevSessions.map((session) => {
        if (session.id === sessionId) {
          return { ...session, updated_at: new Date().toISOString() };
        }
        return session;
      });
      return [...updatedSessions].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB - dateA;
      });
    });
  };

  /**
   * Session Switching (Pulls Real History from DB)
   */
  const handleSessionSwitch = async (session) => {
    if (isStreaming) return;

    bufferRef.current = "";
    setMessages([]);
    setActiveSession(session);
    setPendingSessionTitle("");
    setErrorBanner(null);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile switch

    bumpSessionActivity(session.id);

    try {
      const history = await apiService.getChatHistory(session.id);
      setMessages(history);
    } catch (err) {
      setErrorBanner(`Failed to populate chat architecture: ${err.message}`);
    }
  };

  /**
   * Delete session cleanly
   */
  const handleDeleteSession = async (id) => {
    if (isStreaming) return;
    setErrorBanner(null);
    try {
      await apiService.deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));

      if (activeSession?.id === id) {
        setActiveSession(null);
        setPendingSessionTitle("");
        setMessages([]);
        bufferRef.current = "";
      }
    } catch (err) {
      setErrorBanner(`Failed to terminate workspace container: ${err.message}`);
    }
  };

  /**
   * Session Creation
   */
  const handleCreateSession = (e) => {
    if (e) e.preventDefault();
    if (!newSessionName.trim()) return;

    setPendingSessionTitle(newSessionName.trim());
    setActiveSession(null);
    setMessages([]);
    setNewSessionName("");
    setIsMobileSidebarOpen(false);
  };

  /**
   * Streaming Message Engine
   */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;

    const userPromptText = inputPrompt.trim();
    setInputPrompt("");
    setErrorBanner(null);

    const userMessageObj = { role: "user", content: userPromptText };
    const aiPlaceholderObj = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessageObj, aiPlaceholderObj]);
    setIsStreaming(true);
    bufferRef.current = "";

    const sessionIdToSend = activeSession ? activeSession.id : "new";
    const sessionTitleToSend = activeSession ? null : (pendingSessionTitle || null);

    if (activeSession) {
      bumpSessionActivity(activeSession.id);
    }

    await apiService.streamChatResponse(
      sessionIdToSend,
      userPromptText,
      (token) => {
        if (token.startsWith("session_id:")) {
          const parts = token.split(":");
          const newId = parts[1];
          const newTitle = parts.slice(2).join(":");
          const newSess = { id: newId, title: newTitle, name: newTitle };
          
          setActiveSession(newSess);
          setSessions((prev) => [newSess, ...prev]);
          setPendingSessionTitle("");
          bumpSessionActivity(newId);
          return;
        }

        const cleanToken = token.startsWith("'") && token.endsWith("'") ? token.slice(1, -1) : token;
        const processedToken = cleanToken === "\\n" ? "\n" : cleanToken;

        bufferRef.current += processedToken;

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
      () => {
        setIsStreaming(false);
        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      },
      (errorMsg) => {
        setIsStreaming(false);
        setErrorBanner(`Streaming Fault Detected: ${errorMsg}`);
      },
      sessionTitleToSend
    );
  };

  return (
    <div className="flex w-full h-full bg-slate-950 overflow-hidden relative">
      
      {/* Production Error Banner UI */}
      {errorBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white font-mono text-xs px-4 py-2 rounded-lg border border-red-600 shadow-2xl flex items-center gap-2 animate-bounce">
          ⚠️ {errorBanner}
          <button onClick={() => setErrorBanner(null)} className="text-white hover:text-slate-200 ml-1">×</button>
        </div>
      )}

      {/* Workspace Sidebar Wrapper */}
      <div className={`
        absolute inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-indigo-400 font-mono uppercase">InsightAgent AI</span>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              className="md:hidden text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <button 
            onClick={() => {
              setActiveSession(null);
              setPendingSessionTitle("");
              setMessages([]);
              setIsMobileSidebarOpen(false);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>💬</span> New Chat
          </button>
        </div>

        {/* Sidebar Scrollable Workspace List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 h-[calc(100%-120px)] custom-scrollbar">
          {sessions.map((session) => {
            const isActive = activeSession?.id === session.id;
            return (
              <div 
                key={session.id}
                className={`
                  group w-full flex items-center justify-between gap-2 p-3 rounded-xl transition-all cursor-pointer border
                  ${isActive 
                    ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.08)]" 
                    : "bg-slate-900/30 border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-300"}
                `}
                onClick={() => handleSessionSwitch(session)}
              >
                <div className="flex-1 truncate text-left py-1">
                  <p className="text-xs font-bold font-mono truncate">{session.title || session.name}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ease-in-out cursor-pointer"
                  title="Delete Conversation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Deck */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Dynamic Navigation Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden flex flex-col gap-1 p-1 hover:bg-slate-800 rounded"
          >
            <span className="w-4 h-0.5 bg-slate-300"></span>
            <span className="w-4 h-0.5 bg-slate-300"></span>
            <span className="w-4 h-0.5 bg-slate-300"></span>
          </button>
          <div className="flex items-center gap-2 text-xs md:text-sm tracking-wide font-medium text-slate-400">
            {activeSession ? (
              <span className="text-emerald-400 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Session: {activeSession.title || activeSession.name}
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {pendingSessionTitle ? `Pending Workspace: ${pendingSessionTitle}` : "New Conversation"}
              </span>
            )}
          </div>
        </div>

        {/* DYNAMIC RENDERING: CHAT THREAD OR WELCOME SUGGESTIONS PANEL */}
        <div className="flex-1 overflow-y-auto w-full p-4 space-y-4 flex flex-col">
          {activeSession ? (
            /* ACTIVE CHAT WORKSPACE SCROLL */
            <div className="space-y-4 w-full flex-1 flex flex-col justify-start">
              {messages.length === 0 ? (
                <div className="flex justify-start w-full">
                  <div className="max-w-[85%] md:max-w-[70%] bg-slate-900/60 border border-slate-800/80 text-slate-300 rounded-xl p-4 text-sm md:text-base">
                    <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1 font-mono">✨ INSIGHTAGENT</div>
                    <p>Session initialized successfully! How can I help you unlock insights today?</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <MessageBubble 
                    key={idx} 
                    msg={msg} 
                    isStreaming={isStreaming} 
                    isLast={idx === messages.length - 1} 
                  />
                ))
              )}
              <div ref={chatBottomRef} />
            </div>
          ) : (
            /* WELCOME PANEL WITH QUICK SUGGESTION SUGGESTIONS */
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4 my-auto">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                🧠
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                 InsightAgent Chat Engine
                </h2>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed mx-auto">
                  Welcome! Type your query below to automatically search your knowledge base, cross-reference data
                </p>
              </div>
              
            </div>
          )}
        </div>

        {/* RESPONSIVE STICKY BOTTOM INPUT TRAY */}
        <div className="w-full sticky bottom-0 bg-[#0B0F19] z-50 p-4 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2 shadow-2xl">
            <input 
              type="text" 
              placeholder={creating ? "Initializing session..." : "Ask me anything..."}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isStreaming || creating}
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm md:text-base outline-none py-2 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isStreaming || creating || !inputPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:bg-slate-850"
            >
              {isStreaming ? "..." : "SEND"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}