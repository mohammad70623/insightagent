import React, { memo } from 'react';

const FeedbackRow = memo(({ item }) => {
  const Icon = item.icon;
  return (
    <tr className="border-b border-gray-850/40 hover:bg-gray-900/10 transition-colors">
      <td className="bg-transparent pl-0 py-3 font-semibold text-white">
        <span className="flex items-center gap-2"><Icon size={12} className="text-brand-primary/80"/> {item.source}</span>
      </td>
      <td className="bg-transparent py-3 text-gray-300 max-w-[200px] truncate" title={item.msg}>{item.msg}</td>
      <td className="bg-transparent py-3">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
          item.severity === 'CRITICAL' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
          item.severity === 'HIGH' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
          'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        }`}>
          {item.severity}
        </span>
      </td>
      <td className="bg-transparent text-right pr-0 py-3 text-brand-muted font-medium">{item.time}</td>
    </tr>
  );
});

const UrgentFeedbacks = ({ urgentFeedbacks }) => {
  return (
    <div className="md:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono flex items-center gap-2">
          🚨 Urgent Feedbacks
        </h4>
        <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer">View All</span>
      </div>
      <div className="overflow-x-auto text-[11px] w-full">
        <table aria-label="Alerts grid" className="table table-xs w-full border-none">
          <thead>
            <tr className="border-b border-gray-800 text-brand-muted font-bold text-left">
              <th className="bg-transparent pl-0 py-2">Source</th>
              <th className="bg-transparent py-2">Message Snippet</th>
              <th className="bg-transparent py-2">Severity</th>
              <th className="bg-transparent text-right pr-0 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {urgentFeedbacks.map((item) => (
              <FeedbackRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UrgentFeedbacks;
