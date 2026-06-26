import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CloudUpload, MessageSquare, CreditCard, Shield, Settings, HelpCircle, Plus, Search, Bell, History } from 'lucide-react';
import SwotButton from './analytics/SwotButton';
import { api } from '../services/api';
import PrivacyPolicyModal from './PrivacyPolicyModal';

/**
 * @description Enterprise Core Dashboard Layout Component
 * Refactored: Synchronized routing prefixes with the new centralized /app gate schema.
 */
const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', profile_picture: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        profile_picture: res.data.profile_picture || ''
      });
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    // Listen to user context refreshes (e.g. from upgrade or profile edit)
    const handleRefresh = () => fetchProfile();
    window.addEventListener('user-context-refresh', handleRefresh);
    return () => window.removeEventListener('user-context-refresh', handleRefresh);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/profile/update', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        profile_picture: formData.profile_picture,
        workspace_name: profile?.workspace_name,
        workspace_logo: profile?.workspace_logo,
        is_2fa_enabled: profile?.is_2fa_enabled || false
      });
      await fetchProfile();
      setShowProfileModal(false);
      // Dispatch refresh so other components (e.g. Settings, Header) get the update
      window.dispatchEvent(new Event('user-context-refresh'));
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
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
            onClick={() => setShowPrivacyPolicyModal(true)} 
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
              showPrivacyPolicyModal
                ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none'
                : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
            }`}
          >
            <Shield size={16} /> Privacy Policy
          </button>

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
              onClick={() => navigate('/app/billing')} 
              className="btn btn-xs border-none bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-md px-3 h-7 text-xs font-bold cursor-pointer transition-all"
            >
              Upgrade
            </button>
            
            <button type="button" aria-label="Notifications" className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none"><Bell size={16} /></button>
            <button type="button" aria-label="History logs" className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none"><History size={16} /></button>
            
            <button 
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="avatar cursor-pointer bg-transparent border-none p-0 focus:outline-none hover:scale-105 active:scale-95 transition-all"
              aria-label="User profile settings"
            >
              <div className="w-8 h-8 rounded-full border border-gray-850 overflow-hidden flex items-center justify-center bg-gray-900">
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-black text-brand-primary font-mono uppercase">
                    {profile ? `${profile.first_name[0] || ''}${profile.last_name[0] || ''}` : 'IA'}
                  </span>
                )}
              </div>
            </button>
          </div>
        </header>

        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-main p-8">
          <Outlet />
        </main>
      </div>

      {/* Global SWOT floating button — visible on every page */}
      <SwotButton />

      {/* ─── PROFILE UPDATE MODAL ─── */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0F1423] p-6 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-850 pb-4 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary font-mono">User Profile Hub</h3>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-base font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              {/* Avatar upload zone */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 rounded-full border-2 border-brand-primary/45 overflow-hidden bg-gray-900 flex items-center justify-center group shadow-inner">
                  {formData.profile_picture ? (
                    <img src={formData.profile_picture} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-brand-primary font-mono uppercase">
                      {profile ? `${profile.first_name[0] || ''}${profile.last_name[0] || ''}` : 'IA'}
                    </span>
                  )}
                  
                  {/* Overlay upload input */}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200">
                    <span className="text-[10px] text-white font-bold font-mono">CHANGE</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Click preview to upload profile picture</span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Email Address</label>
                  <input 
                    type="text" 
                    disabled 
                    value={profile?.email || ''} 
                    className="w-full rounded-lg bg-gray-900 border border-gray-850 px-3 py-2 text-xs text-gray-400 font-mono outline-none cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full rounded-lg bg-main border border-gray-800 px-3 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full rounded-lg bg-main border border-gray-800 px-3 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-gray-850 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-lg text-xs hover:bg-indigo-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PRIVACY POLICY GLOBAL MODAL ─── */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicyModal} 
        onClose={() => setShowPrivacyPolicyModal(false)} 
      />
    </div>
  );
};

export default DashboardLayout;