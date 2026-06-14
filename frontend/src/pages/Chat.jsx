import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Send, Bot, User, MessageSquare, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';


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


const ChatMessage = memo(({ msg, renderMarkdown }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 max-w-3xl animate-fade-in ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${
        isUser ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-surface border-gray-800 text-purple-400 shadow-md'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed font-medium shadow-md whitespace-pre-line ${
        isUser ? 'bg-brand-primary text-black font-semibold' : 'bg-[#0B0F19]/80 border border-gray-850/60 text-gray-200'
      }`}>
        {renderMarkdown(msg.content)}
      </div>
    </div>
  );
});


const Chat = () => {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Hello Alex! I have successfully indexed **"Q4_Financial_Report.csv"** into the pgvector database. How can I assist you with your enterprise data diagnostics today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
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

  
  const renderMarkdown = useMemo(() => {
    return (text) => {
      const codeBlockRegex = /```([\s\S]+?)```/g;
      const boldRegex = /\*\*([\s\S]+?)\*\"/g;

      
      const cleanText = escapeHtml(text);
      const parts = cleanText.split(codeBlockRegex);

      return parts.map((part, index) => {
        if (index % 2 !== 0) {
          
          return <CodeBlock key={index} code={part.trim()} />;
        }

        const subParts = part.split(boldRegex);
        return (
          <span key={index}>
            {subParts.map((subPart, subIndex) => 
              subIndex % 2 !== 0 ? <strong key={subIndex} className="text-brand-primary font-bold">{subPart}</strong> : subPart
            )}
          </span>
        );
      });
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiTyping) return;

    const generateId = () => (typeof window !== 'undefined' && window.crypto?.randomUUID) ? window.crypto.randomUUID() : `msg-${Date.now()}-${Math.random()}`;
    
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: inputMessage.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsAiTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Based on a semantic vector lookup within your **"Q4_Financial_Report.csv"**, the operational costs saw a **14.6% spike** primarily driven by logistics bottlenecks. 

You can query the database directly using this SQL vector function:
\`\`\`sql
SELECT file_name, embedding <=> '"Q4_Anomaly_Vector"' AS distance 
FROM data_sources 
WHERE distance < 0.15;
\`\`\`
Review the logs or trigger a comparative analysis pipeline.`
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto rounded-xl border border-gray-800/40 bg-surface overflow-hidden font-sans animate-fade-in">
      
     
      <div className="hidden w-72 border-r border-gray-850 bg-[#0B0F19]/40 flex-col p-4 md:flex">
        <div className="flex items-center justify-between pb-4 border-b border-gray-850 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono flex items-center gap-1.5">
            <MessageSquare size={14} /> Agent Sessions
          </span>
          <button className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold px-2 py-0.5 rounded flex items-center gap-1 hover:bg-brand-primary/20 transition-all cursor-pointer">
            <Sparkles size={10} /> Reset
          </button>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-primary/5 border border-brand-primary/20 text-xs font-medium text-brand-primary cursor-pointer">
            <MessageSquare size={14} className="shrink-0" />
            <span className="truncate">Q4 Logistics Diagnostics</span>
          </div>
          <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-transparent text-xs font-medium text-brand-muted hover:bg-gray-900/40 hover:text-white transition-all cursor-pointer">
            <MessageSquare size={14} className="shrink-0" />
            <span className="truncate">Customer Feedback Clusters</span>
          </div>
        </div>
      </div>

      
      <div className="flex flex-1 flex-col bg-transparent justify-between overflow-hidden">
        
        <div className="px-6 py-3 border-b border-gray-850 flex items-center justify-between bg-[#0B0F19]/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-white">Active RAG Node: LLaMA-3-Enterprise-8B</span>
          </div>
          <span className="text-[10px] font-mono text-brand-muted">Context: 2 Source Files Active</span>
        </div>

        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} renderMarkdown={renderMarkdown} />
          ))}

          {isAiTyping && (
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
        </div>

        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-850 bg-[#0B0F19]/20">
          <div className="relative flex items-center">
            <input
              type="text"
              required
              disabled={isAiTyping}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isAiTyping ? "Please wait for response..." : "Ask your knowledge-base anything..."}
              className="w-full rounded-xl border border-gray-800 bg-surface pl-4 pr-12 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 disabled:opacity-40 font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isAiTyping}
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