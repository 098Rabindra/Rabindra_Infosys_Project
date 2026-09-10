import React, { useState, useEffect } from 'react';
import { X, Globe, User, Shield, Sparkles, Eye, EyeOff, Lock, KeyRound, Github, Briefcase, Share2, AlertCircle, Check, Trash2, RefreshCw } from 'lucide-react';
import { encryptPassword, calculatePasswordStrength, generateSecurePassword, deriveSharedKey } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

const CATEGORY_OPTIONS = [
  { id: 'LOGIN', label: 'Login', icon: KeyRound },
  { id: 'GITHUB', label: 'GitHub', icon: Github },
  { id: 'WORK', label: 'Work', icon: Briefcase },
  { id: 'SOCIAL', label: 'Social', icon: Share2 },
];

export default function VaultItemModal({ isOpen, onClose, onSave, onDelete, initialData, vaultItems = [] }) {
  const { encryptionKey, unlockVault } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Inline Master Password Unlock State (when vault session is locked)
  const [modalMasterPass, setModalMasterPass] = useState('');
  const [unlockingVault, setUnlockingVault] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Inline Password Generator Popup State
  const [showGeneratorPopup, setShowGeneratorPopup] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genLowercase, setGenLowercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [previewPassword, setPreviewPassword] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(initialData.category || 'LOGIN');
      setUsername(initialData.username || '');
      setPassword(initialData.decryptedPassword || '');
      setUrl(initialData.url || '');
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setCategory('LOGIN');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
    }
    setError('');
    setFieldErrors({});
    setUnlockError('');
    setModalMasterPass('');
  }, [initialData, isOpen]);

  const handleUnlockModalVault = async (e) => {
    e?.preventDefault();
    if (!modalMasterPass || unlockingVault) return;
    setUnlockingVault(true);
    setUnlockError('');
    try {
      const ok = await unlockVault(modalMasterPass);
      if (!ok) {
        setUnlockError('Invalid Master Password. Please try again.');
      } else {
        setModalMasterPass('');
        setError('');
      }
    } catch (err) {
      setUnlockError('Failed to unlock vault session.');
    } finally {
      setUnlockingVault(false);
    }
  };

  const isReadOnly = Boolean(initialData?.permissionLevel === 'VIEW_ONLY' || initialData?.readOnly);

  const strength = calculatePasswordStrength(password);

  const getPlaceholders = (cat) => {
    switch (cat) {
      case 'GITHUB':
        return {
          title: 'e.g. GitHub Account, Personal Access Token (PAT)',
          username: 'github_username or user@email.com',
          password: 'Enter password or PAT token',
          url: 'https://github.com',
          notes: 'SSH Key Passphrase, PAT Token scopes, 2FA Recovery Codes...',
        };
      case 'WORK':
        return {
          title: 'e.g. Corporate SSO, Work Slack, Corporate VPN',
          username: 'employee_id or work_email@company.com',
          password: 'Enter work SSO password',
          url: 'https://sso.company.com',
          notes: 'Employee ID, VPN Server, Security pin...',
        };
      case 'SOCIAL':
        return {
          title: 'e.g. Twitter/X, Discord, LinkedIn, Instagram',
          username: 'handle or email',
          password: 'Enter social account password',
          url: 'https://twitter.com',
          notes: 'Recovery codes, linked email...',
        };
      default:
        return {
          title: 'e.g. Personal Account, Netflix, Web App',
          username: 'user@example.com',
          password: 'Enter or generate secret password',
          url: 'https://example.com',
          notes: 'Additional security notes...',
        };
    }
  };

  const placeholders = getPlaceholders(category);

  const handleGeneratePreview = () => {
    const pwd = generateSecurePassword(genLength, {
      uppercase: genUppercase,
      lowercase: genLowercase,
      numbers: genNumbers,
      symbols: genSymbols,
    });
    setPreviewPassword(pwd);
  };

  useEffect(() => {
    if (showGeneratorPopup) {
      handleGeneratePreview();
    }
  }, [showGeneratorPopup, genLength, genUppercase, genLowercase, genNumbers, genSymbols]);

  const applyGeneratedPassword = () => {
    if (previewPassword) {
      setPassword(previewPassword);
      setShowPassword(true);
      setShowGeneratorPopup(false);
      if (fieldErrors.password) {
        setFieldErrors((prev) => ({ ...prev, password: '' }));
      }
    }
  };

  const handleToggleGeneratorPopup = () => {
    setShowGeneratorPopup((prev) => !prev);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (fieldErrors.title) {
      setFieldErrors((prev) => ({ ...prev, title: '' }));
    }
  };

  const handleUsernameChange = (val) => {
    setUsername(val);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleUrlChange = (val) => {
    setUrl(val);
    if (fieldErrors.url) {
      setFieldErrors((prev) => ({ ...prev, url: '' }));
    }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    if (fieldErrors.notes) {
      setFieldErrors((prev) => ({ ...prev, notes: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Title / Item Name is required';
    } else if (trimmedTitle.length < 2) {
      errors.title = 'Title must be at least 2 characters';
    } else if (trimmedTitle.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (username.trim()) {
      const trimmedUser = username.trim();
      if (trimmedUser.length < 2) {
        errors.username = 'Username / Email must be at least 2 characters';
      } else if (trimmedUser.includes('@')) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedUser)) {
          errors.username = 'Please enter a valid email address';
        }
      }
    }

    if (!password) {
      errors.password = 'Password / Secret is required';
    } else if (password.length < 4) {
      errors.password = 'Password / Secret must be at least 4 characters';
    }

    if (url.trim()) {
      const trimmedUrl = url.trim();
      const urlPattern = /^(https?:\/\/)?(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:[0-9]+)?(\/.*)?$/i;
      if (!urlPattern.test(trimmedUrl)) {
        errors.url = 'Please enter a valid URL (e.g. example.com or https://example.com)';
      }
    }

    if (notes && notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setError('');

    if (!validate()) return;

    if (!encryptionKey) {
      setError('Vault session is locked. Please enter your Master Password above to unlock before saving.');
      return;
    }

    try {
      setSaving(true);

      // Client-side AES-256-GCM Encryption before network payload
      let keyToUse = encryptionKey;
      const cleanTitle = (title || initialData?.title || '').replaceAll(/\s*\(shared\)/gi, '').trim().toLowerCase();
      const isShared = Boolean(
        initialData?.shared ||
        initialData?.isShared ||
        initialData?.permissionLevel === 'VIEW_ONLY' ||
        initialData?.permissionLevel === 'EDIT_ACCESS' ||
        (initialData?.title && initialData.title.toLowerCase().includes('(shared)')) ||
        (cleanTitle && vaultItems?.some((other) => {
          if (initialData?.id && other.id === initialData.id) return false;
          const otherClean = (other.title || '').replaceAll(/\s*\(shared\)/gi, '').trim().toLowerCase();
          return otherClean && (otherClean === cleanTitle || other.shared || other.isShared);
        }))
      );
      if (isShared || !keyToUse) {
        keyToUse = await deriveSharedKey();
      }

      const { encryptedPassword, iv } = await encryptPassword(password, keyToUse);

      const payload = {
        title: title.trim(),
        category,
        username: username.trim(),
        encryptedPassword,
        iv,
        decryptedPassword: password,
        url: url.trim(),
        favorite: initialData ? Boolean(initialData.favorite) : false,
        notes,
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to encrypt and save vault item');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fadeIn">
      <div className="glass-modal white-animated-modal w-full max-w-2xl overflow-hidden shadow-2xl bg-[#0b0f19] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
              <span>{isReadOnly ? 'Credential Details' : initialData ? 'Edit Vault Item' : 'New Vault Item'}</span>
              {isReadOnly && (
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  View Only
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {!encryptionKey && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Vault Session Locked</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Your vault encryption session is locked. Enter your Master Password below to derive your encryption key and save credentials.
              </p>
              {unlockError && (
                <div className="text-[11px] text-rose-300 font-bold bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                  {unlockError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={modalMasterPass}
                  onChange={(e) => setModalMasterPass(e.target.value)}
                  placeholder="Enter Master Password..."
                  className="glass-input text-xs py-2 border-amber-500/30 font-mono"
                />
                <button
                  type="button"
                  onClick={handleUnlockModalVault}
                  disabled={unlockingVault || !modalMasterPass}
                  className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  {unlockingVault ? 'Unlocking...' : 'Unlock Vault'}
                </button>
              </div>
            </div>
          )}

          {isReadOnly && (
            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="text-[11px] leading-relaxed font-semibold">
                <strong className="font-bold text-sky-300">System Permission Check:</strong> View Only permission level assigned by owner. Editing is disabled.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-white text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Item Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setCategory(cat.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-extrabold'
                        : 'bg-slate-900/50 text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.04] hover:border-white/10'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-75' : ''}`}
                  >
                    {Icon ? <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} /> : null}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Title / Item Name *</span>
              {title.trim().length >= 2 && !fieldErrors.title && (
                <span className="text-emerald-400 flex items-center gap-1 font-bold text-[9px]">
                  <Check className="w-3 h-3 text-emerald-400" /> Valid Title
                </span>
              )}
            </label>
            <input
              type="text"
              required
              readOnly={isReadOnly}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={placeholders.title}
              className={`glass-input text-xs transition-all duration-200 ${
                fieldErrors.title
                  ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] text-rose-100 placeholder:text-rose-300/40 focus:border-rose-500 focus:ring-rose-500/20'
                  : title.trim().length >= 2
                  ? 'border-emerald-500/50 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : ''
              } ${isReadOnly ? 'cursor-not-allowed bg-slate-900/80' : ''}`}
            />
            {fieldErrors.title && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold mt-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{fieldErrors.title}</span>
              </div>
            )}
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Username / Email</span>
              {username.trim().length >= 2 && !fieldErrors.username && (
                <span className="text-emerald-400 flex items-center gap-1 font-bold text-[9px]">
                  <Check className="w-3 h-3 text-emerald-400" /> Valid Format
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <User className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${
                fieldErrors.username ? 'text-rose-400' : username.trim().length >= 2 ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                readOnly={isReadOnly}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder={placeholders.username}
                className={`glass-input pl-11 text-xs transition-all duration-200 ${
                  fieldErrors.username
                    ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] text-rose-100 focus:border-rose-500 focus:ring-rose-500/20'
                    : username.trim().length >= 2
                    ? 'border-emerald-500/50 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                    : ''
                } ${isReadOnly ? 'cursor-not-allowed bg-slate-900/80' : ''}`}
              />
            </div>
            {fieldErrors.username && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold mt-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{fieldErrors.username}</span>
              </div>
            )}
          </div>

          {/* Password with Strength & Generator */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Password / Secret *</span>
                {password.length >= 4 && !fieldErrors.password && (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold text-[9px] lowercase">
                    <Check className="w-3 h-3 text-emerald-400" /> valid secret
                  </span>
                )}
              </label>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleToggleGeneratorPopup}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 transition p-1 rounded hover:bg-indigo-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showGeneratorPopup ? 'Close Generator' : 'Generate Secure'}</span>
                </button>
              )}
            </div>

            {/* Interactive Inline Password Generator Popup */}
            {!isReadOnly && showGeneratorPopup && (
              <div className="mb-3 p-4 rounded-xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-fadeIn flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-500/20 text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">Password Generator Tool</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeneratorPopup(false)}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Password Preview */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/90 border border-indigo-500/25 font-mono text-xs text-cyan-300">
                  <span className="truncate select-all font-bold tracking-wider">{previewPassword || '••••••••'}</span>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    className="p-1 text-slate-400 hover:text-white transition shrink-0 hover:bg-white/5 rounded"
                    title="Regenerate Password"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Length Slider */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>Password Length</span>
                    <span className="text-cyan-400 font-mono text-xs font-bold">{genLength}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Option Checkboxes */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={genUppercase}
                      onChange={(e) => setGenUppercase(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={genLowercase}
                      onChange={(e) => setGenLowercase(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={genNumbers}
                      onChange={(e) => setGenNumbers(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                    />
                    <span>Numbers (0-9)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                    />
                    <span>Symbols (!@#$)</span>
                  </label>
                </div>

                {/* Generator Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowGeneratorPopup(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyGeneratedPassword}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Use Password</span>
                  </button>
                </div>
              </div>
            )}

            <div className="relative flex items-center">
              <Shield className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${
                fieldErrors.password ? 'text-rose-400' : password.length >= 4 ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                readOnly={isReadOnly}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder={placeholders.password}
                className={`glass-input font-mono pl-11 pr-12 text-xs transition-all duration-200 ${
                  fieldErrors.password
                    ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] text-rose-100 focus:border-rose-500 focus:ring-rose-500/20'
                    : password.length >= 4
                    ? 'border-emerald-500/50 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                    : ''
                } ${isReadOnly ? 'cursor-not-allowed bg-slate-900/80' : ''}`}
              />
              <div className="absolute right-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {fieldErrors.password && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold mt-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{fieldErrors.password}</span>
              </div>
            )}

            {/* Strength Meter */}
            {password && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 bg-slate-900 border border-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide shrink-0" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Website URL</span>
              {url.trim() && !fieldErrors.url && (
                <span className="text-emerald-400 flex items-center gap-1 font-bold text-[9px]">
                  <Check className="w-3 h-3 text-emerald-400" /> Valid URL
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <Globe className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors duration-200 ${
                fieldErrors.url ? 'text-rose-400' : url.trim() ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                readOnly={isReadOnly}
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={placeholders.url}
                className={`glass-input pl-11 text-xs transition-all duration-200 ${
                  fieldErrors.url
                    ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] text-rose-100 focus:border-rose-500 focus:ring-rose-500/20'
                    : url.trim()
                    ? 'border-emerald-500/50 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                    : ''
                } ${isReadOnly ? 'cursor-not-allowed bg-slate-900/80' : ''}`}
              />
            </div>
            {fieldErrors.url && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold mt-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{fieldErrors.url}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Notes & Recovery Keys</span>
              {notes && !fieldErrors.notes && (
                <span className="text-slate-400 text-[9px] font-mono">{notes.length}/2000</span>
              )}
            </label>
            <textarea
              rows={2}
              readOnly={isReadOnly}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={placeholders.notes}
              className={`glass-input resize-none text-xs transition-all duration-200 ${
                fieldErrors.notes
                  ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] text-rose-100 focus:border-rose-500 focus:ring-rose-500/20'
                  : ''
              } ${isReadOnly ? 'cursor-not-allowed bg-slate-900/80' : ''}`}
            />
            {fieldErrors.notes && (
              <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold mt-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{fieldErrors.notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-4 border-t border-white/[0.05]">
            {initialData?.id && onDelete && (!initialData?.permissionLevel || initialData?.permissionLevel === 'FULL_MANAGEMENT') ? (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
                title="Delete credential from vault"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs uppercase font-bold tracking-wider py-2.5 px-4"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs uppercase font-bold tracking-wider py-2.5 px-5 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {saving ? 'Encrypting & Saving...' : 'Save Credential'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
