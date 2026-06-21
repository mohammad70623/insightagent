import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Send, Bot, User, MessageSquare, Sparkles, RefreshCw, Copy, Check, Zap, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api'; 

// ==========================================
// 💻 COMPONENT 1: PREMIUM CODEBLOCK RENDERER
// ==========================================
const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative group my-3">
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={handleCopy}
          type="button"
          className="p-1.5 rounded bg-gray-900 border border-gray-800 text-brand-muted hover:text-white transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="bg-black/50 border border-gray-800 rounded-lg p-4 font-mono text-[11px] text-brand-primary overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ==========================================
// 💬 COMPONENT 2: OPTIMIZED MEMO CHAT BUBBLE
// ==========================================
const ChatMessage = memo(({ msg, renderMarkdown }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 max-w-3xl w-full animate-fade-in ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${
        isUser ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-surface border-gray-800 text-purple-400 shadow-md'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed font-medium shadow-md whitespace-pre-wrap break-words overflow-hidden ${
        isUser ? 'bg-brand-primary text-black font-semibold' : 'bg-[#0B0F19]/80 border border-gray-850/60 text-gray-200'
      }`}>
        {renderMarkdown(msg.content)}
      </div>
    </div>
  );
});

// ==========================================
// 🏗️ MAIN COMPONENT: REAL LIVE CORE AGENT
// ==========================================
const Chat = () => {
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [globalError, setGlobalError] = useState(null); 

  const bufferRef = useRef("");
  const throttleTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const escapeHtml = (unsafeText) => {
    return unsafeText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 📋 Markdown Parser (Handles Codes & Bold Embeds Safely)
  const renderMarkdown = useMemo(() => {
    return (text) => {
      if (!text) return "";
      const codeBlockRegex = /```([\s\S]+?)```/g;
      const boldRegex = /\*\*([\s\S]+?)\*\*/g; 

      const cleanText = escapeHtml(text);
      const parts = cleanText.split(codeBlockRegex);

      return parts.map((part, index) => {
        if (index % 2 !== 0) {
          return <CodeBlock key={index} code={part.trim()} />;
        }

        const subParts = part.split(boldRegex);
        return (
          <span key={index} className="whitespace-pre-wrap">
            {subParts.map((subPart, subIndex) => 
              subIndex % 2 !== 0 ? (
                <strong key={subIndex} className="text-brand-primary font-bold mx-0.5">
                  {subPart}
                </strong>
              ) : (
                subPart
              )
            )}
          </span>
        );
      });
    };
  }, []);

  // Workspace Actions
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    setGlobalError(null);
    try {
      const response = await apiService.post("/api/v1/chat/session", {
        title: sessionTitle.trim(),
      });

      if (response && response.id) {
        setSessions((prev) => [response, ...prev]);
        setActiveSessionId(response.id);
        setMessages([
          { id: 'init', role: 'assistant', content: `Successfully initialized isolated RAG workspace context: **"${response.title}"**. Inject a custom prompt vector to begin analysis.` }
        ]);
        setSessionTitle("");
      }
    } catch (err) {
      setGlobalError("Workspace Initialization Error: Failed to provision target secure agent boundary.");
    }
  };

  // 🌊 High-Performance Stream Consumer Pipeline
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiTyping || !activeSessionId) return;

    const userPrompt = inputMessage.trim();
    setInputMessage('');
    setGlobalError(null);

    const generateId = () => (typeof window !== 'undefined' && window.crypto?.randomUUID) ? window.crypto.randomUUID() : `msg-${Date.now()}`;
    
    const userMessage = { id: generateId(), role: 'user', content: userPrompt };
    const assistantMessageId = generateId();
    const newAssistantMessage = { id: assistantMessageId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMessage, newAssistantMessage]);
    setIsAiTyping(true);

    bufferRef.current = "";
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }

    try {
      const responseStream = await apiService.getStream(
        `/api/v1/chat/stream/${activeSessionId}`,
        { user_prompt: userPrompt }
      );

      const reader = responseStream.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = ""; // 💡 Crucial: Local buffer solves incomplete packet fragmentation

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Feed network packets directly to internal parser memory
        streamBuffer += decoder.decode(value, { stream: true });

        let lineEndIndex;
        // Process line-by-line only when full new-line boundary (\n) exists
        while ((lineEndIndex = streamBuffer.indexOf("\n")) !== -1) {
          const line = streamBuffer.slice(0, lineEndIndex);
          streamBuffer = streamBuffer.slice(lineEndIndex + 1);

          // Handle standard secure SSE pattern
          if (line.startsWith("data: ")) {
            const pureToken = line.slice(6); // Slice prefix without trimming layout whitespace

            if (pureToken) {
              bufferRef.current += pureToken;

              // ⏱️ 60ms High-Frequency UI Refresh Throttler
              if (!throttleTimerRef.current) {
                throttleTimerRef.current = setTimeout(() => {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: bufferRef.current } 
                        : msg
                    )
                  );
                  throttleTimerRef.current = null;
                }, 60);
              }
            }
          }
        }
      }
    } catch (err) {
      setGlobalError("Stream Pipeline Collapse: Core connection matrix timed out or authorization expired.");
    } final {
      setIsAiTyping(false);
      // Synchronize trailing tokens
      setTimeout(() => {
        if (bufferRef.current) {
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId 
                ? { ...msg, content: bufferRef.current } 
                : msg
            )
          );
        }
      }, 100);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto rounded-xl border border-gray-800/40 bg-surface overflow-hidden font-sans animate-fade-in relative">
      
      {globalError && (
        <div className="absolute top-16 left-6 right-6 z-50 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono flex items-center gap-2 shadow-2xl animate-pulse">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="flex-1">{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="hover:text-white font-bold px-1 cursor-pointer">×</button>
        </div>
      )}

      {/* 🗂️ SIDEBAR LAYER */}
      <div className="hidden w-72 border-r border-gray-850 bg-[#0B0F19]/40 flex-col p-4 md:flex space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-850">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono flex items-center gap-1.5">
            <MessageSquare size={14} /> Agent Sessions
          </span>
        </div>

        <form onSubmit={handleCreateSession} className="flex gap-2">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="New Workspace Title..."
            className="flex-1 bg-black/30 border border-gray-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-brand-primary transition-all"
          />
          <button type="submit" className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold px-2.5 rounded text-xs hover:bg-brand-primary/20 transition-all cursor-pointer">+</button>
        </form>

        <div className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic px-2">No active database nodes initialized.</p>
          ) : (
            sessions.map((sess) => (
              <div 
                key={sess.id}
                onClick={() => {
                  setActiveSessionId(sess.id);
                  setMessages([{ id: 'switch', role: 'assistant', content: `Switched uplink connection to node context: **"${sess.title}"**. Awaiting telemetry vector commands.` }]);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  activeSessionId === sess.id 
                    ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary shadow-inner' 
                    : 'bg-transparent border-transparent text-brand-muted hover:bg-gray-900/40 hover:text-white'
                }`}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">{sess.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🎨 MAIN INTERFACE LAYER */}
      <div className="flex flex-1 flex-col bg-transparent justify-between overflow-hidden relative">
        <div className="px-6 py-3 border-b border-gray-850 flex items-center justify-between bg-[#0B0F19]/20">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full tracking-wide ${activeSessionId ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            <span className="text-xs font-bold text-white">
              {activeSessionId ? "Active RAG Node: LLaMA-3-Enterprise-8B" : "Awaiting Security Connection Uplink"}
            </span>
          </div>
          
          {isAiTyping && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest animate-pulse">
              <Zap size={10} />
              <span>⚡ STREAM ACTIVE</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!activeSessionId ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-40 select-none space-y-3">
              <div className="text-4xl animate-bounce">🛰️</div>
              <p className="text-xs font-mono text-brand-muted max-w-xs leading-relaxed">
                Please construct or execute an active user session container on the left control pane to ignite vector streaming loops.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} renderMarkdown={renderMarkdown} />
              ))}
              
              {isAiTyping && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-4 mr-auto max-w-3xl animate-pulse">
                  <div className="h-8 w-8 rounded-lg border bg-surface border-gray-800 text-purple-400 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-xl px-4 py-3 bg-[#0B0F19]/80 border border-gray-850/60 flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-brand-primary" />
                    <span className="text-[11px] text-brand-muted font-mono tracking-wide font-medium">Agent is executing vector search...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-850 bg-[#0B0F19]/20">
          <div className="relative flex items-center">
            <input
              type="text"
              required
              disabled={isAiTyping || !activeSessionId}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={!activeSessionId ? "Terminal Locked." : isAiTyping ? "Please wait for stream processing..." : "Ask your knowledge-base anything..."}
              className="w-full rounded-xl border border-gray-850 bg-surface pl-4 pr-12 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 disabled:opacity-40 font-medium tracking-wide shadow-2xl"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isAiTyping || !activeSessionId}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-black hover:bg-indigo-400 transition-all disabled:opacity-30 disabled:hover:bg-brand-primary cursor-pointer active:scale-[0.96]"
              aria-label="Send message to AI"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;