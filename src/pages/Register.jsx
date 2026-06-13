import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Mail, User, ArrowRight, Sparkles } from 'lucide-react';

/**
 * @description Enterprise Standalone Registration (Sign Up) Component
 * Architecture: Isolated data ingress for scaling client profile pipelines.
 */
const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Dynamic Network Ingress Latency Simulation
    setTimeout(() => {
     
      localStorage.setItem('token', 'mock_enterprise_jwt_token_string');
      localStorage.setItem('user_role', 'user'); 
      
      setLoading(false);
      navigate('/app/dashboard');
    }, 1000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans select-none">
      
      {/* ─── LEFT PANEL: PLATFORM BOUNDARY BANNER ─── */}
      <div className="hidden w-[45%] flex-col justify-between border-r border-gray-800/40 bg-[#0B0F19]/40 p-12 lg:flex relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-primary text-black font-black text-sm shadow-[0_0_15px_rgba(129,140,248,0.2)]">I</div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">InsightAgent</h1>
            <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold -mt-0.5 font-mono">Enterprise AI Engine</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 max-w-sm my-auto">
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
            <Sparkles size={10} /> Private Node Initialization
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            Initialize your secure enterprise data node.
          </h2>
          <p className="text-xs text-brand-muted leading-relaxed font-medium">
            Deploy secure, private RAG agents that integrate flawlessly with your corporate postgres lakes and file systems.
          </p>
        </div>

        <div className="text-[10px] text-gray-600 font-mono relative z-10 flex items-center gap-2">
          <Shield size={12} className="text-brand-primary/40" /> SOC2 Type II Certified Infrastructure
        </div>
      </div>

      {/* ─── RIGHT PANEL: REGISTRATION FORM CANVAS ─── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent px-6 relative">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">Create Enterprise Account</h3>
            <p className="text-xs text-brand-muted font-medium">Register your corporate credentials below.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Alex Rivera"
                  className="w-full rounded-xl border border-gray-800 bg-surface pl-10 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">Corporate Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-gray-800 bg-surface pl-10 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">Password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-gray-800 bg-surface pl-10 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-full bg-brand-primary text-black font-bold text-xs h-11 rounded-xl mt-6 hover:bg-indigo-400 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  Create Account Engine <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Link back to login */}
          <div className="text-center text-xs font-medium border-t border-gray-850/40 pt-4">
            <span className="text-brand-muted">Already have an enterprise node? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-brand-primary hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
            >
              Sign in instead
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Register;