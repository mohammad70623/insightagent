import React, { useEffect } from 'react';
import { Shield, Lock, Server, Terminal, ShieldAlert, Cpu, CheckCircle2, X } from 'lucide-react';

/**
 * SecurityModal - Reusable modal component for displaying security architecture details.
 * Designed to showcase system trustworthiness to public visitors and enterprise buyers.
 * Props:
 *   - isOpen (boolean): Controls visibility of the modal.
 *   - onClose (function): Callback triggered when the modal is closed.
 */
const SecurityModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling when active
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#070a13]/85 backdrop-blur-md p-4 animate-backdrop-fade"
      onClick={onClose}
    >
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-emerald-500/20 bg-[#0b0f19] shadow-[0_0_50px_rgba(16,185,129,0.05)] flex flex-col text-left overflow-hidden relative animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Panel */}
        <div className="flex items-center justify-between border-b border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Pulsing emerald/green status dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
              <Shield size={14} /> System Status: Secure
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-brand-muted hover:text-white transition-colors text-lg font-bold bg-transparent border-none cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
          
          {/* Header Segment */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/10 bg-gradient-to-r from-surface to-[#0a111a] p-6">
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase mb-3">
              🛡️ SOC 2 TYPE II COMPLIANCE FRAMEWORK
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Security Architecture & Trust Framework</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-2xl">
              InsightAgent enforces zero-trust architecture parameters to insulate corporate directories and document caches. Our multi-tenant vectors and processing pipelines operate under strict compliance criteria.
            </p>
            <div className="text-[9px] text-emerald-400/70 font-mono mt-4 flex items-center gap-1">
              <CheckCircle2 size={10} /> ISO/IEC 27001 Ready Verified • Continuous Control Monitoring Active
            </div>
          </div>

          {/* Grid Layout of Security Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Section 1: Infrastructure Security */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-emerald-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-emerald-400">
                  <Server size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Infrastructure Security</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Isolated hosting environments and transport protection.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Secure Tier Ingress:</strong> Hosted inside top-tier public cloud environments (AWS/GCP) within isolated Virtual Private Clouds (VPC).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Automated Firewalls:</strong> Web Application Firewalls (WAF) throttle rogue requests, block SQL injections, and buffer DDoS threats before reaching backend resources.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">TLS 1.3 Encryption:</strong> All transit data is sealed with TLS 1.3 protocol. Database storage arrays are fully encrypted at rest using AES-256 keys.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 2: Authentication & Access */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-emerald-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-emerald-400">
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Session Gates & Auth</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Identity protection and programmatic access controls.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">JWT Session Enforcement:</strong> Cryptographically generated JSON Web Tokens (JWT) manage secure state gates, keeping credentials isolated.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Bcrypt Passwords:</strong> Credentials undergo salting processes and are hashed with standard bcrypt parameters. Multi-factor OAuth 2.0 manages social identities.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Granular RBAC:</strong> Role-Based Access Control filters database endpoints, ensuring team users cannot read administrative workspaces.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 3: File & Knowledge Security */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-emerald-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-emerald-400">
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">File & Document Security</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Processing parameters guarding corporate files.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Transient Buffer Read:</strong> Document ingestion pipelines process files in stateless, encrypted in-memory buffers. Raw files are not written to persistent disks.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Sandboxed Malware Scans:</strong> Upload streams undergo automated, sandboxed virus scanning to filter executable exploit vectors before chunking starts.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Isolated Tenant Buckets:</strong> Storage namespaces are separated at the database key level. Users only see records belonging explicitly to their verified organization.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 4: AI & Vector Guardrails */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-emerald-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-emerald-400">
                  <Cpu size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">AI Security & Vector Isolation</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Data boundaries inside LLMs and Qdrant.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Prompt Injection Guards:</strong> Input streams undergo lexical token analysis to filter malicious overrides (e.g. system prompt manipulation queries).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Data Leakage Prevention:</strong> Automated scrubbing patterns redact highly sensitive PII values (social numbers, local database strings) prior to API transit.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Closed-Loop Vectors:</strong> Qdrant vector spaces isolate enterprise namespaces. Tenant identification metadata triggers standard index-level query overrides.
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Section 5: Audits & Testing */}
          <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-emerald-500/10 transition-colors duration-300">
            <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-emerald-400">
                <Terminal size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Testing, Audits & continuous bug bounty</h3>
                <p className="text-[9px] text-gray-500 mt-0.5">Continuous defense evaluations by automated monitors and research networks.</p>
              </div>
            </div>
            <div className="space-y-3.5 text-[11px] text-slate-400 leading-relaxed">
              <p>
                We validate our codebases and hosting clusters using standard red-team evaluation patterns:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#070a13] border border-gray-800 p-3.5 rounded-lg">
                  <span className="text-white font-mono text-[10px] uppercase font-bold tracking-wider block mb-1">AUTOMATED PENETRATION CHECKS</span>
                  Continuous vulnerability scanners search dependency nodes and container versions for outdated schemas. Automated security scanners test platform boundaries daily.
                </div>
                <div className="bg-[#070a13] border border-gray-800 p-3.5 rounded-lg">
                  <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider block mb-1">CONTINUOUS BUG BOUNTY PROGRAM</span>
                  Through an active collaboration with verified security research networks, researchers continuously evaluate API endpoints, token gates, and vector layers to report potential vulnerabilities under responsible disclosure guidelines.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Bottom Footer Close Panel */}
        <div className="border-t border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 flex justify-end shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-xs bg-emerald-500 text-black font-bold text-xs rounded-lg px-4 py-2 hover:bg-emerald-400 transition-all cursor-pointer h-8 border-none flex items-center justify-center active:scale-95"
          >
            Close Security Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityModal;
