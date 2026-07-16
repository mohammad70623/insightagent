import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, Loader2, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchGoogleStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/google/status');
      setGmailConnected(res.data.is_connected);
      setGmailEmail(res.data.email || "");
    } catch (err) {
      console.error("Failed to load Google OAuth status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGmailConnect = async () => {
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
  };

  const handleGmailDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Gmail account? All associated unread email feedbacks will be removed.")) {
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/google/disconnect');
      setGmailConnected(false);
      setGmailEmail("");
      alert("Gmail account disconnected successfully.");
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
      alert("Failed to disconnect Gmail account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-white min-h-[70vh] flex flex-col justify-center animate-fade-in font-sans px-4">
      {/* Back Button Link */}
      <div className="text-left">
        <button
          onClick={() => navigate('/app/urgent-feedbacks')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Urgent Feedbacks
        </button>
      </div>

      <div className="bg-[#0B0F19]/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl space-y-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
            <Mail className="text-indigo-400" size={32} />
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-4">
            Account Settings
          </h2>
        </div>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
            <span className="text-xs font-mono text-slate-500">Checking credentials status...</span>
          </div>
        ) : (
          <div id="gmail-connection-section" className="space-y-6 text-center">
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-200">
                📬 Gmail Integration Gateway
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Authorize access to your Gmail inbox for urgent feedback detection.
              </p>
            </div>
            
            <div className="pt-4 flex justify-center">
              {!gmailConnected ? (
                <button
                  type="button"
                  onClick={handleGmailConnect}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-black font-extrabold text-xs tracking-wider uppercase py-3.5 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  Connect Gmail Inbox
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono font-semibold flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected: {gmailEmail}
                  </div>
                  <button
                    type="button"
                    onClick={handleGmailDisconnect}
                    className="text-xs text-rose-400 hover:text-rose-350 font-bold hover:underline bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Disconnect Gmail Inbox
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
