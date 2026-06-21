import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ShieldCheck, Activity, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFatalError, setIsFatalError] = useState(false); // For expired links
  const [successMsg, setSuccessMsg] = useState('');

  // Password criteria states
  const [criteria, setCriteria] = useState({
    length: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (!token) {
      setIsFatalError(true);
      setErrorMsg("This security reset link is missing or malformed.");
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [token, navigate]);

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    
    // Dynamically update criteria checks
    setCriteria({
      length: val.length >= 8,
      number: /\d/.test(val),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(val)
    });
    
    setErrorMsg('');
  };

  const isPasswordValid = criteria.length && criteria.number && criteria.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await axios.post('http://127.0.0.1:8000/api/v1/auth/reset-password', {
        token,
        new_password: password
      });
      
      setSuccessMsg("Password successfully reset! Redirecting to login...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setIsFatalError(true);
      setErrorMsg(err.response?.data?.detail || "This security reset link has expired or is invalid.");
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-main text-white font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0F19] via-[#0D1527] to-[#0B0F19] -z-10" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 sm:p-10 bg-surface border border-gray-800 rounded-2xl shadow-2xl animate-fade-in">
        
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-black shadow-[0_0_24px_rgba(129,140,248,0.25)]">
            <Lock size={24} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Secure Password</h2>
          <p className="text-xs text-brand-muted mt-2 leading-relaxed">
            Please enter a new password for your enterprise identity channel.
          </p>
        </div>

        {errorMsg && (
          <div className={`flex items-start gap-2 text-[11px] font-bold px-4 py-3 rounded-xl mb-6 animate-fade-in ${
            isFatalError 
              ? 'text-red-300 bg-red-900/30 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
              : 'text-orange-300 bg-orange-900/30 border border-orange-500/30'
          }`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg} {isFatalError && " Redirecting..."}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300 bg-emerald-900/30 border border-emerald-500/30 px-4 py-3 rounded-xl mb-6 animate-fade-in">
            <ShieldCheck size={16} /> {successMsg}
          </div>
        )}

        {/* Hide form if token is fatally invalid */}
        {!isFatalError && !successMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-4">
              {/* New Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  className="w-full rounded-xl border border-gray-800 bg-[#0B0F19] px-4 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Dynamic Validation Checklist */}
              <div className="bg-[#0B0F19] border border-gray-800/60 rounded-xl p-4 space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 font-mono">Security Requirements</p>
                
                <div className="flex items-center gap-2.5 transition-colors duration-300">
                  <CheckCircle2 size={14} className={criteria.length ? "text-emerald-400" : "text-gray-700"} />
                  <span className={`text-xs font-medium ${criteria.length ? "text-emerald-400" : "text-gray-500"}`}>
                    At least 8 characters
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5 transition-colors duration-300">
                  <CheckCircle2 size={14} className={criteria.number ? "text-emerald-400" : "text-gray-700"} />
                  <span className={`text-xs font-medium ${criteria.number ? "text-emerald-400" : "text-gray-500"}`}>
                    Contains at least 1 number
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5 transition-colors duration-300">
                  <CheckCircle2 size={14} className={criteria.special ? "text-emerald-400" : "text-gray-700"} />
                  <span className={`text-xs font-medium ${criteria.special ? "text-emerald-400" : "text-gray-500"}`}>
                    Contains at least 1 special character
                  </span>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Confirm New Password"
                  className="w-full rounded-xl border border-gray-800 bg-[#0B0F19] px-4 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !confirmPassword}
              className="w-full rounded-xl bg-brand-primary px-4 py-3.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(129,140,248,0.2)] transition-all hover:bg-indigo-400 active:scale-[0.99] mt-6 flex items-center justify-center h-12 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm bg-black"></span>
              ) : (
                "Update Password"
              )}
            </button>

          </form>
        )}

      </div>
      
    </div>
  );
}
