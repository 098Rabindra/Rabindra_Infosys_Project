import React from 'react';
import { ShieldAlert, LogOut, RefreshCw, Clock } from 'lucide-react';

export default function SessionTimeoutModal({ isOpen, secondsLeft, onStayLoggedIn, onLogoutNow }) {
  if (!isOpen) return null;

  const percentage = Math.max(0, Math.min(100, (secondsLeft / 10) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in">
      <div className="glass-modal w-full max-w-md overflow-hidden border-rose-500/30 shadow-2xl bg-[#0b0f19] relative">
        {/* Animated Background Pulse */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-rose-500/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">Session Inactivity Warning</h3>
              <p className="text-[10px] text-rose-300 font-medium">No activity detected for 1 minute</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-5">
          {/* Countdown Clock Circle */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-900 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-rose-500 stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="263.89"
                strokeDashoffset={263.89 - (263.89 * percentage) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-extrabold text-white">{secondsLeft}</span>
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">seconds</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              You have been inactive for 1 minute.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              For security, your password vault session will automatically lock and log out when the timer reaches 0. Move mouse or press any key to extend session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
