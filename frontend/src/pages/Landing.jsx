import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-black font-black text-sm">I</div>
          <span className="text-sm font-bold tracking-tight text-white">InsightAgent</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-brand-muted">
          <button type="button" onClick={() => navigate('/login')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-brand-muted">Dashboard</button>
          <button type="button" onClick={() => navigate('/docs')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none text-xs font-semibold text-brand-muted">Docs</button>
          <a href="#pricing" className="hover:text-white transition-colors">Feedback</a>
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
          <div className="flex-1 bg-main/50 rounded-lg border border-gray-850/40 p-4 flex items-center justify-center relative">
            <div className="text-center space-y-2">
              <div className="h-1.5 w-24 bg-gray-800 rounded mx-auto animate-pulse" />
              <div className="h-1.5 w-16 bg-gray-800 rounded mx-auto animate-pulse" />
            </div>
            <span className="absolute bottom-3 left-4 text-[9px] font-mono text-brand-primary/60">Live Intelligence Stream...</span>
            <span className="absolute top-3 right-4 text-[8px] font-mono text-gray-600">https://app.insightagent.ai/dashboard</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section id="features" className="max-w-[1400px] mx-auto px-6 py-20 md:px-12 border-t border-gray-900/60 text-center space-y-12">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Architected for Precision</h2>
          <p className="text-xs text-brand-muted max-w-lg mx-auto leading-relaxed">
            Our "Stitch" architecture creates a modular, interconnected fabric for your organizational data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><BarChart3 size={16} /></div>
            <h3 className="text-sm font-bold text-white">Deep Analytics</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">Vectorized processing of unstructured data across your entire enterprise cloud stack.</p>
            <button type="button" onClick={() => navigate('/docs')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-none outline-none">Explore Docs ↗</button>
          </div>
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><MessageSquare size={16} /></div>
            <h3 className="text-sm font-bold text-white">AI Chat Agent</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">Context-aware conversational interface for natural language querying of complex datasets.</p>
            <button type="button" onClick={() => navigate('/docs')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-none outline-none">Agent Capabilities ↗</button>
          </div>
          <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-md space-y-4">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-brand-primary"><ShieldCheck size={16} /></div>
            <h3 className="text-sm font-bold text-white">Security First</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-medium">SOC2 Type II compliant infrastructure with local-only processing options for sensitive PII.</p>
            <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-none outline-none">Security Portal ↗</button>
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