import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CloudUpload, MessageSquare, CreditCard, Shield, Settings, HelpCircle, Plus, Search, Bell, History, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

/**
 * @description Enterprise Core Dashboard Layout Component
 * Refactored: Synchronized routing prefixes with the new centralized /app gate schema.
 */
const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentTier, setCurrentTier] = useState("Free");

  // On mount, fetch current tier to know what to display
  useEffect(() => {
    const fetchTier = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:8000/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.subscription_tier) {
          setCurrentTier(response.data.subscription_tier);
        }
      } catch (err) {
        console.error("Failed to fetch user tier for header:", err);
      }
    };
    fetchTier();
  }, []);

  const handleUpgrade = async (planName) => {
    try {
      setIsUpgrading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/upgrade-tier', 
        { plan_name: planName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentTier(response.data.tier);
      setIsUpgradeModalOpen(false);
      window.dispatchEvent(new Event('user-context-refresh'));
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Failed to upgrade tier. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

 
  const menuItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/app/analytics', icon: BarChart3 },
    { name: 'Data Upload', path: '/app/upload', icon: CloudUpload },
    { name: 'AI Chat', path: '/app/chat', icon: MessageSquare },
    { name: 'Billing', path: '/app/billing', icon: CreditCard },
  ];

  const userRole = localStorage.getItem('user_role') || 'user';
  if (userRole === 'admin') {
    menuItems.push({ name: 'Admin', path: '/app/admin', icon: Shield });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role'); 
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans select-none">
      
      {/* ─── GLOBAL UPGRADE MODAL OVERLAY ─── */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-surface border border-gray-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8">
            <button 
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-gray-900 rounded-full p-1 cursor-pointer"
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
                  className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  className="w-full py-2.5 rounded-lg bg-brand-primary text-black font-bold text-sm hover:bg-indigo-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {currentTier === 'Enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SIDEBAR PANELS ─── */}
      <aside className="hidden w-64 flex-col justify-between border-r border-gray-800/40 bg-surface p-6 lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-black font-black text-sm">I</div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">InsightAgent</h2>
              <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold -mt-0.5 font-mono">Enterprise AI</p>
            </div>
          </div>

         
          <button 
            type="button"
            onClick={() => navigate('/app/chat')} 
            className="btn btn-sm w-full border-none bg-brand-primary text-black font-bold hover:bg-indigo-400 capitalize py-2.5 h-auto rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus size={15} /> New Analysis
          </button>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none' 
                      : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
                  }`}
                >
                  <Icon size={16} /> {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ─── LOWER CONTROLS PANEL ─── */}
        <div className="space-y-1 border-t border-gray-800/40 pt-4">
         
          <button 
            type="button"
            onClick={() => navigate('/app/billing')} 
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium text-brand-muted hover:bg-gray-900/60 hover:text-white cursor-pointer transition-all"
          >
            <HelpCircle size={16} /> Support
          </button>
          
          {/* Logout Trigger */}
          <button 
            type="button"
            onClick={handleLogout} 
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
          >
            <Settings size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT RECEPTOR CANVAS ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-800/40 bg-surface px-8">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tight text-brand-primary font-mono uppercase tracking-wider">Workspace Core</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden w-64 md:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Global system search..." 
                className="w-full rounded-lg bg-main border border-gray-800/80 pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-brand-primary"
              />
            </div>
            
           
            <button 
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)} 
              className="btn btn-xs border-none bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-md px-3 h-7 text-xs font-bold cursor-pointer transition-all"
            >
              Upgrade
            </button>
            
            <button type="button" aria-label="Notifications" className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none"><Bell size={16} /></button>
            <button type="button" aria-label="History logs" className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none"><History size={16} /></button>
            
            <div className="avatar">
              <div className="w-8 rounded-full border border-gray-800 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" alt="user avatar profile" />
              </div>
            </div>
          </div>
        </header>

        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-main p-8">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;