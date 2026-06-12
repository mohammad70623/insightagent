import React, { useState } from 'react';
import { UploadCloud, MessageSquare, Settings2, MoreVertical, Database, Cpu, HardDrive, X } from 'lucide-react';


export default function Dashboard() {
  
  const [showTip, setShowTip] = useState(true);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      
      
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome to InsightAgent, Alex Rivera [Admin]!
          </h2>
          <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
            Get started by ingesting your first enterprise data modules. Automated AI analytics and intelligence reports are seconds away.
          </p>
        </div>
        
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer">
            <UploadCloud size={15} /> Upload Dataset
          </button>
          <button className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer">
            <MessageSquare size={15} /> New AI Chat
          </button>
          <button className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer">
            <Settings2 size={15} /> Account Settings
          </button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        
        <div className="lg:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-8 shadow-xl flex flex-col justify-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-6">
            Onboarding Checklist
          </h3>
          
          <div className="space-y-6">
            
            <div className="flex items-start gap-4 border-l-2 border-brand-primary pl-4 transition-all">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-primary bg-brand-primary/10 text-brand-primary font-mono text-sm font-black shadow-[0_0_12px_rgba(129,140,248,0.15)]">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Upload Data</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Ingest CSV or JSON files via the native secure Ingest Engine.
                </p>
              </div>
            </div>

            
            <div className="flex items-start gap-4 border-l-2 border-transparent pl-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-main text-gray-500 font-mono text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-400 tracking-wide">Automated AI Processing</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  InsightAgent's RAG and deep LLMs automatically tag, analyze, and index your ingested feedback.
                </p>
              </div>
            </div>

            
            <div className="flex items-start gap-4 border-l-2 border-transparent pl-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-main text-gray-500 font-mono text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-400 tracking-wide">Explore Insights</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Access the core interactive analytics canvas and trigger conversation models with data blocks.
                </p>
              </div>
            </div>
          </div>
        </div>

        
        <div className="lg:col-span-5 relative flex min-h-[260px] items-center justify-center rounded-xl border border-gray-800/40 bg-surface p-6 overflow-hidden shadow-xl">
         
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          
          <div className="relative w-full max-w-sm rounded-lg border border-gray-800/80 bg-[#0B0F19]/90 p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2 mb-4">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-gray-600 uppercase font-bold">Live_Stream_Engine</span>
            </div>
            
           
            <div className="space-y-3">
              <div className="h-2.5 w-1/3 rounded bg-gray-800/80 animate-pulse" />
              <div className="h-20 w-full rounded border border-gray-800/40 bg-gray-900/40 flex items-center justify-center">
                <Database size={24} className="text-brand-primary/30 animate-pulse" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 w-full rounded bg-gray-800/40" />
                <div className="h-1.5 w-4/5 rounded bg-gray-800/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        
        <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted flex items-center gap-2 font-mono">
              🔄 Recent Enterprise Syncs
            </h4>
            <button className="text-gray-600 hover:text-white transition-colors cursor-pointer"><MoreVertical size={16}/></button>
          </div>
          
          <div className="overflow-x-auto text-xs w-full">
            <table className="table table-xs w-full border-none">
              <thead>
                <tr className="border-b border-gray-800 text-brand-muted font-bold">
                  <th className="bg-transparent pl-0 py-2">Asset Name</th>
                  <th className="bg-transparent py-2">Last Sync</th>
                  <th className="bg-transparent text-right pr-0 py-2">Sync Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-850/40">
                  <td className="bg-transparent pl-0 font-medium py-3 text-white">📄 Logistics_June_Data.csv</td>
                  <td className="bg-transparent text-brand-muted py-3">2 mins ago</td>
                  <td className="bg-transparent text-right pr-0 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md tracking-wide">
                      ● SUCCESS
                    </span>
                  </td>
                </tr>
                <tr className="border-none">
                  <td className="bg-transparent pl-0 font-medium py-3 text-white">📄 Sales_Report_Global.json</td>
                  <td className="bg-transparent text-brand-muted py-3">1 hour ago</td>
                  <td className="bg-transparent text-right pr-0 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md tracking-wide">
                      ● SUCCESS
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted flex items-center gap-2 font-mono">
              📊 Enterprise Infrastructure Health
            </h4>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-md">
              ● Live Monitor
            </span>
          </div>
          
          
          <div className="h-16 w-full flex items-end my-2 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 45 Q 60 15, 120 35 T 240 25 T 360 40 T 400 30 L 400 60 L 0 60 Z" fill="url(#waveGrad)" />
              <path d="M0 45 Q 60 15, 120 35 T 240 25 T 360 40 T 400 30" fill="none" stroke="#818CF8" strokeWidth="2" className="animate-pulse" />
            </svg>
          </div>
          
          
          <div className="grid grid-cols-3 gap-3 text-center mt-2">
            <div className="rounded-lg bg-[#0B0F19]/50 p-2.5 border border-gray-850/40">
              <p className="text-[9px] uppercase tracking-wider text-brand-muted font-bold font-mono">Model</p>
              <p className="text-xs font-bold mt-1 text-white flex items-center justify-center gap-1"><Cpu size={12} className="text-brand-primary"/> Ent. Ultra</p>
              <span className="text-[9px] text-gray-500 font-semibold">99.1% Opt</span>
            </div>
            <div className="rounded-lg bg-[#0B0F19]/50 p-2.5 border border-gray-850/40">
              <p className="text-[9px] uppercase tracking-wider text-brand-muted font-bold font-mono">Latency</p>
              <p className="text-xs font-bold mt-1 text-white flex items-center justify-center gap-1"><HardDrive size={12} className="text-brand-primary"/> 12ms</p>
              <span className="text-[9px] text-gray-500 font-semibold">Postgres/Vector</span>
            </div>
            <div className="rounded-lg bg-[#0B0F19]/50 p-2.5 border border-gray-850/40">
              <p className="text-[9px] uppercase tracking-wider text-brand-muted font-bold font-mono">Threads</p>
              <p className="text-xs font-bold mt-1 text-white">Active</p>
              <span className="text-[9px] text-gray-500 font-semibold">12/12 Live</span>
            </div>
          </div>
        </div>

      </div>

     
      {showTip && (
        <div className="flex items-center justify-between rounded-xl border border-gray-800/50 bg-surface px-6 py-3 text-xs text-brand-muted shadow-md transition-all">
          <span className="flex items-center gap-2 leading-relaxed">
            ✨ <strong>Tip:</strong> Use the RAG Agent to find correlations between supply chain data and NOAA archives. Ask <em className="text-gray-300">"What are the main drivers of efficiency loss last quarter?"</em>
          </span>
          <button onClick={() => setShowTip(false)} className="text-gray-500 hover:text-white transition-colors cursor-pointer" aria-label="Dismiss tip">
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
}