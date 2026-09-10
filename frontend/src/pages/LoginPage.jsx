import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function LoginPage({ onSwitchToRegister, onSwitchToForgotPassword, initialEmail = '' }) {
  const { login, completeLogin } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */({}));

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email Address or Username is required';
    } else if (trimmedEmail.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address';
      }
    } else {
      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (trimmedEmail.length < 3 || trimmedEmail.length > 50) {
        errors.email = 'Username must be between 3 and 50 characters';
      } else if (!usernameRegex.test(trimmedEmail)) {
        errors.email = 'Username must contain only letters, numbers, underscores, or dots';
      }
    }

    if (!password) {
      errors.password = 'Master password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      const authResult = await login(email.trim(), password);

      await Swal.fire({
        title: 'Login Successful!',
        html: `<p style="color:#94a3b8;font-size:14px;margin-top:4px">Welcome back, <strong style="color:#818cf8">${authResult.userData.fullName || authResult.userData.username}</strong>!<br/>Vault AES encryption key derived successfully.<br/>Opening your secure dashboard...</p>`,
        icon: 'success',
        iconColor: '#6366f1',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonText: 'Go to Dashboard &nbsp;→',
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

      completeLogin(authResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Invalid email or master password');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/25 mb-4 border border-white/10">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">PASSWORD</span>
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">VAULT</span>
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1.5 tracking-wider uppercase">Zero-Knowledge Secure Credential Storage</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel blue-animated-card p-8 shadow-premium">
          <div className="flex items-center gap-2 mb-6 text-slate-200">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg tracking-wide text-slate-100">Unlock Master Vault</h3>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address or Username
              </label>
              <div className="relative flex items-center">
                <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${fieldErrors.email ? 'text-amber-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="name@gmail.com"
                  className={`glass-input pl-11 transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] focus:border-blue-500 focus:shadow-[0_0_22px_rgba(59,130,246,0.4)] ${fieldErrors.email ? 'border-amber-500/70 focus:border-amber-400 focus:ring-amber-500/20 text-amber-100 placeholder:text-slate-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-amber-400 font-medium mt-2 flex items-center gap-1.5 transition-all duration-300 ease-in-out">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                  className={`glass-input font-mono pl-11 pr-11 transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] focus:border-blue-500 focus:shadow-[0_0_22px_rgba(59,130,246,0.4)] ${fieldErrors.password ? 'border-amber-500/70 focus:border-amber-400 focus:ring-amber-500/20 text-amber-100 placeholder:text-slate-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
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
                <p className="text-xs text-amber-400 font-medium mt-2 flex items-center gap-1.5 transition-all duration-300 ease-in-out">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {fieldErrors.password}
                </p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-relaxed">
                  <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Master password derives your local AES encryption key.</span>
                </p>
                {onSwitchToForgotPassword && (
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2 shrink-0 ml-2"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 text-sm mt-4 w-full shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300"
            >
              <span>{loading ? 'Deriving Encryption Key...' : 'Unlock Vault'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Don't have a secure vault account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition"
              >
                Create Vault
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
