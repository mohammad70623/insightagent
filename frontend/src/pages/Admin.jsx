import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Database, Cpu, HardDrive, Trash2, RefreshCcw, KeyRound, Server } from 'lucide-react';

const Admin = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:8000/api/v1/admin/tenants', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTenants(response.data.tenants || []);
      } catch (error) {
        console.error("Failed to fetch tenant registry", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const handleRemoveTenant = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/v1/admin/tenant/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Dynamically filter out the removed tenant to update UI seamlessly without reloading
      setTenants((prev) => prev.filter(t => t.id !== userId));
      alert("Tenant ecosystem successfully flushed and terminated.");
    } catch (error) {
      console.error("Failed to remove tenant", error);
      alert("Failed to remove tenant. See console for details.");
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
            Global architectural configuration, active namespace registry, and high-privilege operations.
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted font-mono">Active Qdrant Clusters</p>
            <p className="text-xl font-bold text-white mt-1">12 Nodes <span className="text-xs text-emerald-400 font-normal ml-1">Healthy</span></p>
          </div>
        </div>
      </div>

      {/* ─── CONTROL TABLES & ACTION MODULES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tenant Registries Table */}
        <div className="lg:col-span-8 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col">
          <div className="flex flex-col gap-4 border-b border-gray-850 pb-4 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
              <Database size={14} className="text-brand-primary" /> Tenant Registries
            </h4>
          </div>
          
          <div className="overflow-x-auto text-[11px] w-full flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-brand-primary animate-pulse font-mono tracking-widest">
                SYNCING SECURE TENANT REGISTRY...
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
                    <th className="bg-transparent pl-0 py-3">User UUID & Email</th>
                    <th className="bg-transparent py-3">Assigned Qdrant Namespace</th>
                    <th className="bg-transparent py-3">Subscription Tier</th>
                    <th className="bg-transparent py-3">Ingested Data Size</th>
                    <th className="bg-transparent text-right pr-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-gray-850/30 last:border-none hover:bg-gray-900/10 transition-colors">
                      <td className="bg-transparent pl-0 py-4 font-semibold text-white font-mono flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 truncate w-40" title={tenant.id}>{tenant.id}</span>
                        <span className="text-brand-primary">{tenant.email}</span>
                      </td>
                      <td className="bg-transparent py-4 text-gray-300 font-mono">
                        {tenant.namespace}
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
                      <td className="bg-transparent py-4 font-mono text-gray-500">
                        {tenant.dataSize}
                      </td>
                      <td className="bg-transparent text-right pr-0 py-4">
                        <button 
                          onClick={() => handleRemoveTenant(tenant.id)}
                          className="btn btn-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md px-3 py-1 flex items-center justify-end gap-2 ml-auto transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Trash2 size={12} /> Remove Tenant
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
                <span className="text-left">Wipe Corrupted Vectors</span>
              </button>
              
              <button className="w-full btn btn-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-start gap-3 transition-colors cursor-pointer text-xs font-semibold h-auto">
                <RefreshCcw size={16} />
                <span className="text-left">Flush Global Polling Registry Nodes</span>
              </button>
              
              <button className="w-full btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 hover:text-indigo-300 rounded-lg px-4 py-2.5 flex items-center justify-start gap-3 transition-colors cursor-pointer text-xs font-semibold h-auto">
                <KeyRound size={16} />
                <span className="text-left">Rotate System LLaMA API Bundles</span>
              </button>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-[#0B0F19] border border-gray-850">
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                <span className="text-red-400 font-bold uppercase">Warning:</span> These actions execute instantly across all global database instances. Ensure synchronization is halted before rotating keys.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin;