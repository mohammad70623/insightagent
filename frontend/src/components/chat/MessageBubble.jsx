import React from "react";

const MessageBubble = ({ msg, isStreaming, isLast }) => {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 text-sm shadow-md whitespace-pre-wrap leading-relaxed ${
          isUser
            ? "bg-[#38bdf8] text-gray-900 rounded-tr-none font-medium"
            : "bg-[#1f2937] text-gray-100 border border-gray-700 rounded-tl-none font-mono"
        }`}
      >
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-1 font-sans">
          {isUser ? "👨‍💻 USER_PROMPT" : "🤖 LLaMA_STREAM_AGENT"}
        </p>
        <div>
          {msg.content}
          {isStreaming && isLast && !msg.content && "▋"}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;