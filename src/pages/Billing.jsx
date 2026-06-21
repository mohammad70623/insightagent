import React, { useMemo, memo, useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Zap, Download, ArrowUpRight, ShieldAlert, CheckCircle2, X } from 'lucide-react';

const STATUS_STYLES = {
  SUCCESS: "text-green-400 bg-green-500/10 border-green-500/20",
  FAILED: "text-red-400 bg-red-500/10 border-red-500/20",
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20"
};

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
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentTier, setCurrentTier] = useState("Free");
  const [expiration, setExpiration] = useState(null);
  const [invoices, setInvoices] = useState([]);
  
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  // Dummy local state until global context is fully wired
  const [currentUsage, setCurrentUsage] = useState(0); 
  const [maxUsage, setMaxUsage] = useState(5);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/v1/billing/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    // Determine limits based on tier
    if (currentTier === "Enterprise") setMaxUsage(1000);
    else if (currentTier === "Pro") setMaxUsage(50);
    else setMaxUsage(5);
  }, [currentTier]);

  const handleUpgrade = async (planName) => {
    try {
      setIsUpgrading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/upgrade-tier', 
        { plan_name: planName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCurrentTier(response.data.tier);
      setExpiration(response.data.expires_at);
      
      setShowPlansModal(false);
      fetchInvoices();
      
      // Simulate global fetchCurrentUser refresh
      window.dispatchEvent(new Event('user-context-refresh'));
      
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Failed to upgrade tier. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const usagePercentage = useMemo(() => {
    if (maxUsage === 0) return 0;
    return (currentUsage / maxUsage) * 100;
  }, [currentUsage, maxUsage]);

  const formattedRemaining = useMemo(() => {
    const remainingUnits = maxUsage - currentUsage;
    return `${remainingUnits}`;
  }, [currentUsage, maxUsage]);

  const formattedMax = useMemo(() => {
    return `${maxUsage}`;
  }, [maxUsage]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans relative">

      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-surface border border-gray-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8">
            <button 
              onClick={() => setShowPlansModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-gray-900 rounded-full p-1"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white tracking-tight">Upgrade Your Compute</h2>
              <p className="text-sm text-brand-muted mt-2">Unlock unlimited ingestion, premium vector clusters, and priority SLAs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="bg-[#0B0F19] border border-gray-850 rounded-xl p-6 flex flex-col hover:border-gray-700 transition-colors">
                <h3 className="text-xl font-bold text-white">Starter</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-gray-500 font-medium">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Up to 5 Documents</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Standard Qdrant Node</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Community Support</li>
                </ul>
                <button 
                  disabled={currentTier === 'Free' || isUpgrading}
                  onClick={() => handleUpgrade('Free')}
                  className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentTier === 'Free' ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-[#0B0F19] border-2 border-brand-primary rounded-xl p-6 flex flex-col relative shadow-[0_0_20px_rgba(139,92,246,0.15)] transform scale-105 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-primary text-black font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-brand-primary">$29</span>
                  <span className="text-brand-muted font-medium">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary" /> Up to 50 Documents</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary" /> Dedicated Vector Cluster</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary" /> Layout-Aware Extraction</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary" /> Priority Email Support</li>
                </ul>
                <button 
                  disabled={currentTier === 'Pro' || isUpgrading}
                  onClick={() => handleUpgrade('Pro')}
                  className="w-full py-2.5 rounded-lg bg-brand-primary text-black font-bold text-sm hover:bg-indigo-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading && currentTier !== 'Pro' ? 'Processing...' : currentTier === 'Pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-[#0B0F19] border border-gray-850 rounded-xl p-6 flex flex-col hover:border-gray-700 transition-colors">
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">$149</span>
                  <span className="text-gray-500 font-medium">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Unlimited Documents</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Multi-Region Failover</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Custom API Rate Limits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> 24/7 Slack Connect</li>
                </ul>
                <button 
                  disabled={currentTier === 'Enterprise' || isUpgrading}
                  onClick={() => handleUpgrade('Enterprise')}
                  className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentTier === 'Enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="text-xl font-bold text-white mt-1.5 tracking-tight">{currentTier} Tier</h3>
              </div>
            </div>
            <span className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded font-mono text-gray-400 font-bold uppercase tracking-wider">
              {currentTier !== "Free" ? "Monthly" : "Free Forever"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-850/40 pt-4 mt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono">Next Renewal / Expiry</p>
              <p className="text-sm font-bold text-white mt-1">
                {expiration ? new Date(expiration).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono">Current Rate</p>
              <p className="text-sm font-bold text-white mt-1">
                {currentTier === 'Pro' ? '$29.00' : currentTier === 'Enterprise' ? '$149.00' : '$0.00'} 
                <span className="text-[10px] text-brand-muted font-normal">/mo</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setShowPlansModal(true)}
              className="btn btn-sm bg-brand-primary text-black font-bold text-xs rounded-lg px-6 hover:bg-indigo-400 hover:scale-105 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 shadow-lg"
            >
              Upgrade Plan
            </button>
            <button 
              type="button" 
              className="btn btn-sm bg-[#0B0F19] border border-gray-800 text-xs text-gray-300 hover:text-white rounded-lg px-4 hover:bg-gray-900 transition-all"
            >
              Manage Payment
            </button>
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
                  <h3 className="text-sm font-bold text-white mt-0.5">Ingested Files</h3>
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
              If your usage hits the strict cap, index operations will be blocked. Upgrading lifts constraints instantly across all nodes.
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
            className="text-[11px] text-brand-muted hover:text-white font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none focus:underline"
          >
            Filter Records
          </button>
        </div>

        <div className="overflow-x-auto text-xs w-full">
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-gray-500 font-mono text-xs">
              No invoice history available.
            </div>
          ) : (
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
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Billing;