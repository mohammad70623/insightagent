import React from 'react';
import { Globe, Zap } from 'lucide-react';

const BenchmarkingMatrix = ({ searchMeta, benchmarks }) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-12 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-850 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Globe size={16} className="text-brand-primary animate-pulse" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
                Live Competitor Benchmarking Matrix
              </h4>
              <p className="text-[10px] text-brand-muted mt-0.5">
                Real-time intelligence scraped from global vectors. Query: <span className="text-gray-400 italic">"{searchMeta.query}"</span>
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest bg-[#0B0F19] px-2 py-1 rounded border border-gray-850">
            ⚡ Scraped At: {searchMeta.time || 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold tracking-wider text-brand-muted font-mono uppercase">
              Market Share Shareholder Comparison (%)
            </h5>
            <div className="space-y-3.5">
              {benchmarks.map((comp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${comp.company_name.includes('Our SaaS') || comp.company_name.includes('InsightAgent') ? 'text-brand-primary font-bold' : 'text-gray-300'}`}>
                      {comp.company_name}
                    </span>
                    <span className="font-mono text-white font-bold">{comp.market_share_percentage}%</span>
                  </div>
                  <div className="w-full bg-[#0B0F19] h-2 rounded-md overflow-hidden border border-gray-850/60">
                    <div 
                      style={{ width: `${comp.market_share_percentage}%` }}
                      className={`h-full rounded-md transition-all duration-1000 ${
                        comp.company_name.includes('Our SaaS') || comp.company_name.includes('InsightAgent') ? 'bg-brand-primary' : 'bg-gray-700'
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] w-full flex flex-col justify-between">
            <h5 className="text-[11px] font-bold tracking-wider text-brand-muted font-mono uppercase mb-3">
              Core Scalability Performance Metrics
            </h5>
            <table aria-label="Competitor metadata grid" className="table table-xs w-full border-none">
              <thead>
                <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase text-[10px] font-mono">
                  <th className="bg-transparent pl-0 py-2">Vendor Asset</th>
                  <th className="bg-transparent py-2 text-center">Satisfaction Index</th>
                  <th className="bg-transparent text-right pr-0 py-2">API Latency Vector</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((comp, idx) => (
                  <tr key={idx} className="border-b border-gray-850/30 last:border-none hover:bg-gray-900/10 transition-colors">
                    <td className={`bg-transparent pl-0 py-3 font-semibold ${comp.company_name.includes('Our SaaS') || comp.company_name.includes('InsightAgent') ? 'text-brand-primary' : 'text-white'}`}>
                      {comp.company_name}
                    </td>
                    <td className="bg-transparent text-center py-3 font-mono font-bold text-green-400">
                      {comp.customer_satisfaction_score}%
                    </td>
                    <td className="bg-transparent text-right pr-0 py-3 font-mono font-semibold text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <Zap size={10} className="text-amber-400" /> {comp.api_latency_ms}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkingMatrix;
