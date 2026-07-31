import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Shield, KeyRound, Mail, User, ArrowRight, Sparkles, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, handleRedirectResult } from '../firebase';

/**
 * @description Enterprise Standalone Registration with Native OTP Verification State
 */
const Register = () => {
  const navigate = useNavigate();
  // ─── CORE STATES ───
  const [isSignupStep, setIsSignupStep] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg(''); // Clear error on typing
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  /**
   * Step 1: Handle Initial Form Submit (Moves to OTP Screen)
   */
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setErrorMsg('Invalid email format. Please provide a valid corporate email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.post('/auth/signup', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      setIsSignupStep(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Handle OTP Verification Code Submit
   */
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await api.post('/auth/verify-otp', {
        email: formData.email,
        otp_code: verificationCode,
        purpose: 'registration'
      });
      alert('Identity verified successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
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

        alert(`✨ Welcome, ${userName}! Account creation and verification successful.`);
        navigate("/app/dashboard");
        window.location.reload();
      } else {
        console.error("❌ Backend OAuth Verification Rejection:", data);
        setError(data.detail || "Registration failed via Google");
      }
    } catch (err) {
      console.error("🔴 Full-stack auth network pipeline collapse:", err);
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
        setError(result.error || "Google Signup Failed");
      }
    } catch (err) {
      console.error("🔴 Full-stack auth network pipeline collapse:", err);
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
          setError(result.error || "Google Signup Failed");
        }
      } catch (err) {
        console.error("Redirect handling error:", err);
      } finally {
        setIsGoogleLoading(false);
      }
    };
    handleRedirect();
  }, [navigate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans select-none">

      {/* ─── LEFT PANEL: BRAND BANNER ─── */}
      <div className="hidden w-[45%] flex-col justify-between border-r border-gray-800/40 bg-[#0B0F19]/40 p-12 lg:flex relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <img
            src="https://i.ibb.co.com/MD7vS43Z/Screenshot-2026-07-12-111127.png"
            alt="InsightAgent Logo"
            className="w-9 h-9 object-cover rounded-xl border border-slate-850 shadow-md transform hover:scale-105 transition-transform duration-200"
            crossOrigin="anonymous"
          />
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">InsightAgent</h1>
            <p className="text-[9px] uppercase tracking-widest text-brand-primary font-bold -mt-0.5 font-mono">Enterprise AI Engine</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 max-w-sm my-auto">
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
            <Sparkles size={10} /> {isSignupStep ? "Private Node Initialization" : "Identity Verification"}
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            {isSignupStep
              ? "Initialize your secure enterprise data node."
              : "Verify your corporate identity channel."
            }
          </h2>
          <p className="text-xs text-brand-muted leading-relaxed font-medium">
            Deploy secure, private RAG agents that integrate flawlessly with your corporate postgres lakes and file systems.
          </p>
        </div>

        <div className="text-[10px] text-gray-600 font-mono relative z-10 flex items-center gap-2">
          <Shield size={12} className="text-brand-primary/40" /> SOC2 Type II Certified Infrastructure
        </div>
      </div>

      {/* ─── RIGHT PANEL: DYNAMIC RECEPTOR (SIGNUP vs Verification) ─── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent px-6 relative">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">

          {errorMsg && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg animate-fade-in">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {isSignupStep ? (
            /* ─── STEP A: SIGNUP INPUT MODULE ─── */
            <>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">Create Enterprise Account</h3>
                <p className="text-xs text-brand-muted font-medium">Register your corporate credentials below.</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="firstName" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">First Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Alex"
                        className="w-full rounded-xl border border-gray-800 bg-surface pl-9 pr-3 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">Last Name</label>
                    <div className="relative flex items-center">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Rivera"
                        className="w-full rounded-xl border border-gray-800 bg-surface px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                      />
                    </div>
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
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-gray-800 bg-surface pl-10 pr-10 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary/80 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-gray-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      Send Verification Code <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-gray-505 text-slate-500 font-mono uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-gray-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full rounded-xl border border-gray-800 hover:border-gray-705 bg-[#0F1423] hover:bg-[#161B2D] px-4 py-3 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 h-11 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <>
                      <svg className="animate-spin duration-1000 ease-in-out h-4 w-4 text-white" xmlns="http://www.w3.org/2050/svg" fill="none" viewBox="0 0 24 24">
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

                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-gray-850/40"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-mono uppercase tracking-wider">Hiring Manager Access</span>
                  <div className="flex-grow border-t border-gray-850/40"></div>
                </div>

                <div className="flex flex-col gap-2.5 items-center justify-center p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-sm animate-pulse-subtle">
                  <span className="text-[11px] text-cyan-300 font-medium text-center">
                    👉 Reviewing as Hiring Manager? Click to test with Demo Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full text-center text-xs font-bold py-3 px-4 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-sans"
                  >
                    ⚡ Explore as Guest
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 justify-center text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl mt-3 animate-fade-in transition-all">
                    <AlertCircle size={15} className="shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
              </form>

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
            </>
          ) : (

            <>
              <div className="space-y-2 animate-fade-in">
                <h3 className="text-2xl font-bold tracking-tight text-white">Check your email</h3>
                <p className="text-xs text-brand-muted font-medium leading-relaxed">
                  We sent a secure 6-digit confirmation code to <strong className="text-white font-mono">{formData.email}</strong>. Enter it below to unlock your workspace.
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label htmlFor="verificationCode" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted font-mono">Verification Code</label>
                  <div className="relative flex items-center">
                    <ShieldCheck className="absolute left-3.5 h-3.5 w-3.5 text-brand-primary pointer-events-none" />
                    <input
                      id="verificationCode"
                      type="text"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-[12px] text-sm font-bold rounded-xl border border-brand-primary/40 bg-surface px-4 py-3 text-white outline-none font-mono focus:border-brand-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="btn w-full bg-brand-primary text-black font-bold text-xs h-11 rounded-xl mt-6 hover:bg-indigo-400 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : (
                    "Verify & Proceed to Login"
                  )}
                </button>
              </form>

              <div className="text-center text-xs font-medium border-t border-gray-850/40 pt-4 flex justify-between items-center px-1">
                <button
                  type="button"
                  onClick={() => setIsSignupStep(true)}
                  className="text-gray-500 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
                >
                  ← Edit Credentials
                </button>
                <button
                  type="button"
                  className="text-brand-primary hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
                  onClick={async () => {
                    try {
                      await api.post('/auth/signup', {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        email: formData.email,
                        password: formData.password
                      });
                      alert("OTP Code resent successfully!");
                    } catch (e) { }
                  }}
                >
                  Resend Code
                </button>
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
};

export default Register;