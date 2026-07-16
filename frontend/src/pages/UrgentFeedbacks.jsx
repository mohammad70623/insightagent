import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Mail, 
  MessageSquare, 
  MessageCircle, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Loader2,
  Clock,
  ArrowUpRight,
  Settings as SettingsIcon,
  X
} from 'lucide-react';

export default function UrgentFeedbacks() {
  const navigate = useNavigate();
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [toast, setToast] = useState(null);

  const checkGmailConnection = async () => {
    setStatusLoading(true);
    try {
      const response = await api.get('/user/onboarding-status');
      const isConnected = response.data?.gmail_authorized === true || response.data?.gmail_connected === true;
      setIsGmailConnected(isConnected);
    } catch (err) {
      console.error("Failed to fetch onboarding status:", err);
      setIsGmailConnected(false);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/analytics/urgent-feedbacks');
      setFeedbacks(res.data?.feedbacks || res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGmailConnection();
  }, []);

  useEffect(() => {
    if (isGmailConnected) {
      fetchFeedbacks();
    }
  }, [isGmailConnected]);

  const showToast = (message, severity = 'success') => {
    setToast({ message, severity });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSendReply = async (feedbackId, recipient, subject, bodyText) => {
    try {
      setReplyingId(feedbackId);
      
      if (String(feedbackId).startsWith("demo-")) {
        await api.post('/chat/analytics/send-reply', {
          to_email: recipient,
          subject: subject,
          reply_body: bodyText
        });
        showToast("Mock alert resolved & notification dispatched via SMTP!", "success");
        setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      } else {
        const response = await api.post(`/chat/analytics/urgent-feedbacks/${feedbackId}/reply`, {
          reply_text: bodyText
        });
        if (response.data?.success) {
          showToast("Response sent successfully via Gmail OAuth!", "success");
          setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
        } else {
          showToast(response.data?.message || "Failed to dispatch response.", "error");
        }
      }
      
      setActiveReplyId(null);
    } catch (error) {
      console.error("Reply dispatch error:", error);
      const msg = error.response?.data?.detail || error.message || "Failed to dispatch reply.";
      showToast(msg, "error");
    } finally {
      setReplyingId(null);
    }
  };

  const handleAcknowledge = async (feedbackId) => {
    try {
      if (String(feedbackId).startsWith("demo-")) {
        showToast("Mock alert resolved in local state.", "success");
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, acknowledged: true } : f));
        return;
      }
      
      const response = await api.post(`/chat/analytics/urgent-feedbacks/${feedbackId}/acknowledge`);
      if (response.data?.success) {
        showToast("Threat instance acknowledged in core database matrix.", "success");
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, acknowledged: true, red_flag: false, severity: 'WARNING' } : f));
      } else {
        showToast("Failed to update database telemetry status.", "error");
      }
    } catch (err) {
      console.error("Acknowledge query error:", err);
      showToast("Connection to telemetry database failed.", "error");
    }
  };

  const filteredFeedbacks = useMemo(() => {
    const keywords = ['urgent', 'complaint', 'issue', 'failed', 'error', 'refund', 'critical', 'high', 'billing', 'security', 'infra', 'transaction', 'spike', 'unauthorized', 'anomaly', 'warning', 'emergency'];
    
    return feedbacks.map(item => ({
      ...item,
      acknowledged: item.acknowledged !== undefined ? item.acknowledged : (item.red_flag === false)
    })).filter(item => {
      const severityUpper = String(item.severity).toUpperCase();
      const isPrioritySignal = severityUpper === 'CRITICAL' || severityUpper === 'HIGH' || item.red_flag === true;
      
      const textToSearch = `${String(item.subject)} ${String(item.body || '')} ${String(item.message_snippet || '')}`.toLowerCase();
      const matchesKeyword = keywords.some(kw => textToSearch.includes(kw));
      
      return isPrioritySignal || matchesKeyword;
    });
  }, [feedbacks]);

  const stats = useMemo(() => {
    const total = filteredFeedbacks.length;
    const critical = filteredFeedbacks.filter(f => f.severity === 'CRITICAL').length;
    return {
      total,
      critical,
      avgResolution: "14.2m"
    };
  }, [filteredFeedbacks]);

  const highPriorityAlerts = useMemo(() => {
    return filteredFeedbacks.filter(f => (f.severity === 'CRITICAL' || f.severity === 'HIGH') && !f.acknowledged);
  }, [filteredFeedbacks]);

  const lowPriorityLedger = useMemo(() => {
    return filteredFeedbacks.filter(f => f.severity !== 'CRITICAL' && f.severity !== 'HIGH' || f.acknowledged);
  }, [filteredFeedbacks]);

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Email': return <Mail size={14} className="text-[#818cf8]" />;
      case 'Chat': return <MessageSquare size={14} className="text-emerald-400" />;
      case 'Twitter': return <MessageCircle size={14} className="text-sky-400" />;
      default: return <AlertCircle size={14} className="text-indigo-400" />;
    }
  };

  if (statusLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
        <span className="text-sm font-mono text-slate-400">Verifying authorization status...</span>
      </div>
    );
  }

  if (!isGmailConnected) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4 text-white">
        <div className="max-w-2xl w-full bg-[#0B0F19]/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl space-y-8 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
              <Mail className="text-slate-400" size={32} />
              <ShieldAlert className="absolute -bottom-1.5 -right-1.5 text-rose-500 animate-pulse" size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mt-4">
              Gmail Not Connected
            </h3>
            <p className="text-xs md:text-sm text-slate-405 max-w-lg leading-relaxed font-sans">
              Connect your Gmail to view urgent feedbacks
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openProfileModal'))}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-black font-extrabold text-xs tracking-wider uppercase py-3.5 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SettingsIcon size={14} />
              Connect Gmail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-fade-in ${
          toast.severity === 'error' 
            ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' 
            : toast.severity === 'info'
            ? 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
        }`}>
          <AlertCircle size={16} />
          <span className="text-xs font-mono font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="text-rose-500 animate-pulse" size={26} />
            Smart Security & Alert Hub
          </h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
           AI-powered inbox scanner that auto-classifies and flags critical system alerts.
          </p>
        </div>
        <button 
          onClick={fetchFeedbacks}
          className="btn btn-sm bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:text-white transition-all cursor-pointer font-bold text-xs rounded-lg px-4 flex items-center gap-1.5 self-end sm:self-center"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh Alerts
        </button>
      </div>

      {/* Stats Summary Matrix Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-855 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Total Active Threats</span>
            <h3 className="text-2xl font-black text-white">{stats.total}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-855 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Critical Incidents</span>
            <h3 className="text-2xl font-black text-rose-400">{stats.critical}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 animate-pulse">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-855 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Avg Resolution Window</span>
            <h3 className="text-2xl font-black text-emerald-400">{stats.avgResolution}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Card Threat Space */}
      <div className="space-y-4 text-left">
        <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold flex items-center gap-2">
          <span>🚨 Urgent Threats & Actions</span>
          <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0B0F19]/30 border border-slate-850 rounded-2xl min-h-[300px]">
            <Loader2 size={36} className="text-indigo-500 animate-spin mb-4" />
            <span className="text-xs font-mono text-slate-400">Querying secure telemetry vectors...</span>
          </div>
        ) : highPriorityAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[#0B0F19]/40 border border-slate-850 rounded-2xl min-h-[250px] text-center px-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-4 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Incident Queue Clear!</h4>
            <p className="text-xs text-slate-400 max-w-sm">No unresolved critical or high-severity vulnerabilities detected in current operations namespace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highPriorityAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const defaultDraft = replyDrafts[alert.id] !== undefined 
                ? replyDrafts[alert.id] 
                : (alert.suggested_reply || `Hi ${alert.sender_name || 'Team'},\n\nWe have analyzed this incident [${alert.alert_code || 'SYS'}] and initiated a core mitigation patch.\n\nBest regards,\nOperations Response Team`);

              return (
                <div 
                  key={alert.id}
                  className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-850 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-slate-800 ${
                    isCritical ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-amber-500'
                  }`}
                >
                  <div 
                    className="space-y-4 cursor-pointer"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-mono font-black tracking-wider px-3 py-1 rounded-full ${
                        isCritical 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                      }`}>
                        {alert.alert_code || 'SYS-TRG'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                        {getSourceIcon(alert.source)}
                        {alert.timestamp || 'Just now'}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-white truncate text-left w-full leading-tight font-sans" title={alert.subject}>
                        {alert.subject}
                      </h4>
                      <p className="text-xs text-slate-300 text-left leading-relaxed min-h-[60px] font-sans">
                        {alert.message_snippet || alert.body}
                      </p>
                    </div>

                    {/* Sender Details */}
                    <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/40 text-left">
                      <span className="block truncate text-slate-300 font-semibold">{alert.sender_name || alert.sender}</span>
                      <span className="block truncate opacity-70">{alert.sender}</span>
                    </div>
                  </div>

                  {/* Actions & Inline Response Editor */}
                  <div 
                    className="mt-6 pt-4 border-t border-slate-800/40 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {activeReplyId === alert.id ? (
                      <div className="space-y-3 animate-fade-in text-left">
                        <textarea
                          rows={4}
                          className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-[#d1d5db] focus:outline-none"
                          value={defaultDraft}
                          onChange={(e) => setReplyDrafts(prev => ({ ...prev, [alert.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={replyingId === alert.id}
                            onClick={() => handleSendReply(alert.id, alert.sender, alert.subject, defaultDraft)}
                            className="flex-1 btn btn-xs bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold rounded-lg flex items-center justify-center gap-1.5 py-2 cursor-pointer transition-all text-[10px]"
                          >
                            {replyingId === alert.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Send size={11} />
                            )}
                            Dispatch Reply
                          </button>
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-lg py-2 px-3 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="flex-1 py-2 text-[10px] font-extrabold bg-[#0d1220] hover:bg-[#161d30] border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={12} className="text-emerald-400" />
                          Acknowledge
                        </button>
                        <button
                          onClick={() => setActiveReplyId(alert.id)}
                          className="flex-1 py-2 text-[10px] font-extrabold bg-brand-primary hover:bg-indigo-400 text-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Send size={11} />
                          Send Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Warning Ledger Table */}
      <div className="space-y-4 text-left">
        <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold flex items-center gap-2">
          <span>⚠️ Minor System Warnings & Log History</span>
        </h3>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-850 rounded-2xl shadow-xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-mono">
              <thead className="bg-[#0e1423] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Alert Code</th>
                  <th className="px-6 py-4">Source Channel</th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Received Time</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      <Loader2 size={20} className="animate-spin inline-block text-indigo-500 mr-2" />
                      Loading logs ledger...
                    </td>
                  </tr>
                ) : lowPriorityLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500 font-bold">
                      No warning-level alerts parsed. General telemetry healthy.
                    </td>
                  </tr>
                ) : (
                  lowPriorityLedger.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-indigo-400">{item.alert_code || 'SYS-LOG'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          {getSourceIcon(item.source)}
                          {item.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate animate-none" title={item.sender}>
                        {item.sender_name || item.sender}
                      </td>
                      <td className="px-6 py-4 max-w-[300px] truncate" title={item.subject}>
                        <span className="font-semibold text-white">{item.subject}</span>
                        <span className="text-slate-400 opacity-80"> - {item.message_snippet}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {item.timestamp || 'Just now'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                          item.acknowledged 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {item.acknowledged ? 'ACKNOWLEDGED' : item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!item.acknowledged ? (
                          <button 
                            onClick={() => handleAcknowledge(item.id)}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px]"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Logged & Safe</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Full Alert Details Modal */}
      {selectedAlert !== null && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-left"
          onClick={() => setSelectedAlert(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 text-slate-100 max-w-2xl w-full p-6 rounded-xl shadow-2xl overflow-y-auto max-h-[80vh] relative space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono font-black tracking-wider px-3 py-1 rounded-full ${
                  selectedAlert.severity === 'CRITICAL' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                }`}>
                  {selectedAlert.alert_code || 'SYS-TRG'}
                </span>
                <div className="text-xs text-slate-400 font-mono">
                  From: <span className="text-slate-200 font-semibold">{selectedAlert.sender_name || selectedAlert.sender}</span> ({selectedAlert.sender})
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold bg-transparent border-none cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Middle Row */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Subject</span>
              <h3 className="text-base font-black text-white leading-tight font-sans">
                {selectedAlert.subject}
              </h3>
            </div>

            {/* Main Body Viewport */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Full Ingested Log Body</span>
              <pre className="whitespace-pre-wrap font-sans text-slate-300 bg-slate-950/40 p-4 rounded-lg border border-slate-800/60 mt-2 text-xs leading-relaxed max-h-96 overflow-y-auto">
                {selectedAlert.body || selectedAlert.message_snippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
