import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';
import { signInWithGoogle, handleRedirectResult } from '../firebase';

export default function Login() {
  const navigate = useNavigate();

  
  // States: 'login', 'otp', 'forgot'
  const [authMode, setAuthMode] = useState('login');
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Modals and Alerts States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportAlert, setShowSupportAlert] = useState(false);
  const [flashVerifyButton, setFlashVerifyButton] = useState(false);

  const handleSupportClick = (e) => {
    e.preventDefault();
    setShowSupportAlert(true);
  };

  const handleSupportGotIt = () => {
    setShowSupportAlert(false);
    setFlashVerifyButton(true);
    setTimeout(() => {
      setFlashVerifyButton(false);
    }, 2000);
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (!validateEmail(email)) {
      setErrorMsg('Invalid email format. Please provide a valid corporate email.');
      return;
    }

    setIsVerifyLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.status === 202 && response.data.status === 'otp_required') {
        setAuthMode('otp');
      } else {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user_role', response.data.user.role);
        navigate('/app/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const processGoogleAuthToken = async (idToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_token: idToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("🍏 [Auth Debug] Full Backend Response Data:", data);

        const userName = data.user?.full_name || data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : '') || "User";
        const userRole = data.user?.role || "user";
        const userAvatar = data.user?.avatar || data.user?.avatar_url || data.user?.profile_picture || "";

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userEmail", data.user?.email || "");
        localStorage.setItem("userName", userName);
        localStorage.setItem("userAvatar", userAvatar);
        localStorage.setItem("userRole", userRole);

        alert(`✨ Welcome back, ${userName}! Full-Stack Authentication Verified.`);
        navigate("/app/dashboard");
        window.location.reload(); 
      } else {
        console.error("❌ Backend OAuth Verification Rejection:", data);
        alert(`❌ Backend Registration Failed: ${data.detail || "Authentication error"}`);
        setError(data.detail || "Authentication error");
      }
    } catch (err) {
      console.error("🔴 Full-stack auth network pipeline collapse:", err);
      alert("❌ Server connection lost. Please ensure your FastAPI server is active.");
      setError("Server connection lost. Please ensure your FastAPI server is active.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        if (result.redirecting) {
          return;
        }
        console.log("🔥 Firebase authenticated successfully. Forwarding token to FastAPI...");
        await processGoogleAuthToken(result.token);
      } else {
        alert(`❌ Google Auth Popup Cancelled/Failed: ${result.error}`);
        setError(result.error || "Google Authentication Failed");
      }
    } catch (err) {
      console.error("🔴 Full-stack auth network pipeline collapse:", err);
      alert("❌ Server connection lost. Please ensure your FastAPI server is active.");
      setError("Server connection lost. Please ensure your FastAPI server is active.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  React.useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result && result.success) {
          setIsGoogleLoading(true);
          console.log("🔥 Firebase authenticated via redirect. Forwarding token to FastAPI...");
          await processGoogleAuthToken(result.token);
        } else if (result && !result.success) {
          setError(result.error || "Google Authentication Failed");
        }
      } catch (err) {
        console.error("Redirect handling error:", err);
      } finally {
        setIsGoogleLoading(false);
      }
    };
    handleRedirect();
  }, [navigate]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsVerifyLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/auth/verify-otp', {
        email: email,
        otp_code: verificationCode,
        purpose: 'login'
      });
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_role', response.data.user.role);
      navigate('/app/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMsg('Invalid email format. Please provide a valid corporate email.');
      return;
    }

    setIsVerifyLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('If an account with that email exists, a password reset link has been dispatched.');
    } catch (err) {
      // Backend returns 200 regardless, so we shouldn't hit this often, but fallback:
      setSuccessMsg('If an account with that email exists, a password reset link has been dispatched.');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans">
      
      {/* LEFT PANEL: BRAND (60%) */}
      <div className="relative hidden w-[60%] flex-col justify-center p-12 bg-gradient-to-br from-[#0B0F19] via-[#0D1527] to-[#0B0F19] lg:flex border-r border-gray-800/30">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="absolute top-12 left-12 z-10 flex items-center gap-3">
          <img 
            src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png" 
            alt="InsightAgent Logo" 
            className="w-10 h-10 object-cover rounded-xl border border-slate-800 shadow-md"
            crossOrigin="anonymous"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">InsightAgent</h1>
            <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold mt-1">Enterprise AI</p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto text-left space-y-8 mt-6">
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-dashed border-gray-800/60">
            <div className="absolute h-40 w-40 rounded-full border border-gray-800/80 animate-[spin_30s_linear_infinite]" />
            <div className="absolute h-44 w-28 rounded-full border border-brand-primary/20 rotate-45 animate-[spin_25s_linear_infinite]" />
            <div className="absolute h-28 w-44 rounded-full border border-indigo-500/10 -rotate-45" />
            <img 
              src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png" 
              alt="InsightAgent Logo" 
              className="z-10 w-16 h-16 object-cover rounded-2xl border border-gray-800/80 shadow-2xl animate-pulse"
              crossOrigin="anonymous"
            />
            <div className="absolute top-3 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-primary shadow-[0_0_12px_#818CF8]" />
            <div className="absolute bottom-8 right-5 h-2 w-2 rounded-full bg-indigo-400/80" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight leading-tight text-white">
              Secure workspace for your business intelligence.
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed font-normal">
              Access your smart agents, search secure documents, and analyze team insights from a single dashboard.
            </p>
          </div>

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
            <p className="text-[10px] text-gray-600 font-bold tracking-wide pt-1">
              © 2026 InsightAgent AI Corp. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:w-[40%] lg:flex-none bg-main">
        <div className="mx-auto w-full max-w-sm">
          
          {errorMsg && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg mb-6 animate-fade-in">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg mb-6 animate-fade-in">
              <ShieldCheck size={14} /> {successMsg}
            </div>
          )}

          {authMode === 'login' && (
            <>
              <div className="mb-8">
                <h3 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h3>
                <p className="text-xs text-brand-muted mt-1.5">Enter your credentials to access the dashboard</p>
              </div>

              {/* Hiring Manager Demo Alert Banner */}
              <div className="p-3.5 mb-5 rounded-lg border border-cyan-500/20 bg-cyan-950/15 backdrop-blur-md animate-fade-in flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 text-sm">👉</span>
                  <div className="text-[11px] text-cyan-200 leading-normal font-medium">
                    Reviewing as Hiring Manager? Use Email: <code className="bg-cyan-900/30 px-1 py-0.5 rounded text-white border border-cyan-500/10 font-mono">demo@insightagent.com</code> | Password/OTP: <code className="bg-cyan-900/30 px-1 py-0.5 rounded text-white border border-cyan-500/10 font-mono">000000</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("demo@insightagent.com");
                    setPassword("000000");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="w-full text-center text-[10px] font-bold py-1 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded transition-all cursor-pointer font-sans"
                >
                  ⚡ Explore as Guest (Auto-Fill)
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">

                <div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                    placeholder="Corporate Email Address"
                    className="w-full rounded-lg border border-gray-800 bg-transparent px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
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
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="font-semibold text-brand-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyLoading}
                  className={`w-full rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-black shadow-xl shadow-indigo-500/5 transition-all hover:bg-indigo-400 active:scale-[0.99] mt-2 flex items-center justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${flashVerifyButton ? 'ring-4 ring-cyan-400 scale-[1.03] shadow-[0_0_25px_rgba(6,182,212,0.8)] animate-pulse' : ''}`}
                >
                  {isVerifyLoading ? (
                    <span className="loading loading-spinner loading-xs bg-black"></span>
                  ) : (
                    "Verify Identity"
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full rounded-lg border border-gray-800 hover:border-gray-700 bg-[#0F1423] hover:bg-[#161B2D] px-4 py-3 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 h-10 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <svg className="animate-spin duration-1000 ease-in-out h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting securely...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              {error && (
                <div className="flex items-center gap-2 justify-center text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg mt-3 animate-fade-in transition-all">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="text-center text-xs font-medium border-t border-gray-850/40 pt-4 mt-6">
                <span className="text-brand-muted">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => navigate('/register')} 
                  className="text-brand-primary hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
                >
                  Request Access
                </button>
              </div>
            </>
          )}

          {authMode === 'forgot' && (
            <>
              <div className="mb-8 animate-fade-in">
                <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="text-brand-primary" /> Password Recovery
                </h3>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Enter your corporate email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-gray-800 bg-transparent px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyLoading}
                  className="w-full rounded-lg bg-brand-primary px-4 py-3 text-xs font-bold text-black shadow-xl shadow-indigo-500/5 transition-all hover:bg-indigo-400 active:scale-[0.99] mt-2 flex items-center justify-center h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isVerifyLoading ? (
                    <span className="loading loading-spinner loading-xs bg-black"></span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="text-center text-xs font-medium pt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} 
                  className="text-gray-500 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer flex items-center gap-1.5 font-semibold"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </>
          )}

          {authMode === 'otp' && (
            <>
              <div className="mb-8 animate-fade-in">
                {/* Clean & Friendly Title Header */}
                <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-xl">🛡️</span> Enter verification code
                </h2>

                {/* Simple & Easy Subtext */}
                <p className="text-sm text-slate-400 font-normal mt-2 max-w-md leading-relaxed">
                  We sent a 6-digit code to <span className="text-slate-200 font-medium">{email}</span>. Enter it below to log in.
                </p>
              </div>

              {/* Hiring Manager Demo Alert Banner */}
              <div className="p-3.5 mb-5 rounded-lg border border-cyan-500/20 bg-cyan-950/15 backdrop-blur-md animate-fade-in flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 text-sm">👉</span>
                  <div className="text-[11px] text-cyan-200 leading-normal font-medium">
                    Reviewing as Hiring Manager? Enter OTP code: <code className="bg-cyan-900/30 px-1 py-0.5 rounded text-white border border-cyan-500/10 font-mono">000000</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationCode("000000");
                    setErrorMsg("");
                  }}
                  className="w-full text-center text-[10px] font-bold py-1 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded transition-all cursor-pointer font-sans"
                >
                  ⚡ Auto-fill Demo OTP
                </button>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4 animate-fade-in">

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '')); setErrorMsg(''); }}
                    placeholder="000000"
                    className="w-full text-center tracking-[16px] text-lg font-bold rounded-lg border border-brand-primary/50 bg-gray-900/50 px-4 py-4 text-white outline-none font-mono focus:border-brand-primary"
                  />
                </div>

                {/* Humanized & Direct Action Button */}
                <button
                  type="submit"
                  disabled={isVerifyLoading || verificationCode.length < 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                >
                  {isVerifyLoading ? (
                    <span className="loading loading-spinner loading-xs bg-white"></span>
                  ) : (
                    "Verify and Log In"
                  )}
                </button>
              </form>

              <div className="text-center text-xs font-medium border-t border-gray-850/40 pt-4 mt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')} 
                  className="text-gray-500 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
                >
                  ← Cancel
                </button>
                <button
                  type="button"
                  className="text-brand-primary hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
                  onClick={async () => {
                    try {
                      const formDataParams = new URLSearchParams();
                      formDataParams.append('username', email);
                      formDataParams.append('password', password);
                      await api.post('/auth/login', formDataParams);
                      alert("Code resent successfully!");
                    } catch(e) {}
                  }}
                >
                  Resend Code
                </button>
              </div>
            </>
          )}

          <div className="mt-16 flex justify-center gap-6 text-[10px] text-gray-600 border-t border-gray-900 pt-4 font-semibold">
            <button 
              type="button" 
              onClick={handleSupportClick} 
              className="hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[10px]"
            >
              Support
            </button>
            <button 
              type="button" 
              onClick={() => setShowTermsModal(true)} 
              className="hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[10px]"
            >
              Terms
            </button>
            <button 
              type="button" 
              onClick={() => setShowPrivacyModal(true)} 
              className="hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-[10px]"
            >
              Privacy
            </button>
          </div>

        </div>
      </div>

      {/* Support Alert Overlay Modal */}
      {showSupportAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <h4 className="text-xs font-bold uppercase tracking-widest font-mono">
                Authentication Required
              </h4>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed font-mono">
              To access the InsightAgent Enterprise Support and ticketing ecosystem, you must be securely signed into your account. Please complete your identity verification first.
            </p>
            <div className="pt-2">
              <button
                onClick={handleSupportGotIt}
                className="w-full rounded-lg bg-gradient-to-r from-brand-primary to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-extrabold text-xs py-2.5 px-4 cursor-pointer transition-all uppercase tracking-wider shadow-lg hover:shadow-cyan-500/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Policy Modals */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
      <TermsOfServiceModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
}