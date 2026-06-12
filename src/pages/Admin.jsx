import React from 'react';
import { Shield, Users, DollarSign, Activity, Cpu, Search, Filter, Download, MoreVertical, AlertCircle, CheckCircle } from 'lucide-react';


const Admin = () => {
  
  
  const systemMetrics = [
    { title: 'TOTAL MRR', value: '$2.48M', change: '+12.4%', isPositive: true, icon: DollarSign, progress: 'w-[40%]' },
    { title: 'SYSTEM HEALTH', value: 'Operational', change: '99.9%', isPositive: true, icon: Activity },
    { title: 'ACTIVE SESSIONS', value: '18,242', change: 'Peak: 24,000', isPositive: true, icon: Users, toggle: true },
    { title: 'LLM BURN (24H)', value: '$34,812', change: '++$4.2k', isPositive: true, icon: Cpu, subText: 'Current efficiency: 94.2%' },
  ];

 
  const clients = [
    { id: '992-QD-8', name: 'Quantum Dynamics', status: 'ACTIVE', statusColor: 'text-green-400 bg-green-500/10 border-green-500/20', credits: '5,000,000', usage: '82%', barColor: 'bg-brand-primary', barWidth: 'w-[82%]' },
    { id: '412-NB-1', name: 'Nebula Research', status: 'OVER LIMIT', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20', credits: '1,200,000', usage: '104%', barColor: 'bg-red-450', barWidth: 'w-full' },
    { id: '102-VS-4', name: 'Vanguard Security', status: 'PENDING', statusColor: 'text-gray-400 bg-gray-500/10 border-gray-500/20', credits: '12,500,000', usage: '14%', barColor: 'bg-gray-700', barWidth: 'w-[14%]' },
    { id: '556-RM-0', name: 'RetailMax Global', status: 'ACTIVE', statusColor: 'text-green-400 bg-green-500/10 border-green-500/20', credits: '750,000', usage: '65%', barColor: 'bg-brand-primary', barWidth: 'w-[65%]' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      
     
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">System Overview</h2>
        <p className="text-xs text-brand-muted mt-1.5">
          Executive control panel and real-time operational health.
        </p>
      </div>

      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemMetrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex flex-col justify-between min-h-[130px]">
              <div className="flex items-center justify-between text-brand-muted">
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{card.title}</span>
                <Icon size={16} className="text-gray-500" />
              </div>
              
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-white">{card.value}</span>
                
               
                {card.progress && (
                  <div className="w-full bg-gray-900 h-1 rounded-full mt-3 overflow-hidden border border-gray-800/30">
                    <div className={`${card.progress} bg-brand-primary h-full rounded-full`} />
                  </div>
                )}
                
                {card.title === 'SYSTEM HEALTH' && (
                  <div className="flex gap-1 mt-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-1 flex-1 rounded bg-brand-primary/80" />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-brand-muted font-medium">{card.change || card.subText}</span>
                {card.title === 'TOTAL MRR' && <span className="text-green-400 font-bold">+12.4%</span>}
                {card.title === 'LLM BURN (24H)' && <span className="text-red-400 font-bold">+$4.2k</span>}
                {card.toggle && (
                  <div className="w-7 h-4 bg-brand-primary rounded-full p-0.5 flex justify-end items-center cursor-pointer">
                    <div className="w-3 h-3 bg-black rounded-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

     
      <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
        
        {/* Table Filter Controls Ticker */}
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
              Client Management
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              ● Live Sync Active
            </span>
          </div>

         
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search companies..." 
                className="w-full rounded-lg bg-main border border-gray-800/80 pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-brand-primary"
              />
            </div>
            <button className="btn btn-sm bg-main border border-gray-800/80 text-xs text-brand-muted hover:text-white rounded-lg px-3 flex items-center gap-1.5 cursor-pointer">
              <Filter size={13} /> All Statuses
            </button>
            <button className="btn btn-sm bg-main border border-gray-800/80 text-brand-muted hover:text-white rounded-lg p-2 cursor-pointer" aria-label="Download Report">
              <Download size={14} />
            </button>
          </div>
        </div>

        
        <div className="overflow-x-auto text-xs w-full">
          <table className="table table-xs w-full border-none">
            <thead>
              <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase tracking-wider text-[10px] font-mono">
                <th className="bg-transparent pl-0 py-3">Company</th>
                <th className="bg-transparent py-3">Status</th>
                <th className="bg-transparent py-3">Base Credits</th>
                <th className="bg-transparent py-3">Usage (MoM)</th>
                <th className="bg-transparent py-3">Admins</th>
                <th className="bg-transparent text-right pr-0 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-850/40 hover:bg-gray-900/10">
                  
                  
                  <td className="bg-transparent pl-0 py-4 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-main border border-gray-800/80 text-gray-500 shrink-0">
                        <Shield size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{client.name}</p>
                        <p className="text-[10px] text-brand-muted font-mono mt-0.5">ID: {client.id}</p>
                      </div>
                    </div>
                  </td>

                  
                  <td className="bg-transparent py-4">
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border tracking-wide ${client.statusColor}`}>
                      {client.status}
                    </span>
                  </td>

                  
                  <td className="bg-transparent py-4 font-mono font-semibold text-gray-300">
                    {client.credits}
                  </td>

                  
                  <td className="bg-transparent py-4 max-w-[160px]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white shrink-0">{client.usage}</span>
                      <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden border border-gray-800/40">
                        <div className={`${client.barColor} ${client.barWidth} h-full rounded-full`} />
                      </div>
                    </div>
                  </td>

                 
                  <td className="bg-transparent py-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <div className="inline-block h-5 w-5 rounded-full ring-1 ring-surface bg-brand-primary/20" />
                      <div className="inline-block h-5 w-5 rounded-full ring-1 ring-surface bg-purple-500/20" />
                      {client.name === 'Quantum Dynamics' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[8px] font-black text-gray-400 ring-1 ring-surface">+4</div>
                      )}
                    </div>
                  </td>

                  
                  <td className="bg-transparent text-right pr-0 py-4 font-semibold">
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-[11px] text-brand-muted hover:text-white transition-colors cursor-pointer bg-transparent border-none">Credits</button>
                      <button className="text-[11px] text-brand-muted hover:text-white transition-colors cursor-pointer bg-transparent border-none">Impersonate</button>
                      <button className="text-gray-600 hover:text-white cursor-pointer p-0.5 bg-transparent border-none"><MoreVertical size={14} /></button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
        <div className="flex items-center justify-between text-[11px] text-brand-muted pt-4 border-t border-gray-850/40 mt-4 font-medium">
          <span>Showing 1-10 of 142 clients</span>
          <div className="flex items-center gap-1 font-mono">
            <button className="h-6 px-2 rounded border border-gray-800 bg-main text-white font-bold cursor-pointer">1</button>
            <button className="h-6 px-2 rounded hover:bg-gray-900 transition-colors cursor-pointer">2</button>
            <button className="h-6 px-2 rounded hover:bg-gray-900 transition-colors cursor-pointer">3</button>
            <span>...</span>
          </div>
        </div>

      </div>

      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        
        {/* Infrastructure Pulse (Left 5 Columns) */}
        <div className="md:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              Infrastructure Pulse
            </h4>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-850/40"><span className="text-gray-400 font-medium">GPT-4 Turbo</span><span className="text-green-400 font-bold flex items-center gap-1">Active</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-850/40"><span className="text-gray-400 font-medium">Claude 3 Opus</span><span className="text-green-400 font-bold flex items-center gap-1">Active</span></div>
            <div className="flex justify-between py-1.5"><span className="text-gray-400 font-medium">Vector DB (Pinecone)</span><span className="text-brand-muted font-mono">Latency: 12ms</span></div>
          </div>
        </div>

       
        <div className="md:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              🛡️ Security & System Events
            </h4>
            <span className="text-[10px] text-gray-500 hover:text-white cursor-pointer font-semibold">View Log</span>
          </div>

          <div className="space-y-3.5 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold">Suspicious login attempt detected (RetailMax Global)</p>
                <p className="text-gray-500 font-mono text-[10px] mt-0.5">San Jose, CA • 4 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-gray-850/30 pt-3">
              <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-300 font-medium"><strong className="text-white font-bold">Admin role granted</strong> to J. Miller (Vanguard Security)</p>
                <p className="text-gray-500 font-mono text-[10px] mt-0.5">System Action • 1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Admin;