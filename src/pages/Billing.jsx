import React, { useMemo, memo } from 'react';
import { CreditCard, Zap, Download, ArrowUpRight, ShieldAlert } from 'lucide-react';


const STATUS_STYLES = {
  SUCCESS: "text-green-400 bg-green-500/10 border-green-500/20",
  FAILED: "text-red-400 bg-red-500/10 border-red-500/20",
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20"
};


const MOCK_INVOICES = [
  { id: 'INV-2024-0012', date: 'Nov 14, 2024', amount: '$2,499.00', status: 'SUCCESS' },
  { id: 'INV-2024-0011', date: 'Oct 14, 2024', amount: '$2,499.00', status: 'SUCCESS' },
  { id: 'INV-2024-0010', date: 'Sep 14, 2024', amount: '$2,499.00', status: 'SUCCESS' },
  { id: 'INV-2024-0009', date: 'Aug 14, 2024', amount: '$1,850.00', status: 'SUCCESS' },
];


const InvoiceRow = memo(({ invoice }) => (
  <tr className="border-b border-gray-850/40 hover:bg-gray-900/10 transition-colors">
    <td className="bg-transparent pl-0 py-3.5 font-medium text-gray-300 font-mono">{invoice.date}</td>
    <td className="bg-transparent py-3.5 text-brand-primary font-mono font-semibold">{invoice.id}</td>
    <td className="bg-transparent py-3.5 text-white font-mono font-bold">{invoice.amount}</td>
    <td className="bg-transparent py-3.5">
      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-black px-2 py-0.5 rounded border tracking-wider ${STATUS_STYLES[invoice.status] || STATUS_STYLES.PENDING}`}>
        ● {invoice.status}
      </span>
    </td>
    <td className="bg-transparent text-right pr-0 py-3.5">
      <button 
        type="button" 
        className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-white focus:text-white transition-colors cursor-pointer bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/40 rounded px-1 py-0.5"
        aria-label={`Download invoice ${invoice.id}`}
      >
        <Download size={13} /> Download PDF
      </button>
    </td>
  </tr>
));


const Billing = () => {
  
  const currentUsage = 12400;
  const maxUsage = 50000;

  
  const usagePercentage = useMemo(() => {
    if (maxUsage === 0) return 0;
    return (currentUsage / maxUsage) * 100;
  }, [currentUsage, maxUsage]);

  const formattedRemaining = useMemo(() => {
    const remainingUnits = maxUsage - currentUsage;
    
    return `${(remainingUnits / 1000).toFixed(1)}k`;
  }, [currentUsage, maxUsage]);

  const formattedMax = useMemo(() => {
    return `${Math.round(maxUsage / 1000)}k`;
  }, [maxUsage]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      
     
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Billing & Subscriptions</h2>
        <p className="text-xs text-brand-muted mt-1.5">
          Manage your enterprise plan, usage metrics, and billing history.
        </p>
      </div>

      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
       
        <div className="lg:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B0F19] border border-gray-800 text-brand-primary shadow-md">
                <CreditCard size={22} />
              </div>
              <div>
                <span className="inline-flex items-center text-[9px] font-bold tracking-widest text-brand-muted bg-gray-900 px-2 py-0.5 rounded border border-gray-800 font-mono">ACTIVE PLAN</span>
                <h3 className="text-xl font-bold text-white mt-1.5 tracking-tight">Enterprise Pro</h3>
              </div>
            </div>
            <span className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded font-mono text-gray-400 font-bold uppercase tracking-wider">Monthly</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-850/40 pt-4 mt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono">Next Renewal</p>
              <p className="text-sm font-bold text-white mt-1">Dec 14, 2024</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono">Current Rate</p>
              <p className="text-sm font-bold text-white mt-1">$2,499.00 <span className="text-[10px] text-brand-muted font-normal">/mo</span></p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" className="btn btn-sm bg-brand-primary text-black font-bold text-xs rounded-lg px-4 hover:bg-indigo-400 focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 cursor-pointer">Upgrade Plan</button>
            <button type="button" className="btn btn-sm bg-[#0B0F19] border border-gray-800 text-xs text-gray-300 hover:text-white rounded-lg px-4 focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 cursor-pointer">Manage Payment</button>
          </div>
        </div>

        
        <div className="lg:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Zap size={15} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted font-mono">USAGE STATUS</h4>
                  <h3 className="text-sm font-bold text-white mt-0.5">Compute Units</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-muted font-mono">REMAINING</p>
                
                <p className="text-sm font-black text-brand-primary font-mono mt-0.5">
                  {formattedRemaining} / {formattedMax}
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex justify-between text-[10px] font-bold font-mono text-brand-muted uppercase tracking-wider">
                <span>Efficiency Index</span>
                <span>{usagePercentage.toFixed(1)}% Used</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800/40">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${usagePercentage}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/40 p-3.5 flex items-start gap-2.5 mt-4">
            <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-brand-muted leading-relaxed font-medium">
              Your usage is trending <span className="text-amber-400 font-bold">12% lower</span> than last month. Consider downgrading if this trend continues for another 15 days to optimize costs.
            </p>
          </div>
        </div>

      </div>

     
      <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 id="ledger-table-title" className="text-xs font-bold uppercase tracking-widest text-white font-mono">
            Billing Ledger
          </h3>
          
          <button 
            type="button" 
            aria-label="Filter historical billing ledger records"
            className="text-[11px] text-brand-muted hover:text-white font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none focus:underline"
          >
            Filter Records
          </button>
        </div>

        <div className="overflow-x-auto text-xs w-full">
          <table aria-labelledby="ledger-table-title" className="table table-xs w-full border-none">
            <thead>
              <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase tracking-wider text-[10px] font-mono">
                <th scope="col" className="bg-transparent pl-0 py-3">Date</th>
                <th scope="col" className="bg-transparent py-3">Invoice ID</th>
                <th scope="col" className="bg-transparent py-3">Amount</th>
                <th scope="col" className="bg-transparent py-3">Status</th>
                <th scope="col" className="bg-transparent text-right pr-0 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

     
      <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-1.5 max-w-xl">
          <h4 className="text-sm font-bold text-white tracking-tight">Need a Custom Quota?</h4>
          <p className="text-xs text-brand-muted leading-relaxed font-medium">
            Our sales team can architect a bespoke compute plan tailored to your high-scale data ingestion needs and multi-region deployment requirements.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button type="button" className="btn btn-sm bg-brand-primary text-black font-bold text-xs rounded-lg px-4 hover:bg-indigo-400 focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 cursor-pointer">Contact Enterprise Sales</button>
          <button type="button" className="text-xs text-white font-bold hover:underline transition-all cursor-pointer bg-transparent border-none outline-none flex items-center gap-1 focus:underline">
            View Premium SLAs <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Billing;