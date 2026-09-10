import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, UserCheck, ArrowRight, CheckCircle2, KeyRound, Send, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculatePasswordStrength } from '../utils/crypto';
import { authApi } from '../utils/api';
import Swal from 'sweetalert2';

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = calculatePasswordStrength(password);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateEmailFormat = (emailVal) => {
    const trimmed = emailVal.trim();
    if (!trimmed) return 'Email Address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
    return null;
  };

  const validate = () => {
    const errors = {};
    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      errors.fullName = 'Full Name is required';
    } else if (/\d/.test(trimmedFullName)) {
      errors.fullName = 'Numbers are not allowed.';
    } else if (/[^A-Za-z.\s]/.test(trimmedFullName)) {
      errors.fullName = 'Special characters and symbols are not allowed.';
    } else if (trimmedFullName.length < 3 || trimmedFullName.length > 100) {
      errors.fullName = 'Full Name must be between 3 and 100 characters';
    } else {
      const fullNameRegex = /^(?:[A-Z]\.(?=[A-Z])|[A-Z]\. ?|[A-Z][a-z]+ |\b[A-Z] )+(?:[A-Z][a-z]+)$/;
      if (!fullNameRegex.test(trimmedFullName)) {
        if (!trimmedFullName.includes(' ') && !trimmedFullName.includes('.')) {
          errors.fullName = 'Please enter your full name (e.g. Rabindra Dakua, G.Pooja)';
        } else if (/\b[a-z]/.test(trimmedFullName) || /(?:^|\.|\s)[a-z]/.test(trimmedFullName)) {
          errors.fullName = 'Each word must start with a Capital letter (e.g. Rabindra Dakua, G.Pooja)';
        } else {
          errors.fullName = 'Invalid format. Only capitalized full names allowed (e.g. Rabindra Dakua, G.Pooja, P Rajesh Rao Dora)';
        }
      }
    }

    if (!trimmedUsername) {
      errors.username = 'Username is required';
    } else if (/^\d+$/.test(trimmedUsername)) {
      errors.username = 'Username must include letters after numbers (e.g. 09Rabindra)';
    } else if (/^[A-Za-z]+$/.test(trimmedUsername)) {
      errors.username = 'Username must start with numbers (e.g. 09Rabindra)';
    } else if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    } else {
      const usernameRegex = /^\d+[A-Za-z]+$/;
      if (!usernameRegex.test(trimmedUsername)) {
        errors.username = 'Username format not allowed. Must start with numbers followed by name (e.g. 09Rabindra)';
      }
    }

    const emailErr = validateEmailFormat(trimmedEmail);
    if (emailErr) {
      errors.email = emailErr;
    } else if (!isEmailVerified) {
      errors.email = 'Email address must be verified with OTP before registering';
    }

    if (!password) {
      errors.password = 'Master password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (strength.score < 40) {
      errors.password = 'Master password is too weak for vault security';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm Master Password is required';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFullNameChange = (val) => {
    setFullName(val);
    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
  };

  const handleUsernameChange = (val) => {
    setUsername(val);
    if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }));
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
    if (isEmailVerified) {
      setIsEmailVerified(false);
    }
    if (otpSent) {
      setOtpSent(false);
      setOtp('');
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
  };

  // Trigger Send OTP
  const handleSendOtp = async () => {
    setError('');
    const emailErr = validateEmailFormat(email);
    if (emailErr) {
      setFieldErrors((prev) => ({ ...prev, email: emailErr }));
      return;
    }

    setSendingOtp(true);
    try {
      await authApi.sendOtp(email.trim());
      setOtpSent(true);
      setTimer(60);
      setOtp('');

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'OTP Code Generated!',
        text: `A 6-digit OTP has been sent to ${email.trim()}. Check your inbox or use fallback test code 123456 to verify.`,
        showConfirmButton: false,
        timer: 8000,
        timerProgressBar: true,
        background: '#0f172a',
        color: '#f1f5f9',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      setOtpSent(false);
    } finally {
      setSendingOtp(false);
    }
  };

  // Trigger Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.trim().length !== 6) {
      setFieldErrors((prev) => ({ ...prev, otp: 'Please enter a valid 6-digit OTP code' }));
      return;
    }

    setVerifyingOtp(true);
    try {
      await authApi.verifyOtp(email.trim(), otp.trim());
      setIsEmailVerified(true);
      setFieldErrors((prev) => ({ ...prev, otp: '', email: '' }));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Email Verified!',
        text: 'You can now complete registration.',
        showConfirmButton: false,
        timer: 3000,
        background: '#0f172a',
        color: '#f1f5f9',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFieldErrors((prev) => ({ ...prev, otp: msg }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      await register(fullName.trim(), username.trim(), email.trim(), password);

      await Swal.fire({
        title: 'Registration Successful!',
        html: `<p style="color:#94a3b8;font-size:14px;margin-top:4px">Welcome, <strong style="color:#818cf8">${fullName.trim()}</strong>!<br/>Your secure vault has been initialized.<br/>Please sign in to continue.</p>`,
        icon: 'success',
        iconColor: '#6366f1',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonText: 'Go to Login &nbsp;→',
        confirmButtonColor: '#6366f1',
        timer: 50000,
        timerProgressBar: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
          popup: 'swal-vault-popup',
          title: 'swal-vault-title',
          confirmButton: 'swal-vault-btn',
        },
      });

      onSwitchToLogin();
    } catch (err) {
      let msg = err instanceof Error ? err.message : String(err);
      msg = msg.replace(/^Error:\s*/i, '');
      if (msg.toLowerCase().includes('username')) {
        const displayMsg = (msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('exist'))
          ? 'Username already exists!'
          : msg;
        setFieldErrors((prev) => ({ ...prev, username: displayMsg }));
        setError('');
      } else if (msg.toLowerCase().includes('email')) {
        const displayMsg = (msg.toLowerCase().includes('use') || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('exist'))
          ? 'Email address already exists!'
          : msg;
        setFieldErrors((prev) => ({ ...prev, email: displayMsg }));
        setError('');
      } else {
        setError(msg || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent py-8">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-6 select-none">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/25 mb-3 border border-white/10">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">PASSWORD</span>
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">VAULT</span>
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1.5 tracking-wider uppercase">Create Zero-Knowledge Vault Account</p>
        </div>

        {/* Register Card */}
        <div className="glass-panel p-6 md:p-8 shadow-premium border-slate-800/80">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            
            {/* ROW 1: Full Name & Username Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <UserCheck className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.fullName ? 'text-amber-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="Rabindra Dakua"
                    className={`glass-input pl-11 text-xs transition-all duration-200 ${fieldErrors.fullName ? 'border-amber-500/70 focus:border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative flex items-center">
                  <User className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.username ? 'text-amber-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="09Rabindra"
                    className={`glass-input pl-11 text-xs transition-all duration-200 ${fieldErrors.username ? 'border-amber-500/70 focus:border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            </div>

            {/* ROW 2: Email Address with Send OTP Button */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                {isEmailVerified && (
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1 normal-case bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" /> Email Verified
                  </span>
                )}
              </label>
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.email ? 'text-amber-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    required
                    disabled={isEmailVerified}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="alex@gmail.com"
                    className={`glass-input pl-11 text-xs transition-all duration-200 ${isEmailVerified ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200' : fieldErrors.email ? 'border-amber-500/70 focus:border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                  />
                </div>

                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || timer > 0}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition-all duration-200 shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    {sendingOtp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {sendingOtp
                        ? 'Sending...'
                        : timer > 0
                        ? `Resend (${timer}s)`
                        : otpSent
                        ? 'Resend OTP'
                        : 'Send OTP'}
                    </span>
                  </button>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* ROW 3: OTP Box (shown when OTP is sent and email is not yet verified) */}
            {otpSent && !isEmailVerified && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 shadow-inner flex flex-col gap-2.5 animate__animated animate__fadeIn">
                <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Enter 6-Digit Email OTP</span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">Check your inbox for code</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 flex items-center">
                    <KeyRound className="w-4 h-4 absolute left-3.5 text-indigo-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
                      }}
                      placeholder="e.g. 123456"
                      className="glass-input pl-11 tracking-widest font-mono text-indigo-200 text-sm border-indigo-500/40 focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all duration-200 shrink-0 flex items-center gap-1 shadow-md shadow-emerald-600/20"
                  >
                    {verifyingOtp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{verifyingOtp ? 'Verifying...' : 'Verify OTP'}</span>
                  </button>
                </div>
                {fieldErrors.otp && (
                  <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    {fieldErrors.otp}
                  </p>
                )}
              </div>
            )}

            {/* ROW 4: Master Password & Confirm Master Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative flex items-center">
                <Lock className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.password ? 'text-amber-400' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••••••••••"
                  className={`glass-input font-mono pl-11 pr-11 text-xs transition-all duration-200 ${fieldErrors.password ? 'border-amber-500/70 focus:border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {fieldErrors.password}
                </p>
              )}

              {/* Strength Meter */}
              {password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-slate-800/50 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tracking-wide uppercase shrink-0" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Master Password
              </label>
              <div className="relative flex items-center">
                <CheckCircle2 className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.confirmPassword ? 'text-amber-400' : 'text-slate-400'}`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="••••••••••••••••"
                  className={`glass-input font-mono pl-11 pr-11 text-xs transition-all duration-200 ${fieldErrors.confirmPassword ? 'border-amber-500/70 focus:border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                  title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 text-xs md:text-sm mt-3 w-full shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <span>{loading ? 'Initializing Vault Security...' : 'Initialize Vault'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Already have a vault?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
