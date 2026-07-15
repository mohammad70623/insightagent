import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CloudUpload, MessageSquare, CreditCard, Shield, Settings, HelpCircle, Plus, Search, Bell, History, Eye, EyeOff } from 'lucide-react';
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
  const profilePicRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', profile_picture: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState("Mohammad");
  const [lastName, setLastName] = useState("Hossain");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsView, setSettingsView] = useState("view");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");

  // Notifications state management
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationsRef = useRef(null);

  // History state management
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef(null);

  const simulatedLogs = [
    { id: 1, type: "DELETE", text: "Vector node 'financial_q4.csv' permanently purged.", time: "10 mins ago" },
    { id: 2, type: "SYNC", text: "Qdrant HNSW index defragmentation optimized.", time: "1 hour ago" },
    { id: 3, type: "AUTH", text: "Google OAuth token successfully renewed.", time: "4 hours ago" },
    { id: 4, type: "BILLING", text: "Stripe customer session synchronized.", time: "Yesterday" }
  ];

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/notifications/unread');
      setUnreadNotifications(response.data.unread || []);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread notifications", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await api.patch(`/notifications/${notif.id}/read`);
      fetchUnreadNotifications();
      setShowNotificationsDropdown(false);
      navigate(notif.redirect_url);
    } catch (error) {
      console.error("Failed to handle notification click", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        profile_picture: res.data.profile_picture || ''
      });
      setFirstName(res.data.first_name || 'Mohammad');
      setLastName(res.data.last_name || 'Hossain');
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await api.get('/auth/google/status');
      setGmailConnected(res.data.is_connected);
      setGmailEmail(res.data.email || "");
    } catch (err) {
      console.error("Failed to load Google OAuth status", err);
    }
  };

  const handleGmailDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Gmail account? All associated unread email feedbacks will be removed.")) {
      return;
    }
    try {
      await api.post('/auth/google/disconnect');
      setGmailConnected(false);
      setGmailEmail("");
      alert("Gmail account disconnected successfully.");
    } catch (err) {
      console.error("Failed to disconnect Gmail", err);
      alert("Failed to disconnect Gmail account.");
    }
  };

  useEffect(() => {
    if (showProfileModal) {
      fetchGoogleStatus();
    }
  }, [showProfileModal]);

  useEffect(() => {
    fetchProfile();
    fetchUnreadNotifications();
    
    // Listen to user context refreshes (e.g. from upgrade or profile edit)
    const handleRefresh = () => {
      fetchProfile();
      fetchUnreadNotifications();
    };
    window.addEventListener('user-context-refresh', handleRefresh);
    
    // Dynamic polling setup
    const interval = setInterval(fetchUnreadNotifications, 60000);
    
    return () => {
      window.removeEventListener('user-context-refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false);
      }
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, profile_picture: objectUrl }));
  };

  const triggerAvatarClick = () => {
    document.getElementById('avatar-upload-input')?.click();
  };

  const handleNameChangeSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      alert("⚠️ Please enter your current password to confirm name changes.");
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/profile/update', {
        first_name: firstName,
        last_name: lastName,
        profile_picture: formData.profile_picture,
        workspace_name: profile?.workspace_name,
        workspace_logo: profile?.workspace_logo,
        is_2fa_enabled: profile?.is_2fa_enabled || false
      });
      await fetchProfile();
      alert("✨ Name updated successfully!");
      setCurrentPassword("");
      setSettingsView('view');
      // Dispatch refresh so other components (e.g. Settings, Header) get the update
      window.dispatchEvent(new Event('user-context-refresh'));
    } catch (err) {
      console.error("Failed to update profile name", err);
      alert("Failed to update profile name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("⚠️ Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("❌ New passwords do not match!");
      return;
    }

    try {
      const response = await api.post('/profile/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      if (response.status === 200 || response.data?.status === 'success') {
        alert("🔒 Password updated successfully in the database! Please log in again with your new credentials.");
        handleLogout(); 
      } else {
        alert(`❌ Error: ${response.data?.message || "Failed to update password."}`);
      }
    } catch (error) {
      console.error("Password update error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Failed to update password.";
      alert(`❌ Error: ${errorMsg}`);
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
    localStorage.clear();
    sessionStorage.clear(); 
    navigate('/login');
  };
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans select-none flex-col md:flex-row">
      
      {/* Mobile/Tablet Sticky Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-surface border-b border-gray-800 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:text-brand-primary text-2xl focus:outline-none bg-transparent border-none cursor-pointer"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png" 
              alt="InsightAgent Logo" 
              className="w-9 h-9 object-cover rounded-xl border border-slate-850 shadow-md transform hover:scale-105 transition-transform duration-200"
              crossOrigin="anonymous"
            />
            <span className="text-sm font-bold text-white tracking-tight">InsightAgent</span>
          </div>
        </div>
        
        {isMenuOpen && (
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="text-xs font-bold text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Overlay backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ─── SIDEBAR PANELS ─── */}
      <aside className={`
        ${isMenuOpen ? 'flex absolute inset-y-0 left-0 z-50 bg-[#0c0f19] w-64' : 'hidden'}
        md:flex md:relative md:w-64 flex-col justify-between border-r border-gray-800/40 bg-surface p-6
      `}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <img 
              src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png" 
              alt="InsightAgent Logo" 
              className="w-9 h-9 object-cover rounded-xl border border-slate-850 shadow-md transform hover:scale-105 transition-transform duration-200"
              crossOrigin="anonymous"
            />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">InsightAgent</h2>
              <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold -mt-0.5 font-mono">Enterprise AI</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => { navigate('/app/chat'); setIsMenuOpen(false); }} 
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
                  onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
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
            onClick={() => { setShowPrivacyPolicyModal(true); setIsMenuOpen(false); }} 
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
            onClick={() => { navigate('/app/support'); setIsMenuOpen(false); }} 
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
              location.pathname === '/app/support'
                ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none'
                : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
            }`}
          >
            <HelpCircle size={16} /> Support
          </button>
          
          {/* Logout Trigger */}
          <button 
            type="button"
            onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
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
            
            <div className="relative" ref={notificationsRef}>
              <button 
                type="button" 
                aria-label="Notifications" 
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowHistory(false);
                }}
                className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none relative flex items-center justify-center p-1"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {showNotificationsDropdown && (
                <div className="absolute right-[-140px] sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-md bg-[#0B0F19]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden p-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-semibold px-2 py-0.5 rounded-full font-mono">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {unreadNotifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 text-xs font-mono">
                        No new notifications.
                      </div>
                    ) : (
                      unreadNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="p-2.5 rounded-lg bg-gray-900/40 hover:bg-[#131926] border border-slate-800/40 hover:border-indigo-500/30 transition-all cursor-pointer text-left min-w-0 w-full flex items-start"
                        >
                          <div className="min-w-0 flex-1 break-words">
                            <div className="text-xs font-bold text-slate-200">{notif.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1 leading-normal">{notif.message}</div>
                            <div className="text-[8px] text-slate-600 mt-1.5 font-mono">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={historyRef}>
              <button 
                type="button" 
                aria-label="History logs" 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowNotificationsDropdown(false);
                }}
                className="text-brand-muted hover:text-white cursor-pointer bg-transparent border-none outline-none flex items-center justify-center p-1"
              >
                <History size={16} />
              </button>

              {/* History Dropdown panel */}
              {showHistory && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-gray-800 bg-[#0c0f19] p-4 shadow-2xl z-50 animate-fade-in text-slate-200">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">System History Logs</span>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full font-mono">
                      Live Stream
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {simulatedLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="p-2.5 rounded-lg bg-gray-900/40 border border-slate-800/40 hover:border-slate-700/40 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            log.type === 'DELETE' ? 'bg-red-550/10 text-red-400 border border-red-500/20' :
                            log.type === 'SYNC' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            log.type === 'AUTH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">{log.time}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 leading-normal font-mono">{log.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              ref={profilePicRef}
              type="button"
              onClick={() => { setSettingsView('view'); setShowProfileModal(true); }}
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

        
        <main className={`flex-1 overflow-x-hidden bg-main ${location.pathname === '/app/chat' ? 'relative overflow-hidden p-0' : 'overflow-y-auto p-8'}`}>
          <Outlet context={{ profilePicRef }} />
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
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary font-mono">Account Settings</h3>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-base font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Avatar upload zone */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div 
                onClick={triggerAvatarClick}
                className="relative w-20 h-20 rounded-full border-2 border-brand-primary/45 overflow-hidden bg-gray-900 flex items-center justify-center group shadow-inner cursor-pointer"
              >
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-brand-primary font-mono uppercase">
                    {profile ? `${profile.first_name[0] || ''}${profile.last_name[0] || ''}` : 'IA'}
                  </span>
                )}
                
                {/* Overlay upload */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-205">
                  <span className="text-[10px] text-white font-bold font-mono">CHANGE</span>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*"
                id="avatar-upload-input"
                onChange={handleFileChange}
                className="hidden" 
              />
            </div>

            {/* Dynamic Views */}
            {settingsView === 'view' && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">{firstName} {lastName}</h4>
                  <p className="text-xs text-slate-400 font-mono">{profile?.email}</p>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-850">
                  <button
                    type="button"
                    onClick={() => { setSettingsView('edit_name'); setCurrentPassword(''); }}
                    className="w-full py-2.5 bg-brand-primary text-black font-bold rounded-lg text-xs hover:bg-indigo-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all cursor-pointer"
                  >
                    ✏️ Change Account Name
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSettingsView('edit_password'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    🔒 Change Account Password
                  </button>
                  {!gmailConnected ? (
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await api.get('/auth/google/login');
                          if (response.data && response.data.authorization_url) {
                            window.location.href = response.data.authorization_url;
                          } else {
                            alert("Failed to retrieve connection authorization URL.");
                          }
                        } catch (error) {
                          console.error("Failed to generate authorization URL:", error);
                          alert("Failed to connect to authentication gateway.");
                        }
                      }}
                      className="w-full btn bg-indigo-600 text-white font-bold text-xs rounded-lg px-6 py-3 hover:bg-indigo-500 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.68 0-8.52-3.882-8.52-8.52s3.84-8.52 8.52-8.52c2.1 0 4.005.765 5.505 2.025l3.24-3.24C18.6 1.77 15.63 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 12.24-4.86 12.24-12.24 0-.825-.075-1.62-.225-2.22H12.24z"/>
                      </svg>
                      Connect Gmail Inbox
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Gmail Connected: {gmailEmail}
                      </div>
                      <button
                        type="button"
                        onClick={handleGmailDisconnect}
                        className="w-full py-2.5 bg-rose-650 hover:bg-rose-600 border border-rose-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        🔴 Disconnect Gmail
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {settingsView === 'edit_name' && (
              <form onSubmit={handleNameChangeSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 px-3 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 px-3 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPass ? "text" : "password"} 
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
                      >
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-gray-850 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => { setSettingsView('view'); setCurrentPassword(''); setShowCurrentPass(false); setShowNewPass(false); }}
                    className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-lg text-xs hover:bg-indigo-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Confirm Name Change"}
                  </button>
                </div>
              </form>
            )}

            {settingsView === 'edit_password' && (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPass ? "text" : "password"} 
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
                      >
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPass ? "text" : "password"} 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted font-mono mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPass ? "text" : "password"} 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg bg-main border border-gray-800 pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-brand-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-gray-850 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => { setSettingsView('view'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowCurrentPass(false); setShowNewPass(false); }}
                    className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-lg text-xs hover:bg-indigo-400 transition-all cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
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