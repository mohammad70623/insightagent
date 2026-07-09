import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, Activity, UploadCloud, CreditCard, ChevronRight, FileText, Database, ShieldCheck, ArrowLeft, Terminal } from 'lucide-react';

const Docs = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('system-overview');

  const sections = [
    { id: 'system-overview', title: '1. System Overview' },
    { id: 'auth-gateway', title: '1.1 Authentication Gateway' },
    { id: 'workspace-core', title: '2. Workspace Core' },
    { id: 'predictive-analytics', title: '3. Predictive Analytics' },
    { id: 'document-ingestion', title: '4. Document Ingestion' },
    { id: 'billing-tiers', title: '5. Billing & Tiers' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  const curlSnippet = `curl -X 'POST' 'https://api.insightagent.ai/api/v1/auth/google' \\
  -H 'Content-Type: application/json' \\
  -d '{ "token": "YOUR_FIREBASE_ID_TOKEN" }'`;

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 font-sans select-none overflow-x-hidden pb-20">
      
      {/* ─── STICKY HEADER ─── */}
      <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 md:px-12 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span className="h-4 w-[1px] bg-slate-800" />
          <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-primary text-black font-black text-xs font-mono">I</div>
          <span className="text-xs font-bold tracking-tight text-white">InsightAgent Docs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded">
            v1.0.0 Stable
          </span>
        </div>
      </header>

      <div className="max-w-[1300px] mx-auto px-6 pt-10 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── SIDEBAR NAV ─── */}
        <aside className="lg:col-span-3 sticky top-24 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-4 hidden lg:block">
          <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono pl-3 mb-4">Documentation Map</p>
          <nav className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full flex items-center justify-between text-left py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                  activeSection === sec.id
                    ? 'text-brand-primary bg-brand-primary/10 font-bold border-l-2 border-brand-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>{sec.title}</span>
                <ChevronRight size={12} className={activeSection === sec.id ? 'opacity-100' : 'opacity-30'} />
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── CONTENT READER ─── */}
        <main className="lg:col-span-9 space-y-12 bg-slate-950/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 md:p-10 shadow-2xl">
          
          <div className="border-b border-slate-900 pb-6 mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              SYSTEM DOCUMENTATION: INSIGHTAGENT ARCHITECTURE v1.0.0
            </h1>
            <p className="text-xs text-brand-muted mt-2">
              Principal architecture design manual, REST endpoints schema, telemetry definitions, and data lake ingestion pipelines.
            </p>
          </div>

          {/* SECTION 1 */}
          <section id="system-overview" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <Sparkles size={18} className="text-brand-primary" />
              1. SYSTEM OVERVIEW & GETTING STARTED
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              InsightAgent is an advanced Multi-Agent Orchestration and Retrieval-Augmented Generation (RAG) system engineered for enterprise-grade unstructured corporate data synthesis. Powered by LLaMA 3 via the Groq Inference Matrix and a FastAPI Python framework, it bridges unorganized document lakes with interactive strategic forecasting models.
            </p>
          </section>

          {/* SECTION 1.1 */}
          <section id="auth-gateway" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              1.1 Secure Enterprise Authentication Gateway
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Authentication is strictly guarded via federated Google Logins backed by the Firebase Admin SDK.
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-350 space-y-1.5">
              <li><strong>Token Exchange Pipeline:</strong> The frontend captures the idToken upon client sign-in and passes it securely to the FastAPI auth router.</li>
              <li><strong>Verification Target Endpoint:</strong></li>
            </ul>
            <div className="bg-[#0B0F19] rounded-xl p-4 border border-slate-900 font-mono text-[10px] space-y-2 relative group whitespace-pre-wrap">
              <div className="absolute right-3 top-3 text-slate-600 group-hover:text-slate-400 transition-colors">
                <Terminal size={12} />
              </div>
              {curlSnippet}
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="workspace-core" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <Activity size={18} className="text-slate-400" />
              2. WORKSPACE CORE & TELEMETRY
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              The InsightAgent dashboard maintains constant polling of your system's operational telemetry. The main layout coordinates three key segments: Onboarding, Anomaly Scanning, and Infrastructure Health.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Onboarding Checklist States</h4>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>● <span className="text-slate-200">has_uploaded_data</span>: Detects data lake initialization.</li>
                  <li>● <span className="text-slate-200">has_processed_data</span>: Verifies vector indexing status.</li>
                  <li>● <span className="text-slate-200">has_explored_insights</span>: Captures first conversational interaction.</li>
                </ul>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Infrastructure Health Metrics</h4>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>● <span className="text-slate-200">CPU Load Factor</span>: Active core usage monitoring.</li>
                  <li>● <span className="text-slate-200">Cluster Memory Pool</span>: Qdrant vector DB allocation.</li>
                  <li>● <span className="text-slate-200">Network Interface I/O</span>: Data ingress/egress bytes.</li>
                  <li>● <span className="text-slate-200">API Response Latency</span>: Target SLA response benchmark.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="predictive-analytics" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <BrainCircuit size={18} className="text-slate-450" />
              3. PREDICTIVE ANALYTICS ENGINE
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              Our simulated projection curves react to 6 core parameters. Sliders adjust the financial forecasting math dynamically:
            </p>
            <div className="overflow-x-auto border border-slate-900 rounded-xl">
              <table className="table table-xs w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-bold text-left uppercase">
                    <th className="p-3">Variable Name</th>
                    <th className="p-3">Range Limits</th>
                    <th className="p-3">Impact Vector Coefficient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-white">Price Adjuster</td>
                    <td className="p-3">-50% to +50%</td>
                    <td className="p-3 text-cyan-400">* 0.003 (Compounding Revenue Elasticity)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Marketing Boost</td>
                    <td className="p-3">0% to 100%</td>
                    <td className="p-3 text-cyan-400">* 0.004 (Direct Customer Inflow)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Product Innovation</td>
                    <td className="p-3">0% to 100%</td>
                    <td className="p-3 text-cyan-400">* 0.005 (Organic User Conversion)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Op. Efficiency</td>
                    <td className="p-3">-20% to +20%</td>
                    <td className="p-3 text-cyan-400">* 0.005 (Internal Resource Optimization)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Support Capacity</td>
                    <td className="p-3">-50% to +50%</td>
                    <td className="p-3 text-cyan-400">* 0.002 (Churn Mitigation Factor)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Competition Threat</td>
                    <td className="p-3">0% to 100%</td>
                    <td className="p-3 text-red-400">-0.003 (Market Contraction Penalty)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="document-ingestion" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <UploadCloud size={18} className="text-brand-primary" />
              4. DOCUMENT INGESTION PIPELINE
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              Unstructured files staged through the upload deck undergo character mapping, layout-preserving extraction, and recursive text splitting (chunk size: 800, chunk overlap: 100).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-center">
                <span className="text-[10px] font-mono text-blue-400 font-bold block">⟳ READY</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Awaiting Pipeline</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-center">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">⚡ INDEXING</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Vector DB Processing</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-center">
                <span className="text-[10px] font-mono text-green-400 font-bold block">✓ INDEXED</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Stored in Qdrant</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-center">
                <span className="text-[10px] font-mono text-red-400 font-bold block">✗ FAILED</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Index Error Alert</span>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="billing-tiers" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <CreditCard size={18} className="text-slate-400" />
              5. BILLING & SUBSCRIPTION TIERS
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              We enforce tier-based ingestion limits to protect infrastructure memory pools:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="border border-slate-900 bg-slate-950/80 p-5 rounded-xl space-y-2">
                <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">Free Tier</p>
                <h4 className="text-2xl font-black text-white">$0/mo</h4>
                <p className="text-[11px] text-slate-400 font-mono">Limit: <strong>5 Files</strong></p>
                <p className="text-[10px] text-slate-500 leading-normal">Basic search queries, shared execution matrix.</p>
              </div>
              <div className="border border-brand-primary/50 bg-slate-950/80 p-5 rounded-xl space-y-2 ring-1 ring-brand-primary/30">
                <p className="text-[10px] font-mono text-brand-primary font-bold uppercase tracking-widest">Pro Plan</p>
                <h4 className="text-2xl font-black text-white">$29/mo</h4>
                <p className="text-[11px] text-slate-400 font-mono">Limit: <strong>50 Files</strong></p>
                <p className="text-[10px] text-slate-500 leading-normal">Dedicated Qdrant space collections, priority response SLA.</p>
              </div>
              <div className="border border-slate-900 bg-slate-950/80 p-5 rounded-xl space-y-2">
                <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">Enterprise</p>
                <h4 className="text-2xl font-black text-white">$149/mo</h4>
                <p className="text-[11px] text-slate-400 font-mono">Limit: <strong>1000 Files</strong></p>
                <p className="text-[10px] text-slate-500 leading-normal">On-premise hybrid cloud deployments, custom training loops.</p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default Docs;
