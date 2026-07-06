import React, { memo, useState } from 'react';
import { Mail, MessageSquare, MessageCircle, AlertCircle, ChevronDown, ChevronUp, User, Calendar, Tag, ShieldAlert } from 'lucide-react';

const FeedbackRow = memo(({ item, isExpanded, onToggle }) => {
  // Determine standard source icon dynamically
  let IconComponent;
  if (item.source === 'Email') IconComponent = Mail;
  else if (item.source === 'Chat') IconComponent = MessageSquare;
  else if (item.source === 'Twitter') IconComponent = MessageCircle;
  else IconComponent = AlertCircle;

  const sender = item.sender_name || "Anonymous";
  const subject = item.subject || "No Subject";
  const snippet = item.message_snippet || "No preview available.";
  const timeStr = item.time || item.timestamp || "Just now";

  return (
    <div className="border-b border-gray-850/30 hover:bg-slate-900/40 transition-colors">
      {/* Row Header */}
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer gap-4 text-xs"
      >
        {/* Left: Sender Name */}
        <div className="flex items-center gap-2.5 w-[140px] flex-shrink-0">
          <IconComponent size={12} className={item.red_flag ? "text-red-500 flex-shrink-0" : "text-[#6366f1] flex-shrink-0"} />
          <span className="font-extrabold text-white tracking-wide truncate" title={sender}>
            {sender}
          </span>
          {item.red_flag && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
          )}
        </div>

        {/* Middle: Subject - Preview Snippet */}
        <div className="flex-1 min-w-0 truncate text-slate-300">
          <span className="font-bold text-white pr-1.5">{subject}</span>
          <span className="text-[#94a3b8] font-normal">- {snippet}</span>
        </div>

        {/* Right: Timestamp & Expand Caret */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            {timeStr}
          </span>
          {isExpanded ? (
            <ChevronUp size={12} className="text-slate-400" />
          ) : (
            <ChevronDown size={12} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Expandable Message Details panel */}
      {isExpanded && (
        <div className="mx-4 mb-4 p-5 rounded-xl bg-[#090d16] border border-red-500/20 space-y-4 animate-fade-in text-xs">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#94a3b8] font-mono border-b border-gray-850/50 pb-3">
            <div className="flex items-center gap-2 truncate">
              <User size={12} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">From:</span>
              <span className="text-white font-medium truncate" title={sender}>{sender}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">Received:</span>
              <span className="text-white font-medium">{timeStr}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Tag size={12} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">Triage Severity:</span>
              <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/10 ml-1`}>
                {item.severity}
              </span>
            </div>
          </div>

          {/* Full Body Context */}
          <div className="space-y-1.5">
            <h5 className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
              <ShieldAlert size={11} className="text-red-500" />
              Original Message Body
            </h5>
            <div className="p-4 rounded-lg bg-[#0d1220] border border-slate-900 text-[#d1d5db] font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
              {item.body || item.msg || item.message_snippet || "No ticket content body available."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const UrgentFeedbacks = ({ urgentFeedbacks = [] }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Compute the absolute latest detected alert time dynamically
  const lastDetectedTime = urgentFeedbacks.length > 0 
    ? (urgentFeedbacks[0].time || urgentFeedbacks[0].timestamp || 'N/A')
    : null;

  return (
    <div className="md:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl text-white">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-gray-850 pb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono flex flex-wrap items-center gap-2">
          <span>🚨 Urgent Feedbacks</span>
          {lastDetectedTime && (
            <span className="text-[9px] text-red-400 font-medium px-2.5 py-0.5 bg-red-500/10 rounded-full border border-red-500/20 font-mono lowercase normal-case tracking-normal animate-pulse">
              last detected: {lastDetectedTime}
            </span>
          )}
        </h4>
        <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer">
          Inbox Queue
        </span>
      </div>

      {/* Inbox Row Stack List */}
      <div className="divide-y divide-gray-850/40 max-h-[350px] overflow-y-auto">
        {urgentFeedbacks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-[10px]">
            ⚡ Inbox is clean. No unread emergency tickets active.
          </div>
        ) : (
          urgentFeedbacks.map((item) => (
            <FeedbackRow 
              key={item.id} 
              item={item} 
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UrgentFeedbacks;
