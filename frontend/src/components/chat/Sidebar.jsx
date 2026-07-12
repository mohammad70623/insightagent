import React from "react";

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

const Sidebar = ({ 
  sessions, 
  activeSessionId, 
  onSessionSwitch, 
  onSessionDelete,
  newChatTitle, 
  setNewChatTitle, 
  onCreateSession,
  creating,
  isStreaming 
}) => {
  return (
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between h-48 md:h-full flex-shrink-0">
      {/* Left Session Pane: full width on mobile, fixed width on laptop */}
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

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-xs italic p-2">No active sessions.</p>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded text-sm transition font-medium ${
                  activeSessionId === sess.id
                    ? "bg-[#38bdf8] text-gray-900 shadow-lg"
                    : "bg-[#374151] text-gray-300 hover:bg-[#4b5563]"
                }`}
              >
                <button
                  onClick={() => onSessionSwitch(sess.id)}
                  disabled={isStreaming}
                  className="flex-1 text-left truncate py-1 outline-none cursor-pointer flex flex-col"
                >
                  <span className="truncate">📁 {sess.title}</span>
                  <span className={`text-[10px] mt-0.5 ${
                    activeSessionId === sess.id
                      ? "text-gray-800/80 font-medium"
                      : "text-gray-400 group-hover:text-gray-300 transition-colors"
                  }`}>
                    {formatRelativeTime(sess.updated_at || sess.created_at)}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete session "${sess.title}"?`)) {
                      onSessionDelete(sess.id);
                    }
                  }}
                  disabled={isStreaming}
                  title="Delete Session"
                  className={`ml-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors focus:outline-none cursor-pointer ${
                    activeSessionId === sess.id 
                      ? "text-gray-950 hover:bg-black/10 opacity-100" 
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
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