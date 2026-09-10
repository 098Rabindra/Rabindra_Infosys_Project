import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { generateSecurePassword, calculatePasswordStrength } from '../utils/crypto';

export default function PasswordGeneratorModal({ isOpen, onClose }) {
  const [length, setLength] = useState(18);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pwd = generateSecurePassword(length, { uppercase, lowercase, numbers, symbols });
    setGeneratedPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, length, uppercase, lowercase, numbers, symbols]);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(generatedPassword);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fadeIn">
      <div className="glass-modal w-full max-w-md overflow-hidden border-white/[0.1] shadow-2xl bg-[#0b0f19]">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white tracking-wide">Password Generator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Generated Password Box */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.04] flex items-center justify-between gap-3 shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)]">
            <div className="font-mono text-base font-bold tracking-wider text-cyan-300 break-all select-all">
              {generatedPassword}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleGenerate}
                title="Regenerate"
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition border border-transparent hover:border-white/5"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition border border-indigo-500/20 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wide"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide shrink-0" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              <span>Password Length</span>
              <span className="text-cyan-400 font-mono text-sm font-bold">{length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer border border-white/5"
            />
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { id: 'uppercase', label: 'Uppercase (A-Z)', value: uppercase, set: setUppercase },
              { id: 'lowercase', label: 'Lowercase (a-z)', value: lowercase, set: setLowercase },
              { id: 'numbers', label: 'Numbers (0-9)', value: numbers, set: setNumbers },
              { id: 'symbols', label: 'Symbols (!@#$%)', value: symbols, set: setSymbols },
            ].map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/20 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer select-none transition"
              >
                <input
                  type="checkbox"
                  checked={opt.value}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="rounded border-white/10 text-cyan-500 focus:ring-cyan-500/20 w-4 h-4 bg-slate-950 focus:ring-offset-0"
                />
                <span className="text-xs font-semibold text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Close button */}
          <div className="mt-2 pt-4 border-t border-white/[0.05] flex justify-end">
            <button
              onClick={onClose}
              className="btn-primary w-full text-xs font-bold uppercase tracking-wider py-2.5 hover:scale-[1.01] active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
