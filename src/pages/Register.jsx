import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, KeyRound, Mail, User, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * @description Enterprise Standalone Registration with Native OTP Verification State
 */
const Register = () => {
  const navigate = useNavigate();
  // ─── CORE STATES ───
  const [isSignupStep, setIsSignupStep] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      await axios.post('http://127.0.0.1:8000/api/v1/auth/signup', {
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
      await axios.post('http://127.0.0.1:8000/api/v1/auth/verify-otp', {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-white font-sans select-none">
      
      {/* ─── LEFT PANEL: BRAND BANNER ─── */}
      <div className="hidden w-[45%] flex-col justify-between border-r border-gray-800/40 bg-[#0B0F19]/40 p-12 lg:flex relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-primary text-black font-black text-sm">I</div>
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
                      Send Verification Code <ArrowRight size={14} />
                    </>
                  )}
                </button>
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
                      await axios.post('http://127.0.0.1:8000/api/v1/auth/signup', {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        email: formData.email,
                        password: formData.password
                      });
                      alert("OTP Code resent successfully!");
                    } catch(e) {}
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