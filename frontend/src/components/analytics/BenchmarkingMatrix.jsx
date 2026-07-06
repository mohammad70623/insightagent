import React from 'react';
import { Globe, Zap } from 'lucide-react';

const BenchmarkingMatrix = ({ searchMeta, benchmarks = [] }) => {
  const query = searchMeta?.query || "Dynamic Web Matrix";
  const timestamp = searchMeta?.time || "2026-07-06 17:09:32 UTC";

  return (
    <div className="lg:col-span-12 bg-[#111625] p-6 rounded-xl border border-[#1e293b] w-full text-white">
      {/* Dynamic Header Metrics Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#1e293b] pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Globe size={16} className="text-indigo-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
              🌐 Live Competitor Benchmarking Matrix
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic font-mono">
              Query: "{query}"
            </p>
          </div>
        </div>
        <div className="bg-slate-900 px-3 py-1.5 rounded-md border border-[#1e293b] text-[9px] font-mono text-amber-400">
          ⚡ SCRAPED AT: {timestamp}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Progress Bars */}
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-4">
            Market Share Comparison (%)
          </h4>
          <div className="space-y-4">
            {benchmarks.length === 0 ? (
              <div className="text-xs text-indigo-400 p-6 font-mono animate-pulse">
                ⚡ Activating LangGraph State Machine & Tavily 2026 Scraper...
              </div>
            ) : (
              benchmarks.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={item.is_user ? "text-indigo-400 font-bold" : "text-slate-300"}>
                      {item.name}
                    </span>
                    <span className="font-semibold font-mono">{item.market_share}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.is_user ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-600'
                      }`}
                      style={{ width: `${item.market_share * 2.5}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Performance Table */}
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-4">
            Core Scalability Performance Metrics
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] text-[10px] tracking-wider uppercase text-[#64748b]">
                  <th className="pb-2 font-semibold">Vendor Asset</th>
                  <th className="pb-2 font-semibold text-center">Satisfaction Index</th>
                  <th className="pb-2 font-semibold text-right">API Latency Vector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-xs">
                {benchmarks.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-slate-500 font-mono text-[10px]">
                      No active competitor data synced.
                    </td>
                  </tr>
                ) : (
                  benchmarks.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-900/40 transition-colors">
                      <td className={`py-3 ${item.is_user ? "text-indigo-400 font-bold" : "text-slate-300"}`}>
                        {item.name}
                      </td>
                      <td className={`py-3 text-center font-semibold font-mono ${
                        item.is_user ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {item.satisfaction}%
                      </td>
                      <td className="py-3 text-right font-mono text-amber-500 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Zap size={10} className="text-amber-400" /> {item.latency}ms
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkingMatrix;
