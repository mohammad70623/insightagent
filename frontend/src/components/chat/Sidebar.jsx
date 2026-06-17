import React from "react";

const Sidebar = ({ 
  sessions, 
  activeSessionId, 
  onSessionSwitch, 
  newChatTitle, 
  setNewChatTitle, 
  onCreateSession,
  creating,
  isStreaming 
}) => {
  return (
    <div className="w-80 bg-[#1f2937] border-r border-gray-700 flex flex-col justify-between">
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-xl font-bold tracking-wider mb-4 text-[#38bdf8] flex items-center gap-2">
          <span>🧠</span> InsightAgent
        </h2>
        
        <form onSubmit={onCreateSession} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder={creating ? "Creating Matrix..." : "New Session Name..."}
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            disabled={creating || isStreaming}
            className="flex-1 px-3 py-2 bg-[#111827] border border-gray-600 rounded text-sm focus:outline-none focus:border-[#38bdf8] disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={creating || isStreaming || !newChatTitle.trim()}
            className="px-3 py-2 bg-[#38bdf8] text-gray-900 rounded font-bold hover:bg-[#7dd3fc] transition disabled:bg-gray-700 disabled:text-gray-500"
          >
            {creating ? "..." : "+"}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-xs italic p-2">No active sessions.</p>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.id}
                onClick={() => onSessionSwitch(sess.id)}
                className={`w-full text-left px-3 py-2.5 rounded text-sm transition font-medium truncate block ${
                  activeSessionId === sess.id
                    ? "bg-[#38bdf8] text-gray-900 shadow-lg"
                    : "bg-[#374151] text-gray-300 hover:bg-[#4b5563]"
                }`}
                disabled={isStreaming}
              >
                📁 {sess.title}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 bg-[#111827] text-xs text-gray-400 text-center font-mono">
        SECURE_NODE_V2
      </div>
    </div>
  );
};

export default Sidebar;