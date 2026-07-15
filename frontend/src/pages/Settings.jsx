import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Building, ShieldCheck, Upload, Save, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile Form State
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    workspace_name: '',
    workspace_logo: '',
    is_2fa_enabled: false
  });

  // Password State
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        const data = response.data;
        setFormData({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          workspace_name: data.workspace_name || '',
          workspace_logo: data.workspace_logo || '',
          is_2fa_enabled: data.is_2fa_enabled || false
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, workspace_logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    try {
      await api.put('/profile/update', formData);
      setSuccessMessage('Profile and Workspace settings saved successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      alert("New passwords do not match.");
      return;
    }
    
    setIsSaving(true);
    setSuccessMessage('');
    try {
      await api.post('/profile/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      setSuccessMessage('Security settings updated successfully.');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error("Password change failed:", error);
      alert(error.response?.data?.detail || "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-transparent">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in font-sans space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">System Settings</h2>
        <p className="text-xs text-brand-muted mt-1.5">Manage your personal profile, workspace identity, and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none' : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
            }`}
          >
            <User size={16} /> General Profile
          </button>
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'workspace' ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none' : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
            }`}
          >
            <Building size={16} /> Workspace Identity
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'security' ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary rounded-l-none' : 'text-brand-muted hover:bg-gray-900/60 hover:text-white'
            }`}
          >
            <ShieldCheck size={16} /> Security & Auth
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface border border-gray-800/60 rounded-2xl shadow-2xl overflow-hidden min-h-[400px]">
          
          {successMessage && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-fade-in">
              <CheckCircle2 size={14} />
              {successMessage}
            </div>
          )}

          <div className="p-8">
            {activeTab === 'general' && (
              <form onSubmit={saveProfile} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Personal Information</h3>
                  <p className="text-xs text-brand-muted">Update your display name and basic account details.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">First Name</label>
                    <input 
                      type="text" 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleInputChange} 
                      className="w-full rounded-lg bg-main border border-gray-800 px-4 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Last Name</label>
                    <input 
                      type="text" 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleInputChange} 
                      className="w-full rounded-lg bg-main border border-gray-800 px-4 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Email Address (Read Only)</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    className="w-full rounded-lg bg-[#0B0F19] border border-gray-850 px-4 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="pt-6 border-t border-gray-850/40 flex justify-end">
                  <button type="submit" disabled={isSaving} className="btn bg-brand-primary text-black font-bold text-xs rounded-lg px-6 py-2.5 hover:bg-indigo-400 transition-all cursor-pointer flex items-center gap-2">
                    <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'workspace' && (
              <form onSubmit={saveProfile} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Workspace Configuration</h3>
                  <p className="text-xs text-brand-muted">Customize your enterprise tenant identity and branding.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Workspace Organization Name</label>
                  <input 
                    type="text" 
                    name="workspace_name" 
                    value={formData.workspace_name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Acme Corporation"
                    className="w-full rounded-lg bg-main border border-gray-800 px-4 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Workspace Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-xl bg-main border border-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.workspace_logo ? (
                        <img src={formData.workspace_logo} alt="Workspace Logo" className="h-full w-full object-cover" />
                      ) : (
                        <Building size={24} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="btn bg-gray-900 border border-gray-800 text-gray-300 font-bold text-xs rounded-lg px-4 py-2 hover:bg-gray-800 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2">
                        <Upload size={14} /> Upload Custom Logo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-500 mt-2">Recommended size: 256x256px. PNG or JPG.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-850/40 flex justify-end">
                  <button type="submit" disabled={isSaving} className="btn bg-brand-primary text-black font-bold text-xs rounded-lg px-6 py-2.5 hover:bg-indigo-400 transition-all cursor-pointer flex items-center gap-2">
                    <Save size={14} /> {isSaving ? 'Saving...' : 'Save Workspace'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-fade-in">


                <form onSubmit={savePassword} className="space-y-6">
                  <div className="space-y-2 border-b border-gray-850/40 pb-4">
                    <h3 className="text-lg font-bold text-white">Change Password</h3>
                    <p className="text-xs text-brand-muted">Ensure your account uses a long, random password to stay secure.</p>
                  </div>
                  
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Current Password</label>
                      <input 
                        type="password" 
                        name="current_password" 
                        value={passwords.current_password} 
                        onChange={handlePasswordChange} 
                        className="w-full rounded-lg bg-main border border-gray-800 px-4 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">New Password</label>
                      <input 
                        type="password" 
                        name="new_password" 
                        value={passwords.new_password} 
                        onChange={handlePasswordChange} 
                        className="w-full rounded-lg bg-main border border-gray-800 px-4 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-brand-muted uppercase font-mono">Confirm New Password</label>
                      <input 
                        type="password" 
                        name="confirm_password" 
                        value={passwords.confirm_password} 
                        onChange={handlePasswordChange} 
                        className={`w-full rounded-lg bg-main border px-4 py-2.5 text-sm text-white outline-none transition-colors ${
                          passwords.confirm_password && passwords.new_password !== passwords.confirm_password 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-800 focus:border-brand-primary'
                        }`}
                        required
                      />
                      {passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
                        <p className="text-[10px] font-bold text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                    <button type="submit" disabled={isSaving || (passwords.confirm_password && passwords.new_password !== passwords.confirm_password)} className="btn bg-[#0B0F19] border border-gray-800 text-gray-300 font-bold text-xs rounded-lg px-6 py-2.5 hover:bg-gray-900 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>

                <div className="pt-8 border-t border-gray-850/40">
                  <form onSubmit={saveProfile} className="space-y-4 max-w-md">
                    <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-[#0B0F19]">
                      <div>
                        <p className="text-xs font-bold text-white">Authenticator App</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">Protect your account with an extra layer of security.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="is_2fa_enabled" checked={formData.is_2fa_enabled} onChange={handleInputChange} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary peer-checked:shadow-[0_0_15px_rgba(139,92,246,0.6)]"></div>
                      </label>
                    </div>
                    <button type="submit" disabled={isSaving} className="btn bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs rounded-lg px-6 py-2 hover:bg-brand-primary/20 transition-all cursor-pointer">
                      Save 2FA Settings
                    </button>
                  </form>
                </div>


              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
