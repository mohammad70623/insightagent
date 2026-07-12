import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, MessageSquare, ShieldCheck, ArrowRight, CheckCircle2, Globe, ArrowUpRight } from 'lucide-react';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';
import SecurityModal from '../components/SecurityModal';
import ContactModal from '../components/ContactModal';

const languages = [
  { code: 'en', name: 'English (US)', active: true },
  { code: 'es', name: 'Español (Spanish)', active: false },
  { code: 'fr', name: 'Français (French)', active: false },
  { code: 'de', name: 'Deutsch (German)', active: false },
  { code: 'zh', name: '简体中文 (Chinese)', active: false },
  { code: 'ja', name: '日本語 (Japanese)', active: false },
  { code: 'bn', name: 'বাংলা (Bengali)', active: false },
  { code: 'ar', name: 'العربية (Arabic)', active: false },
  { code: 'pt', name: 'Português (Portuguese)', active: false },
  { code: 'ru', name: 'Русский (Russian)', active: false },
  { code: 'hi', name: 'हिन्दी (Hindi)', active: false },
  { code: 'it', name: 'Italiano (Italian)', active: false },
  { code: 'ko', name: '한국어 (Korean)', active: false },
  { code: 'nl', name: 'Nederlands (Dutch)', active: false },
  { code: 'tr', name: 'Türkçe (Turkish)', active: false },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', active: false },
  { code: 'pl', name: 'Polski (Polish)', active: false },
  { code: 'id', name: 'Bahasa Indonesia', active: false },
  { code: 'sv', name: 'Svenska (Swedish)', active: false },
  { code: 'no', name: 'Norsk (Norwegian)', active: false },
  { code: 'fi', name: 'Suomi (Finnish)', active: false },
  { code: 'da', name: 'Dansk (Danish)', active: false },
  { code: 'he', name: 'עברית (Hebrew)', active: false },
  { code: 'th', name: 'ไทย (Thai)', active: false },
  { code: 'ms', name: 'Bahasa Melayu', active: false },
  { code: 'uk', name: 'Українська (Ukrainian)', active: false }
];

/**
 * @description Enterprise SaaS Landing & Pricing Page Component
 * Architecture: Clean Component Design using modern Arrow Function expression.
 */
const Landing = () => {
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Simulated Log Stream State
  const dynamicLogs = useMemo(() => [
    { type: 'SYSTEM', text: 'Initializing connectivity node with Groq Inference Cloud...', color: 'text-slate-400' },
    { type: 'MODEL', text: 'Spawning LLaMA 3 autonomous agent clusters...', color: 'text-purple-400' },
    { type: 'RAG CORE', text: 'Synchronizing embedding index vectors (42/50 modules verified)...', color: 'text-cyan-400' },
    { type: 'MATRIX', text: 'Scanning Risk & Remediation node topology across 21 points...', color: 'text-amber-400' },
    { type: 'TELEMETRY', text: 'Hardware latency metrics stabilized at ~6.33ms delta.', color: 'text-emerald-400' },
    { type: 'AI AGENT', text: 'Synthesizing strategic forecasting matrices for Next 6 Quarters...', color: 'text-cyan-400' },
    { type: 'SUCCESS', text: 'Executive Intelligence Report securely compiled. Awaiting dashboard fetch.', color: 'text-emerald-400 font-semibold' }
  ], []);

  const [visibleLogs, setVisibleLogs] = useState([dynamicLogs[0]]);
  const logContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLogs((prev) => {
        if (prev.length >= dynamicLogs.length) {
          return [dynamicLogs[0]];
        }
        return [...prev, dynamicLogs[prev.length]];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [dynamicLogs]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [visibleLogs]);

 
  const pricingPlans = useMemo(() => [
    {
      name: 'Starter',
      price: '$0',
      features: ['Up to 5 AI Agents', '100GB Data Lake Storage', 'Standard Support'],
      isPopular: false
    },
    {
      name: 'PRO PLAN',
      price: '$29',
      features: ['Unlimited AI Agents', '1TB Data Lake Storage', 'Custom Fine-Tuning', 'Priority 24/7 Support'],
      isPopular: true,
      badge: 'Most Popular'
    },
    {
      name: 'ENTERPRISE',
      price: '$149',
      features: ['On-Premise Deployment', 'Infinite Scalability', 'Dedicated TAM'],
      isPopular: false
    }
  ], []);

  return (
    <div className="min-h-screen bg-main text-white font-sans select-none overflow-x-hidden">
      
      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header className="flex h-16 items-center justify-between border-b border-gray-800/40 bg-surface px-6 md:px-12 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png" 
            alt="InsightAgent Logo" 
            className="w-9 h-9 object-cover rounded-xl border border-slate-850 shadow-md transform hover:scale-105 transition-transform duration-200"
            crossOrigin="anonymous"
          />
          <span className="text-sm font-bold tracking-tight text-white">InsightAgent</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-muted">
          <button type="button" onClick={() => navigate('/login')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-brand-muted">Dashboard</button>
          <button type="button" onClick={() => navigate('/docs')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-brand-muted">Docs</button>
          <button type="button" onClick={() => navigate('/feedback')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-brand-muted">Feedback</button>
        </nav>
        <button 
          type="button" 
          onClick={() => navigate('/login')}
          className="btn btn-xs border-none bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-md px-3 font-bold cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-6 pt-16 pb-20 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full tracking-wider uppercase">
            ✦ Next-Gen Enterprise AI
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Empowering <br />
            <span className="text-brand-primary">Enterprise</span> with Insight
          </h1>
          <p className="text-xs md:text-sm text-brand-muted max-w-xl leading-relaxed font-medium">
            Deploy secure, private AI agents that integrate with your corporate data lake. Transform raw signals into strategic intelligence in milliseconds.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              type="button"
             onClick={() => navigate('/register')}
              className="btn bg-brand-primary text-black font-bold text-xs rounded-lg px-5 py-3 hover:bg-indigo-400 cursor-pointer flex items-center gap-2"
            >
              Get Started <ArrowRight size={14} />
            </button>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="btn bg-transparent border border-gray-800 text-white font-bold text-xs rounded-lg px-5 py-3 hover:bg-gray-900 transition-colors cursor-pointer"
            >
              View Demo
            </button>
          </div>
          <p className="text-[11px] text-gray-500 font-medium pt-4">Trusted by 200+ Enterprise Data Teams</p>
        </div>

        {/* Hero Interactive Video/Dashboard Mock Up Preview */}
        <div className="lg:col-span-5 rounded-xl border border-gray-800/60 bg-surface/40 p-4 aspect-[4/3] shadow-2xl relative flex flex-col justify-between overflow-hidden group">
          <div className="flex gap-1.5 mb-2">
            <div className="h-2 w-2 rounded-full bg-red-500/60" />
            <div className="h-2 w-2 rounded-full bg-amber-500/60" />
            <div className="h-2 w-2 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 bg-main/50 rounded-lg border border-gray-850/40 p-4 flex flex-col justify-between relative overflow-hidden">
            <div 
              ref={logContainerRef} 
              className="flex-1 overflow-y-auto max-h-48 space-y-1.5 pr-1 text-[9px] font-mono text-left scrollbar-none"
            >
              {visibleLogs.map((log, idx) => (
                <div key={idx} className={`animate-fade-in ${log.color}`}>
                  [{log.type}]: {log.text}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-850/40 pt-2 mt-2">
              <div className="flex items-center text-[9px] font-mono text-brand-primary/60">
                <span className="relative flex h-1.5 w-1.5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live Intelligence Stream...
              </div>
              <span className="text-[8px] font-mono text-gray-600">https://app.insightagent.ai/dashboard</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section id="features" className="max-w-[1400px] mx-auto px-6 py-20 md:px-12 border-t border-gray-900/60 text-center space-y-12">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Architected for Precision</h2>
          <p className="text-xs text-brand-muted max-w-2xl md:max-w-3xl mx-auto leading-relaxed">
            InsightAgent safely syncs with your secure documents to build a smart network for your business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><BarChart3 size={16} /></div>
            <h3 className="text-sm font-bold text-white">Deep Analytics</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">Easily upload and analyze your business PDFs, spreadsheets, and txt files in seconds.</p>
            <Link className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 mt-2 transition-colors text-[10px]" to="/docs">
              Explore Docs ↗
            </Link>
          </div>
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><MessageSquare size={16} /></div>
            <h3 className="text-sm font-bold text-white">AI Chat Agent</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">Ask questions in plain English and get instant answers from your internal database.</p>
            <button type="button" onClick={() => navigate('/docs#agent-capabilities')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-none outline-none">Agent Capabilities ↗</button>
          </div>
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><ShieldCheck size={16} /></div>
            <h3 className="text-sm font-bold text-white">Security First</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">Enterprise-grade privacy with fully secured data handling to keep your records safe.</p>
            <button type="button" onClick={() => navigate('/docs#security-privacy')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-none outline-none">Security Portal ↗</button>
          </div>
        </div>
      </section>

      {/* ─── PRICING MATRICES SECTION ─── */}
      <section id="pricing" className="max-w-[1400px] mx-auto px-6 py-20 md:px-12 border-t border-gray-900/60 text-center space-y-12">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Scalable Intelligence</h2>
          <p className="text-xs text-brand-muted">Choose the plan that fits your organizational scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {pricingPlans.map((plan, i) => (
            <div 
              key={i} 
              className={`rounded-xl border p-6 flex flex-col justify-between text-left relative ${
                plan.isPopular 
                  ? 'border-brand-primary bg-surface/80 shadow-[0_0_30px_rgba(129,140,248,0.05)] ring-1 ring-brand-primary/50' 
                  : 'border-gray-800/40 bg-surface'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-black tracking-widest text-black bg-brand-primary px-2.5 py-0.5 rounded-full font-mono uppercase shadow-md">
                  {plan.badge}
                </span>
              )}
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono font-black text-brand-muted tracking-widest uppercase">{plan.name}</p>
                  <h3 className="text-2xl font-black text-white mt-2">
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="text-xs font-medium text-brand-muted font-mono"> / mo</span>}
                  </h3>
                </div>
                
                <ul className="space-y-2.5 text-xs font-medium text-gray-300 border-t border-gray-850/40 pt-4">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-brand-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                type="button"
                onClick={() => navigate('/register')}
                className={`btn btn-sm w-full font-bold text-xs rounded-lg mt-8 h-9 border-none cursor-pointer transition-all ${
                  plan.isPopular 
                    ? 'bg-brand-primary text-black hover:bg-indigo-400 shadow-lg' 
                    : 'bg-transparent border border-gray-850 text-white hover:bg-gray-900'
                }`}
              >
                {plan.name === 'ENTERPRISE' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM HERO CALL-TO-ACTION BANNER ─── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24 md:px-12">
        <div className="rounded-2xl border border-gray-800/40 bg-surface p-8 md:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Ready to unleash your data's potential?</h2>
          <p className="text-xs text-brand-muted max-w-lg mx-auto font-medium">
            Join the world's leading enterprises and start making faster, AI-driven decisions today.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button type="button" onClick={() => navigate('/login')} className="btn bg-brand-primary text-black font-bold text-xs rounded-lg px-5 py-2.5 hover:bg-indigo-400 cursor-pointer">Start Free Trial</button>
            <button type="button" onClick={() => navigate('/login')} className="btn bg-transparent border border-gray-800 text-white font-bold text-xs rounded-lg px-5 py-2.5 hover:bg-gray-900 cursor-pointer">Schedule a Call</button>
          </div>
        </div>
      </section>

      {/* ─── GLOBAL FOOTER HUB ─── */}
      <footer className="border-t border-gray-900/60 bg-surface/20 px-6 py-8 md:px-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] font-medium text-brand-muted max-w-[1400px] mx-auto">
        <div className="flex items-center gap-1">
          <span className="font-bold text-white">InsightAgent</span>
          <span>© 2026 InsightAgent AI Corp. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap gap-4 font-semibold">
          <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[11px]">Privacy Policy</button>
          <button type="button" onClick={() => setShowTermsModal(true)} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[11px]">Terms of Service</button>
          <button type="button" onClick={() => setShowSecurityModal(true)} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[11px]">Security</button>
          <button type="button" onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[11px]">Contact</button>
        </div>
        <div className="relative flex gap-3 text-gray-500">
          <button 
            type="button" 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="hover:text-white cursor-pointer bg-transparent border-none p-0 flex items-center justify-center text-gray-500 hover:text-white"
            aria-label="Language Selector"
          >
            <Globe size={14} />
          </button>

          {showLangDropdown && (
            <div className="absolute bottom-14 right-0 w-56 max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2 shadow-2xl z-50 scrollbar-thin scrollbar-thumb-slate-800 text-left">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-slate-950/95 backdrop-blur-xl pb-1.5 mb-1.5 border-b border-slate-850 text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase pl-2">
                Choose Language
              </div>

              {/* List */}
              <div className="space-y-0.5">
                {languages.map((lang) => {
                  if (lang.active) {
                    return (
                      <div 
                        key={lang.code} 
                        className="flex items-center justify-between text-slate-100 bg-slate-900 rounded-lg font-medium py-1.5 px-2 text-sm cursor-default"
                      >
                        <span>{lang.name}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      </div>
                    );
                  } else {
                    return (
                      <span 
                        key={lang.code} 
                        className="opacity-40 cursor-not-allowed hover:bg-transparent text-slate-400 py-1.5 px-2 text-sm block"
                      >
                        {lang.name}
                      </span>
                    );
                  }
                })}
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-xl pt-1.5 mt-1.5 border-t border-slate-850 text-[8px] font-mono text-center text-slate-600">
                Localization coming soon (v2.0)
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* ─── PRIVACY POLICY GLOBAL MODAL ─── */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />

      {/* ─── TERMS OF SERVICE GLOBAL MODAL ─── */}
      <TermsOfServiceModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />

      {/* ─── SECURITY GLOBAL MODAL ─── */}
      <SecurityModal 
        isOpen={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
      />

      {/* ─── CONTACT GLOBAL MODAL ─── */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
};

export default Landing;