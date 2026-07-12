import React, { useEffect, useRef } from "react";

const ChatInput = ({ inputPrompt, setInputPrompt, onSendMessage, activeSessionId, isStreaming }) => {
  const inputRef = useRef(null);

  // Auto-focus trigger on session switch Matrix
  useEffect(() => {
    if (activeSessionId && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [activeSessionId, isStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent w-full z-30">
      <form onSubmit={onSendMessage} className="max-w-4xl mx-auto flex gap-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask me anything..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-3 bg-[#111827] border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#38bdf8] disabled:opacity-50 font-sans"
          disabled={!activeSessionId || isStreaming}
        />
        <button
          type="submit"
          disabled={!activeSessionId || isStreaming || !inputPrompt.trim()}
          className="px-6 py-3 bg-[#38bdf8] text-gray-900 font-bold rounded-lg text-sm hover:bg-[#7dd3fc] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-200 shadow-md uppercase tracking-wider"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;