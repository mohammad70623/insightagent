import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Database, Cpu, HardDrive, Trash2, RefreshCcw, KeyRound, Server, Activity } from 'lucide-react';

const Admin = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/tickets/all');
      setTickets(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    }
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.get('/admin/users');
        setTenants(response.data.users || []);
      } catch (error) {
        console.error("Failed to fetch tenant registry", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchTenants();
    fetchTickets();

    // Setup authentic background polling every 30 seconds
    const interval = setInterval(() => {
      fetchTenants();
      fetchTickets();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveTenant = async (userId) => {
    try {
      await api.delete(`/admin/tenant/${userId}`);
      setTenants((prev) => prev.filter(t => t.id !== userId));
      alert("Tenant ecosystem successfully flushed and terminated.");
    } catch (error) {
      console.error("Failed to remove tenant", error);
      alert("Failed to remove tenant. See console for details.");
    }
  };

  const handleResolveTicket = async (ticketId) => {
    if (!adminReplyText.trim()) {
      alert("Please provide a resolution note.");
      return;
    }
    try {
      await api.patch(`/admin/tickets/${ticketId}/resolve`, {
        admin_reply: adminReplyText
      });
      setAdminReplyText("");
      setResolvingTicketId(null);
      fetchTickets();
      alert(`Ticket ${ticketId} resolved successfully.`);
    } catch (error) {
      console.error("Failed to resolve ticket", error);
      alert("Failed to resolve ticket. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans pb-20">

      {/* ─── HEADER: Enterprise System Administration ─── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-brand-primary" /> Enterprise System Administration
          </h2>
          <p className="text-xs text-brand-muted mt-1.5">
            Global system configuration, active user workspace management, and high-privilege administrative operations.
          </p>
        </div>
      </div>

      {/* ─── SYSTEM HEALTH PARAMETERS ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20 text-brand-primary">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted font-mono">CPU Utilization</p>
            <p className="text-xl font-bold text-white mt-1">24.8% <span className="text-xs text-green-400 font-normal ml-1">Stable</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
            <HardDrive size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted font-mono">Memory Usage</p>
            <p className="text-xl font-bold text-white mt-1">14.2 / 64 GB <span className="text-xs text-brand-muted font-normal ml-1">22%</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Server size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted font-mono">Connected Workspaces</p>
            <p className="text-xl font-bold text-white mt-1">12 Active <span className="text-xs text-emerald-400 font-normal ml-1">Healthy</span></p>
          </div>
        </div>
      </div>

      {/* ─── CONTROL TABLES & ACTION MODULES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Tenant Registries Table */}
        <div className="lg:col-span-8 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col">
          <div className="flex flex-col gap-4 border-b border-gray-850 pb-4 mb-6 relative">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
              <Database size={14} className="text-brand-primary" /> Active User Workspaces
            </h4>
            <div className="absolute right-0 top-0 flex items-center gap-2 text-[9px] font-mono text-emerald-400">
              <Activity size={12} className="animate-pulse" /> LIVE SYNC ACTIVE
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] w-full flex-1">
            {loading && tenants.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-brand-primary animate-pulse font-mono tracking-widest">
                 Fetching Member Database...
              </div>
            ) : tenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-[#0B0F19]/50 rounded-lg border border-gray-850">
                <Shield size={32} className="text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium text-xs">No Active Enterprise Tenants Registered in Ecosystem.</p>
              </div>
            ) : (
              <table className="table table-xs w-full border-none">
                <thead>
                  <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase font-mono text-[10px]">
                    <th className="bg-transparent pl-0 py-3">User Account Details</th>
                    <th className="bg-transparent py-3">Tier</th>
                    <th className="bg-transparent py-3">Files</th>
                    <th className="bg-transparent py-3">Expiration (UTC)</th>
                    <th className="bg-transparent text-right pr-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-gray-850/30 last:border-none hover:bg-gray-900/10 transition-colors">
                      <td className="bg-transparent pl-0 py-4 font-semibold text-white font-mono flex flex-col gap-1">
                        <span className="text-brand-primary font-bold text-xs">{tenant.email}</span>
                      </td>
                      <td className="bg-transparent py-4">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wide ${
                            tenant.tier === 'Enterprise' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' :
                            tenant.tier === 'Pro' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                            'bg-gray-500/10 border-gray-500/20 text-gray-400'
                          }`}>
                          {tenant.tier}
                        </span>
                      </td>
                      <td className="bg-transparent py-4 font-mono text-gray-300 font-bold">
                        {tenant.files_count} <span className="text-gray-600 font-normal">assets</span>
                      </td>
                      <td className="bg-transparent py-4 font-mono text-gray-400">
                        {tenant.expires_at ? new Date(tenant.expires_at).toLocaleString() : 'Never (Free)'}
                      </td>
                      <td className="bg-transparent text-right pr-0 py-4">
                        <button
                          onClick={() => handleRemoveTenant(tenant.id)}
                          className="btn btn-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md px-3 py-1 flex items-center justify-end gap-2 ml-auto transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Modules */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono border-b border-gray-850 pb-4 mb-4">
              System Operations
            </h4>
            <div className="space-y-3">
              <button className="w-full btn btn-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg px-4 py-2.5 flex items-center justify-start gap-3 transition-colors cursor-pointer text-xs font-semibold h-auto">
                <Trash2 size={16} />
                <span className="text-left">Clear System Cache</span>
              </button>

              <button className="w-full btn btn-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-start gap-3 transition-colors cursor-pointer text-xs font-semibold h-auto">
                <RefreshCcw size={16} />
                <span className="text-left">Restart Background Sync Workers</span>
              </button>

              <button className="w-full btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 hover:text-indigo-300 rounded-lg px-4 py-2.5 flex items-center justify-start gap-3 transition-colors cursor-pointer text-xs font-semibold h-auto">
                <KeyRound size={16} />
                <span className="text-left">Rotate System API Keys</span>
              </button>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-[#0B0F19] border border-gray-850">
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                <span className="text-red-400 font-bold uppercase">Warning:</span> These actions execute instantly across all global database instances. Ensure all critical background operations are completed before performing system maintenance tasks.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── SUPPORT TICKETS LEDGER ─── */}
      <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col mt-6">
        <div className="flex flex-col gap-4 border-b border-gray-850 pb-4 mb-6 relative">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
            <Activity size={14} className="text-indigo-400 animate-pulse" /> Active Support Requests
          </h4>
        </div>

        <div className="overflow-x-auto text-[11px] w-full">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-[#0B0F19]/50 rounded-lg border border-gray-850">
              <p className="text-gray-400 font-medium text-xs font-mono">No active support requests found in DB.</p>
            </div>
          ) : (
            <table className="table table-xs w-full border-none">
              <thead>
                <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase font-mono text-[10px]">
                  <th className="bg-transparent pl-0 py-3">Ticket ID</th>
                  <th className="bg-transparent py-3">Client User</th>
                  <th className="bg-transparent py-3">Trouble Category</th>
                  <th className="bg-transparent py-3">Urgency</th>
                  <th className="bg-transparent py-3">Status</th>
                  <th className="bg-transparent py-3">Admin Notes / Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((tkt) => (
                  <tr key={tkt.id} className="border-b border-gray-850/30 last:border-none hover:bg-gray-900/10 transition-colors">
                    <td className="bg-transparent pl-0 py-4 font-bold text-indigo-400 font-mono">{tkt.id}</td>
                    <td className="bg-transparent py-4 text-gray-300 font-mono">{tkt.user_id}</td>
                    <td className="bg-transparent py-4 text-white font-medium max-w-xs break-words">
                      <div className="font-semibold text-slate-200">{tkt.category}</div>
                      <div className="text-[10px] text-slate-500 mt-1 bg-[#0d101a]/40 p-2 rounded border border-gray-800/60">
                        <span className="text-indigo-400 font-bold text-[9px] uppercase block mb-0.5 font-mono">User Message:</span>
                        {tkt.description || "No custom message provided."}
                      </div>
                    </td>
                    <td className="bg-transparent py-4">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        tkt.urgency === 'P1' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        tkt.urgency === 'P2' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {tkt.urgency}
                      </span>
                    </td>
                    <td className="bg-transparent py-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wide ${
                        tkt.status === 'RESOLVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        tkt.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      }`}>
                        ● {tkt.status}
                      </span>
                    </td>
                    <td className="bg-transparent py-4 pr-0">
                      {tkt.status === 'RESOLVED' ? (
                        <div className="text-gray-500 max-w-xs font-mono text-[10px] italic">
                          Resolved: {tkt.admin_reply}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {resolvingTicketId === tkt.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={adminReplyText}
                                onChange={(e) => setAdminReplyText(e.target.value)}
                                placeholder="Type resolution note..."
                                className="bg-[#131926] border border-gray-800 rounded px-2 py-1 text-white text-[10px] focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={() => handleResolveTicket(tkt.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => {
                                  setResolvingTicketId(null);
                                  setAdminReplyText("");
                                }}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-400 rounded px-2 py-1 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setResolvingTicketId(tkt.id)}
                              className="btn btn-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded px-2 py-1 cursor-pointer transition-colors text-[9px] font-bold uppercase tracking-wider"
                            >
                              Resolve Ticket
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Admin;