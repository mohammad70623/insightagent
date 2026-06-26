import React, { useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Clock, Zap, Headphones, X, CheckCircle2 } from 'lucide-react';

/**
 * ContactModal - Reusable modal component for displaying support channels and corporate office context.
 * Designed to showcase service level agreement metrics and communications gates.
 * Props:
 *   - isOpen (boolean): Controls visibility of the modal.
 *   - onClose (function): Callback triggered when the modal is closed.
 */
const ContactModal = ({ isOpen, onClose }) => {
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-gray-800/60 bg-[#0b0f19] shadow-2xl flex flex-col text-left overflow-hidden relative animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Panel */}
        <div className="flex items-center justify-between border-b border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Pulsing blue status dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary font-mono flex items-center gap-1.5">
              <Headphones size={14} /> Support Status: Active
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
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 uppercase mb-3">
              📞 GLOBAL ENTERPRISE SUPPORT GATE
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Communications & Support Hub</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-2xl">
              Connect with InsightAgent's operational support cells. We maintain continuous service level agreements to troubleshoot vector deployments and resolve platform inquiries.
            </p>
            <div className="text-[9px] text-gray-500 font-mono mt-4 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-brand-primary" /> Active Response Routing • Core SLA Gateways Engaged
            </div>
          </div>

          {/* Grid Layout of Communication Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Section 1: Official Channels */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-indigo-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-brand-primary">
                  <Mail size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Official Support Channels</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Corporate pipeline for troubleshooting and requests.</p>
                </div>
              </div>
              <div className="space-y-3.5 text-[11px] text-slate-400 leading-relaxed">
                <p>
                  For standard tickets, billing operations, and workspace configurations, route your query directly to our triage center:
                </p>
                <div className="bg-[#070a13] border border-gray-800/80 p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono block">EMAIL SUPPORT HELPDESK</span>
                    <a href="mailto:support@insightagent.ai" className="text-white hover:text-brand-primary font-bold font-mono tracking-wide transition-colors">
                      support@insightagent.ai
                    </a>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-mono uppercase font-bold">1 Click Connect</span>
                </div>
              </div>
            </div>

            {/* Section 2: Live Chat Pipeline */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-indigo-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-brand-primary">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Live Agent Chat Routing</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Real-time chat framework and diagnostics.</p>
                </div>
              </div>
              <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
                <p>
                  We are actively building our diagnostic live-chat console to enable real-time screensharing and direct session analysis:
                </p>
                <div className="bg-[#070a13] border border-gray-850/80 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">Live Agent Routing</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full font-mono">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: SLA Tiers */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-indigo-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-brand-primary">
                  <Clock size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Service Level Agreements (SLA)</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Standard support turnaround thresholds by package tier.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Free Tier Support:</strong> Requests are processed within <span className="text-white font-semibold">24-48 business hours</span>, triaged in standard queues.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white font-semibold">Pro Tier Support:</strong> Escalated routing rules trigger a response turnaround commitment of under <span className="text-white font-semibold">12 hours</span>.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 4: Corporate Office Information */}
            <div className="rounded-xl border border-gray-800/40 bg-[#0d1321]/50 p-5 hover:border-indigo-500/10 transition-colors duration-300">
              <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-850 text-brand-primary">
                  <MapPin size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Corporate Operations</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Platform ownership and operating hub context.</p>
                </div>
              </div>
              <ul className="list-none space-y-3 pl-0 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">Corporate Entity:</strong> InsightAgent AI Corporation.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-primary font-mono text-[9px] mt-0.5 select-none">▪</span>
                  <div>
                    <strong className="text-white">HQ Operations:</strong> Virtual HQ network matching modern, distributed cloud-security engineering infrastructures.
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Section 5: Priority Dedicated Support */}
          <div className="rounded-xl border-2 border-brand-primary/20 bg-gradient-to-br from-[#101726]/40 to-[#0b0f19] p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <Zap size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Priority Dedicated Support</h3>
                <p className="text-[9px] text-brand-muted mt-0.5">High-availability response parameters for Enterprise accounts.</p>
              </div>
            </div>
            <div className="space-y-3.5 text-[11px] text-slate-400 leading-relaxed">
              <p>
                Enterprise subscribers are routed to a dedicated, high-availability customer success queue:
              </p>
              <div className="p-3.5 rounded-lg bg-[#070a13] border border-gray-800/80 flex items-start gap-2.5">
                <Headphones size={15} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold font-mono text-[10px] uppercase block mb-1">UNDER 1-HOUR RESPONSE SLA</span>
                  <p className="text-brand-muted leading-relaxed">
                    Enterprise requests bypass general triaging databases and trigger direct SMS/Slack alerts to our on-call engineering cell. We guarantee an initial technical diagnosis and mitigation plan in **under 1 hour**, 24/7/365, backed by a dedicated customer support engineer.
                  </p>
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
            className="btn btn-xs bg-brand-primary text-black font-bold text-xs rounded-lg px-4 py-2 hover:bg-indigo-400 transition-all cursor-pointer h-8 border-none flex items-center justify-center active:scale-95"
          >
            Close Support Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
