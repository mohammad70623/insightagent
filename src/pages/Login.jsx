import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Activity } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    
    setTimeout(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken');
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans">
      
      {/* LEFT PANEL: BRAND (60%) */}
      <div className="relative hidden w-[60%] flex-col justify-center p-12 bg-gradient-to-br from-[#0B0F19] via-[#0D1527] to-[#0B0F19] lg:flex border-r border-gray-800/30">
        
        {/* Radial Grid BG */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* TOP COMPONENT */}
        <div className="absolute top-12 left-12 z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-[0_0_24px_rgba(129,140,248,0.25)]">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">InsightAgent</h1>
            <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold mt-1">Enterprise AI</p>
          </div>
        </div>

        {/* CENTER COMPONENT */}
        <div className="relative z-10 w-full max-w-md mx-auto text-left space-y-8 mt-6">
          
          {/* Centered Mathematical Orbit Art */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-dashed border-gray-800/60">
            <div className="absolute h-40 w-40 rounded-full border border-gray-800/80 animate-[spin_30s_linear_infinite]" />
            <div className="absolute h-44 w-28 rounded-full border border-brand-primary/20 rotate-45 animate-[spin_25s_linear_infinite]" />
            <div className="absolute h-28 w-44 rounded-full border border-indigo-500/10 -rotate-45" />
            
            {/* Center Core Node */}
            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-gray-800/80 shadow-2xl">
              <Activity size={26} className="text-brand-primary animate-pulse" />
            </div>

            {/* Orbiting Nodes */}
            <div className="absolute top-3 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-primary shadow-[0_0_12px_#818CF8]" />
            <div className="absolute bottom-8 right-5 h-2 w-2 rounded-full bg-indigo-400/80" />
          </div>

          {/* Typography Content Group */}
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight leading-tight text-white">
              Enterprise-grade AI intelligence.
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed font-normal">
              Unlock predictive analytics and autonomous data workflows in a secure, high-performance environment.
            </p>
          </div>

          {/* Trust badges + copyright (center) */}
          <div className="space-y-6 border-t border-b border-gray-900/60 py-5">
            <div className="flex items-center gap-16">
              <div>
                <p className="font-mono text-lg font-bold text-white tracking-tight">99.9%</p>
                <p className="text-brand-muted text-[11px] font-medium mt-0.5">Uptime SLA</p>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-brand-primary/90" />
                <div>
                  <p className="text-xs font-bold text-white tracking-wide">ISO 27001</p>
                  <p className="text-brand-muted text-[11px] font-medium mt-0.5">Certified Security</p>
                </div>
              </div>
            </div>

            {/* Copyright Statement */}
            <p className="text-[10px] text-gray-600 font-bold tracking-wide pt-1">
              © 2026 InsightAgent AI Corp. All rights reserved.
            </p>
          </div>

        </div>
      </div>

      {/*  RIGHT PANEL:  (40% Width) */}
      <div className="relative flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:w-[40%] lg:flex-none bg-main">
        
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h3>
            <p className="text-xs text-brand-muted mt-1.5">Enter your credentials to access the dashboard</p>
          </div>

          <button 
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-800/80 bg-transparent px-4 py-2.5 text-xs font-semibold text-white tracking-wide transition-all hover:bg-gray-900/40 active:scale-[0.99] cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.06 6.94 8.78 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.5 12.25c0-.82-.07-1.6-.2-2.25H12v4.5h6.48c-.28 1.44-1.1 2.67-2.33 3.5l3.6 2.8c2.1-1.94 3.75-4.8 3.75-8.55z"/>
              <path fill="#FBBC05" d="M5.1 14.7c-.25-.76-.4-1.57-.4-2.4s.15-1.64.4-2.4L1.5 7.1C.55 9.04 0 11.17 0 13.4s.55 4.36 1.5 6.3l3.6-2.8z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.9l-3.6-2.8c-1.1.74-2.5 1.18-4.36 1.18-3.22 0-5.94-1.9-6.92-4.46l-3.6 2.8C3.4 20.35 7.35 23 12 23z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-gray-850 bg-gray-800/40"></div>
            <span className="absolute bg-main px-3 font-mono text-[9px] uppercase tracking-widest text-gray-600 font-bold">Or Email</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full rounded-lg border border-gray-800 bg-transparent px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-gray-800 bg-transparent px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-brand-muted select-none font-medium">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-xs border-gray-700 rounded bg-transparent checked:bg-brand-primary [--chkbg:var(--color-brand-primary)] [--chkfg:black]" 
                />
                Remember for 30 days
              </label>
              <a href="#forgot-password" className="font-semibold text-brand-primary hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-black shadow-xl shadow-indigo-500/5 transition-all hover:bg-indigo-400 active:scale-[0.99] mt-2 flex items-center justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs bg-black"></span>
              ) : (
                "Sign In to Agent"
              )}
            </button>
          </form>

         <div className="text-center text-xs font-medium border-t border-gray-850/40 pt-4">
  <span className="text-brand-muted">Don't have an account? </span>
  <button
    type="button"
    onClick={() => navigate('/register')} 
    className="text-brand-primary hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
  >
    Request Access
  </button>
</div>

          <div className="mt-16 flex justify-center gap-6 text-[10px] text-gray-600 border-t border-gray-900 pt-4 font-semibold">
            <a href="#support" className="hover:text-gray-400 transition-colors">Support</a>
            <a href="#terms" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
          </div>

        </div>
      </div>

    </div>
  );
}