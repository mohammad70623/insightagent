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
  const handleCreateSession = async (e) => {
    if (e) e.preventDefault();
    if (!newSessionName.trim() || creating) return;

    setCreating(true);
    setErrorBanner(null);
    try {
      const newSession = await apiService.createChatSession(newSessionName.trim());
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
      setNewSessionName("");
      setIsMobileSidebarOpen(false);
    } catch (err) {
      setErrorBanner(`Workspace Initialization Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Streaming Message Engine
   */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || !activeSession || isStreaming) return;

    const userPromptText = inputPrompt.trim();
    setInputPrompt("");
    setErrorBanner(null);

    const userMessageObj = { role: "user", content: userPromptText };
    const aiPlaceholderObj = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessageObj, aiPlaceholderObj]);
    setIsStreaming(true);
    bufferRef.current = "";

    bumpSessionActivity(activeSession.id);

    await apiService.streamChatResponse(
      activeSession.id,
      userPromptText,
      (token) => {
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
      }
    );
  };

  return (
    <div className="flex w-full h-[calc(100vh-65px)] bg-slate-950 overflow-hidden relative">
      
      {/* Production Error Banner UI */}
      {errorBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white font-mono text-xs px-4 py-2 rounded-lg border border-red-600 shadow-2xl flex items-center gap-2 animate-bounce">
          ⚠️ {errorBanner}
          <button onClick={() => setErrorBanner(null)} className="font-bold hover:text-black ml-2">×</button>
        </div>
      )}

      {/* SIDEBAR COMPONENT (DRAWER FOR MOBILE, FIXED FOR DESKTOP) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex md:w-80 md:z-0 md:bg-slate-900/40
      `}>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2">🧠 InsightAgent</h3>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-200">✕</button>
          </div>

          {/* Sidebar Input Trigger */}
          <form onSubmit={handleCreateSession} className="flex gap-2">
            <input 
              type="text" 
              placeholder={creating ? "Creating..." : "New Session Name..."}
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              disabled={creating || isStreaming}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={creating || isStreaming || !newSessionName.trim()}
              className="bg-indigo-600 border border-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {creating ? "..." : "+"}
            </button>
          </form>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-xs italic p-2">No active sessions.</p>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition font-medium ${
                    activeSession?.id === sess.id
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-slate-950/40 border border-slate-800 text-slate-300 hover:bg-slate-900/60"
                  }`}
                >
                  <button
                    onClick={() => handleSessionSwitch(sess)}
                    disabled={isStreaming}
                    className="flex-1 text-left truncate py-1 outline-none cursor-pointer flex flex-col"
                  >
                    <span className="truncate">📁 {sess.title || sess.name}</span>
                    <span className={`text-[10px] mt-0.5 ${
                      activeSession?.id === sess.id
                        ? "text-indigo-200"
                        : "text-slate-500 group-hover:text-slate-400 transition-colors"
                    }`}>
                      {formatRelativeTime(sess.updated_at || sess.created_at)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete session "${sess.title || sess.name}"?`)) {
                        handleDeleteSession(sess.id);
                      }
                    }}
                    disabled={isStreaming}
                    title="Delete Session"
                    className={`ml-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors focus:outline-none cursor-pointer ${
                      activeSession?.id === sess.id 
                        ? "text-white hover:bg-black/10 opacity-100" 
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">SECURE_NODE_V2</div>
      </div>

      {isMobileSidebarOpen && <div onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" />}

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 h-full min-h-0 w-full overflow-hidden relative">
        
        {/* TOP NAVBAR HEADER */}
        <div className="w-full bg-slate-900/20 border-b border-slate-900 px-4 py-3 flex items-center gap-3 z-20">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden flex flex-col gap-1 p-2 border border-slate-800 rounded-lg bg-slate-900/60">
            <span className="w-4 h-0.5 bg-slate-300"></span>
            <span className="w-4 h-0.5 bg-slate-300"></span>
            <span className="w-4 h-0.5 bg-slate-300"></span>
          </button>
          <div className="flex items-center gap-2 text-xs md:text-sm tracking-wide font-medium text-slate-400">
            {activeSession ? (
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Session: {activeSession.title || activeSession.name}
              </span>
            ) : (
              <span className="text-amber-500">🔒 Chat Session Locked</span>
            )}
          </div>
        </div>

        {/* DYNAMIC RENDERING: CHAT THREAD OR EMPTY STATE WIDGET */}
        <div className="flex-1 overflow-y-auto w-full p-4 space-y-4">
          {activeSession ? (
            /* ACTIVE CHAT WORKSPACE SCROLL */
            <div className="space-y-4 w-full flex-1 flex flex-col justify-start">
              {messages.length === 0 ? (
                <div className="flex justify-start w-full">
                  <div className="max-w-[85%] md:max-w-[70%] bg-slate-900/60 border border-slate-800/80 text-slate-300 rounded-xl p-4 text-sm md:text-base">
                    <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">✨ INSIGHTAGENT</div>
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
            /* PREMIUM CENTRALIZED INTERACTIVE MOBILE ENTRY HOOK */
            <div className="max-w-sm mx-auto w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center shadow-xl space-y-4 my-auto">
              <div className="text-3xl">🧠</div>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Start a New Conversation
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Give your chat session a name to keep your insights organized and start analyzing your workspace documents.
              </p>
              
              <form onSubmit={handleCreateSession} className="space-y-2">
                <input 
                  type="text" 
                  placeholder="e.g., Q2 Performance Review"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  disabled={creating || isStreaming}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none text-center focus:border-indigo-500 transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={creating || isStreaming || !newSessionName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  {creating ? "Starting Session..." : "Start New Session"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ABSOLUTE FIXED BOTTOM INPUT TRAYS */}
        {activeSession && (
          <div className="flex-shrink-0 w-full p-4 bg-[#0B0F19]/80 backdrop-blur border-t border-slate-800 sticky bottom-0 z-10">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2 shadow-2xl">
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isStreaming}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm md:text-base outline-none py-2 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isStreaming || !inputPrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:bg-slate-850"
              >
                {isStreaming ? "..." : "SEND"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}