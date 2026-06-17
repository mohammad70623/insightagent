import React from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

const UI_TEXT = {
  ACTIVE: "🟢 Secure Stream Terminal Activated",
  AWAITING: "⚪ Awaiting Session Matrix",
  EMPTY_PANEL: "Please select or create an agent session on the left pane to begin execution.",
  UPLINK: "Workspace Empty. Uplink established. Awaiting user injection..."
};

const ChatWindow = ({ 
  activeSessionId, 
  messages, 
  isStreaming, 
  inputPrompt, 
  setInputPrompt, 
  onSendMessage, 
  chatBottomRef 
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[#111827]">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-[#1f2937] border-b border-gray-700 flex justify-between items-center shadow-md">
        <div>
          <h3 className="font-bold text-lg text-gray-100">
            {activeSessionId ? UI_TEXT.ACTIVE : UI_TEXT.AWAITING}
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            SESSION_UUID: {activeSessionId || "NULL_POINTER"}
          </p>
        </div>
        {isStreaming && (
          <span className="text-xs font-mono bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
            ⚡ RECEIVING CHUNKS...
          </span>
        )}
      </div>

      {/* Messages Stream Screen */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {!activeSessionId ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
            <span className="text-4xl">🚀</span>
            <p className="text-sm font-medium">{UI_TEXT.EMPTY_PANEL}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-1">
            <span className="text-2xl">📡</span>
            <p className="text-xs font-mono">{UI_TEXT.UPLINK}</p>
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

      {/* Embedded Input Terminal */}
      <ChatInput 
        inputPrompt={inputPrompt}
        setInputPrompt={setInputPrompt}
        onSendMessage={onSendMessage}
        activeSessionId={activeSessionId}
        isStreaming={isStreaming}
      />
    </div>
  );
};

export default ChatWindow;