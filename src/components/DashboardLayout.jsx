import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CloudUpload, MessageSquare, CreditCard, Shield, Settings, HelpCircle, Plus, Search, Bell, History } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Data Upload', path: '/upload', icon: CloudUpload },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Admin', path: '/admin', icon: Shield },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans">
      
      {/* Left Sidebar*/}
      <aside className="hidden w-64 flex-col justify-between border-r border-gray-800/40 bg-surface p-6 lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-black font-black text-sm">A</div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Aether AI</h2>
              <p className="text-[9px] uppercase tracking-widest text-brand-muted font-semibold -mt-1">Enterprise Suite</p>
            </div>
          </div>

          <button className="btn btn-sm w-full border-none bg-brand-primary text-black font-semibold hover:bg-indigo-400 capitalize py-2 h-auto rounded-lg gap-2 cursor-pointer">
            <Plus size={16} /> New Analysis
          </button>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none' 
                      : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
                  }`}
                >
                  <Icon size={18} /> {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-gray-800/40 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-brand-muted hover:bg-gray-900/60 hover:text-white cursor-pointer">
            <HelpCircle size={18} /> Support
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 cursor-pointer">
            <Settings size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Right Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-800/40 bg-surface px-8">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold tracking-tight text-brand-primary">Aether AI</span>
            <nav className="hidden items-center gap-5 text-sm font-medium text-brand-muted md:flex">
              <a href="#overview" className="text-white">Overview</a>
              <a href="#reports" className="hover:text-white">Reports</a>
              <a href="#inventory" className="hover:text-white">Inventory</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden w-64 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search insights..." 
                className="w-full rounded-lg bg-main border border-gray-800/80 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-brand-primary"
              />
            </div>
            <button className="btn btn-xs border-none bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-md px-3 font-semibold cursor-pointer">Upgrade</button>
            <button className="text-brand-muted hover:text-white cursor-pointer"><Bell size={18} /></button>
            <button className="text-brand-muted hover:text-white cursor-pointer"><History size={18} /></button>
            <div className="avatar">
              <div className="w-8 rounded-full border border-gray-800">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* main body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-main p-8">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}