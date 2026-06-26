import React, { useEffect } from 'react';
import { Scale, ShieldCheck, AlertTriangle, CreditCard, AlertCircle, Trash2, X } from 'lucide-react';

/**
 * TermsOfServiceModal - Reusable modal component for displaying terms of service documentation.
 * Designed to work from the public landing page's footer.
 * Props:
 *   - isOpen (boolean): Controls visibility of the modal.
 *   - onClose (function): Callback triggered when the modal is closed.
 */
const TermsOfServiceModal = ({ isOpen, onClose }) => {
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
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#070a13]/85 backdrop-blur-md p-4 animate-backdrop-fade-slow"
      onClick={onClose}
    >
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-gray-800/60 bg-[#0b0f19] shadow-2xl flex flex-col text-left overflow-hidden relative animate-modal-enter-slow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Panel */}
        <div className="flex items-center justify-between border-b border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Pulsing indigo/blue indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary font-mono flex items-center gap-1.5">
              <Scale size={14} /> Platform Terms of Service
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
          <div className="relative overflow-hidden rounded-xl border border-gray-800/40 bg-gradient-to-r from-surface to-[#0e1322] p-6">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 uppercase mb-3">
              ⚖️ LEGAL AGREEMENT
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Terms of Service</h2>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed max-w-2xl">
              Welcome to InsightAgent. By accessing our platform, orchestrating AI agents, or provisioning dedicated vector stores, you agree to comply with this legal framework.
            </p>
            <div className="text-[9px] text-gray-500 font-mono mt-4">
              Effective Date: June 27, 2026 • Policy Version: 1.0-2026
            </div>
          </div>

          {/* Legal Sections */}
          <div className="space-y-6">
            
            {/* Section 1: User Responsibilities */}
            <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-brand-primary">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">1. User Responsibilities & Acceptable Use</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Rules regarding system usage and asset orchestration guidelines.</p>
                </div>
              </div>
              
              <ul className="list-none space-y-3.5 pl-0 text-xs text-brand-muted leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Asset Security:</strong> You represent that you own or possess explicit authorizations for all knowledge assets, documents, and corporate records ingested into the platform.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Illegal Content Ban:</strong> You are strictly prohibited from uploading, training, or referencing any content that violates global intellectual property laws, contains active malicious software payloads, or promotes illegal operations.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Agent Misuse:</strong> You agree not to manipulate or orchestrate our automated AI analytical modules to execute fraudulent operations, spam campaigns, or simulate human actors to bypass authentication layers elsewhere.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 2: Prohibited Use */}
            <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-red-400">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">2. Prohibited Conduct & Reverse-Engineering</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Prohibitions guarding core platform systems and pipelines.</p>
                </div>
              </div>
              
              <ul className="list-none space-y-3.5 pl-0 text-xs text-brand-muted leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Workflow Tampering:</strong> You may not dissect, decompile, or attempt to reverse-engineer our proprietary agentic orchestration frameworks, vector databases, or custom SWOT matrix generation endpoints.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Security Probing:</strong> Port scanning, penetration testing, load spikes intended to disrupt service, or security evaluations of the Qdrant and Redis memory layers are strictly prohibited without express written authorization.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Scraping Limits:</strong> Standard programmatic data scraping, automated indexing extraction, or database crawling utilizing API tokens for third-party resale is banned and constitutes immediate terms violation.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 3: Subscription & Billing */}
            <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-brand-primary">
                  <CreditCard size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">3. Subscription Tiers & Payment Schedules</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Financial frameworks and platform upgrade agreements.</p>
                </div>
              </div>
              
              <ul className="list-none space-y-3.5 pl-0 text-xs text-brand-muted leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Platform Tiers:</strong> Access is divided into three packages: <span className="text-brand-primary">Starter</span> (Standard Sandbox), <span className="text-brand-primary">Pro</span> (Expanded Vector Indexing & Limits), and <span className="text-brand-primary">Enterprise</span> (Dedicated Cluster and TAM support).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Recurring Billing:</strong> Paid tiers use automated credit card recurring billing cycles. Subscriptions automatically renew at the beginning of each billing cycle (monthly) unless cancelled.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">No-Refund Policy:</strong> Due to computational processing allocation costs and external API payload processing charges (e.g., Groq models), all fees paid are non-refundable. Remaining vector query limits expire at the end of each monthly tier cycle and do not carry over.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 4: Limitation of Liability */}
            <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-brand-primary">
                  <AlertCircle size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">4. Limitation of Liability & AI Accuracy</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Disclaimer concerning LLM limitations and database dependencies.</p>
                </div>
              </div>
              
              <div className="space-y-3.5 text-xs text-brand-muted leading-relaxed">
                <p>
                  InsightAgent serves as a tool designed to retrieve knowledge and generate analytical templates. 
                  You acknowledge and agree to the following AI-specific provisions:
                </p>
                <div className="p-3.5 rounded-lg bg-[#070a13] border border-gray-800/80 text-[11px] leading-relaxed">
                  <span className="text-white font-semibold block mb-1">AI Output Disclaimer:</span>
                  All agent outputs, chat summaries, and SWOT matrices are generated via high-dimensional probability models. They do not constitute formal business, legal, or financial advice. Outputs may not be 100% accurate or complete under all corporate settings. You must verify and validate all metrics before committing to downstream choices.
                </div>
                <p>
                  Under no circumstances will InsightAgent or its team members be liable for any direct, indirect, incidental, or consequential losses stemming from model hallucinations, vector store queries, or decisions made using analytics generated by the service.
                </p>
              </div>
            </div>

            {/* Section 5: Termination */}
            <div className="rounded-xl border border-gray-850/60 bg-gradient-to-br from-[#1c1216]/60 to-[#0b0f19] p-5 border-l-4 border-l-red-500/65 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 border-b border-red-500/15 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/25 text-red-400">
                  <Trash2 size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 font-mono">5. Account Suspending & Termination</h3>
                  <p className="text-[9px] text-red-400/70 mt-0.5">Immediate vector space cancellation and session gates.</p>
                </div>
              </div>
              
              <p className="text-xs text-brand-muted leading-relaxed">
                We reserve the absolute right to instantly suspend access, delete verified session tokens, and irreversibly purge dedicated tenant vector DB space collections in Qdrant upon discovery of terms violations, fraudulent billing inputs, or conduct threatening system integrity. System backups and storage retention cycles will be bypassed immediately during a breach termination.
              </p>
            </div>

          </div>
        </div>

        {/* Sticky Bottom Footer Close Panel */}
        <div className="border-t border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 flex justify-end shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-xs bg-brand-primary text-black font-bold text-xs rounded-lg px-4 py-2 hover:bg-indigo-400 transition-all cursor-pointer h-8 border-none flex items-center justify-center active:scale-95"
          >
            Close Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
