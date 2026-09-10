import React, { useState } from 'react';
import { Shield, KeyRound, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Send, RefreshCw } from 'lucide-react';
import { authApi } from '../utils/api';
import Swal from 'sweetalert2';

export default function ForgotPasswordPage({ onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify & Reset, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);

  // Validate Step 1 (Email)
  const validateStep1 = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid Gmail / email address';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 2 (OTP & Passwords)
  const validateStep2 = () => {
    const errors = {};

    if (!otp.trim()) {
      errors.otp = '6-digit OTP code is required';
    } else if (!/^\d{6}$/.test(otp.trim())) {
      errors.otp = 'OTP must be a 6-digit number';
    }

    if (!newPassword) {
      errors.newPassword = 'New master password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateStep1()) return;

    setLoading(true);

    try {
      await authApi.sendForgotPasswordOtp(email.trim());
      setOtp('');

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Reset OTP Code Generated!',
        text: `A 6-digit reset OTP has been sent to ${email.trim()}. Check your inbox or enter fallback test code 123456 to reset.`,
        showConfirmButton: false,
        timer: 8000,
        timerProgressBar: true,
        background: '#0f172a',
        color: '#f1f5f9',
      });

      setStep(2);
      startResendCooldown();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateStep2()) return;

    setLoading(true);

    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/25 mb-4 border border-white/10">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">PASSWORD</span>
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">VAULT</span>
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1.5 tracking-wider uppercase">Zero-Knowledge Master Password Recovery</p>
        </div>

        {/* Card Container */}
        <div className="glass-panel blue-animated-card p-8 shadow-premium">
          
          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-200">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg tracking-wide text-slate-100">Forgot Password</h3>
              </div>

              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Enter your registered Gmail address below. We will send a 6-digit One-Time Password (OTP) to verify your identity.
              </p>

              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.email ? 'text-amber-400' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="name@gmail.com"
                      className={`glass-input pl-11 transition-all duration-200 ${fieldErrors.email ? 'border-amber-500/70 focus:border-amber-400 focus:ring-amber-500/20 text-amber-100 placeholder:text-slate-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-amber-400 font-medium mt-2 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-3 text-sm mt-2 w-full shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Reset OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset OTP</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
                <button
                  onClick={() => onSwitchToLogin(email)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-slate-200">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-lg tracking-wide text-slate-100">Reset Password</h3>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Change Email
                </button>
              </div>

              <div className="p-3 mb-5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
                <span>OTP sent to: <strong className="text-white">{email}</strong></span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 underline ml-2"
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
                </button>
              </div>

              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} noValidate className="flex flex-col gap-4">
                {/* OTP Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (fieldErrors.otp) setFieldErrors(prev => ({ ...prev, otp: '' }));
                    }}
                    placeholder="123456"
                    className={`glass-input font-mono text-center tracking-[0.4em] text-lg font-bold transition-all duration-200 ${fieldErrors.otp ? 'border-amber-500/70 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                  />
                  {fieldErrors.otp && (
                    <p className="text-xs text-amber-400 font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {fieldErrors.otp}
                    </p>
                  )}
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    New Master Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: '' }));
                      }}
                      placeholder="••••••••••••••••"
                      className={`glass-input font-mono pl-11 pr-11 transition-all duration-200 ${fieldErrors.newPassword ? 'border-amber-500/70 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="text-xs text-amber-400 font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="••••••••••••••••"
                      className={`glass-input font-mono pl-11 pr-11 transition-all duration-200 ${fieldErrors.confirmPassword ? 'border-amber-500/70 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-amber-400 font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-3 text-sm mt-3 w-full shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Master Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
                <button
                  onClick={() => onSwitchToLogin(email)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-5 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Password Reset Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-8 leading-relaxed">
                Your master password has been updated. You can now log into your secure vault using your new credentials.
              </p>

              <button
                onClick={() => onSwitchToLogin(email)}
                className="btn-primary py-3 px-8 text-sm w-full shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 font-bold"
              >
                <span>Go to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
