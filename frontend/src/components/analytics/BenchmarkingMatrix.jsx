import React, { useState } from 'react';
import { Globe, Zap, X, ShieldAlert, Award, Compass, Coins, Target } from 'lucide-react';

const BenchmarkingMatrix = ({ searchMeta, benchmarks = [] }) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  
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
              🌐 Market Positioning & Competitive Insights
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 italic font-mono">
              Insights: Real-time industry standing based on current 2026 market intelligence.
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-semibold tracking-widest text-[#64748b] uppercase">
              Market Share Comparison (%)
            </h4>
            <span className="text-[9px] font-mono text-indigo-400/80 uppercase">Click rival row to open battlecard</span>
          </div>
          <div className="space-y-4">
            {benchmarks.length === 0 ? (
              <div className="text-xs text-indigo-400 p-6 font-mono animate-pulse">
                ⚡ Activating LangGraph State Machine & Tavily 2026 Scraper...
              </div>
            ) : (
              benchmarks.map((item) => (
                <div 
                  key={item.name} 
                  className={`space-y-1.5 p-1.5 rounded transition-all ${
                    item.is_user 
                      ? 'bg-transparent' 
                      : 'cursor-pointer hover:bg-slate-900/60 border border-transparent hover:border-[#1e293b]'
                  }`}
                  onClick={() => !item.is_user && setSelectedCompetitor(item)}
                  title={item.is_user ? '' : `Open ${item.name} Strategic Battlecard`}
                >
                  <div className="flex justify-between text-xs">
                    <span className={item.is_user ? "text-indigo-400 font-bold" : "text-slate-300 flex items-center gap-1.5"}>
                      {!item.is_user && <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />}
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
            Service Performance Overview
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] text-[10px] tracking-wider uppercase text-[#64748b]">
                  <th className="pb-2 font-semibold">Market Player</th>
                  <th className="pb-2 font-semibold text-center">Satisfaction Index</th>
                  <th className="pb-2 font-semibold text-right">Response Time</th>
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
                    <tr 
                      key={item.name} 
                      className={`transition-colors ${
                        item.is_user 
                          ? 'bg-transparent' 
                          : 'cursor-pointer hover:bg-slate-900/60'
                      }`}
                      onClick={() => !item.is_user && setSelectedCompetitor(item)}
                      title={item.is_user ? '' : `Open ${item.name} Strategic Battlecard`}
                    >
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

      {/* Polish Glassmorphic Drill-Down SWAT & Battlecard Modal */}
      {selectedCompetitor && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setSelectedCompetitor(null)}
        >
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#0f1424] to-[#0c0f1b] border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-indigo-500/10 bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
                  <Award size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                    Competitive Battlecard
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    InsightAgent vs {selectedCompetitor.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCompetitor(null)}
                className="p-1.5 bg-slate-900 border border-[#1e293b] rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
              
              {/* Rival Header Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/40 border border-[#1e293b] text-center font-mono">
                <div>
                  <div className="text-[10px] uppercase text-[#64748b]">Market Share</div>
                  <div className="text-lg font-bold text-white mt-1">{selectedCompetitor.market_share}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#64748b]">Satisfaction</div>
                  <div className="text-lg font-bold text-green-400 mt-1">{selectedCompetitor.satisfaction}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#64748b]">Response Time</div>
                  <div className="text-lg font-bold text-amber-500 mt-1">{selectedCompetitor.latency}ms</div>
                </div>
              </div>

              {/* Vector 1: Operational Strategy */}
              <div className="p-4 rounded-xl bg-[#131728] border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                <h5 className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase font-mono mb-2">
                  <Compass size={14} /> 1. Core Operational Strategy
                </h5>
                <p className="text-[#d1d5db] text-xs leading-relaxed">
                  {selectedCompetitor.strategic_intelligence?.operational_strategy || "Operational profile extraction processing."}
                </p>
              </div>

              {/* Vector 2: Revenue Footprint */}
              <div className="p-4 rounded-xl bg-[#131728] border border-amber-500/10 hover:border-amber-500/20 transition-colors">
                <h5 className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono mb-2">
                  <Coins size={14} /> 2. Estimated Revenue Engine
                </h5>
                <p className="text-[#d1d5db] text-xs leading-relaxed">
                  {selectedCompetitor.strategic_intelligence?.revenue_footprint || "Revenue structures and vulnerabilities loading."}
                </p>
              </div>

              {/* Vector 3: Core Weakness */}
              <div className="p-4 rounded-xl bg-[#131728] border border-[#f87171]/10 hover:border-[#f87171]/20 transition-colors">
                <h5 className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase font-mono mb-2">
                  <ShieldAlert size={14} /> 3. Vulnerable Technical & Product Gaps
                </h5>
                <p className="text-[#d1d5db] text-xs leading-relaxed">
                  {selectedCompetitor.strategic_intelligence?.core_weakness || "Vulnerability scan matrix loading."}
                </p>
              </div>

              {/* Vector 4: Tactical Battle Plan */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#10192e] to-[#0c1f24] border border-emerald-500/20 hover:border-emerald-500/35 transition-colors">
                <h5 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase font-mono mb-2">
                  <Target size={14} /> 4. Attack Plan (Where to Fight & Win)
                </h5>
                <p className="text-[#e2e8f0] text-xs leading-relaxed font-medium">
                  {selectedCompetitor.strategic_intelligence?.battle_plan || "Strategic attack directives preparing."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-indigo-500/10 bg-slate-950/20 flex justify-between items-center text-[10px] font-mono text-slate-500 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live 2026 Scraping Context
              </span>
              <button 
                onClick={() => setSelectedCompetitor(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer transition-all"
              >
                Close Battlecard
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkingMatrix;
