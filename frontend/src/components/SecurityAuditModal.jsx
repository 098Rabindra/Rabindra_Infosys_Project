import React, { useState, useMemo } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, KeyRound, Sparkles, Check, Copy, PlusCircle } from 'lucide-react';
import { calculatePasswordStrength, generateSecurePassword } from '../utils/crypto';

export default function SecurityAuditModal({ isOpen, onClose, vaultItems, decryptedMap, onSaveItem, onAddNew }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [rotatedMap, setRotatedMap] = useState({});

  // Perform Security Audit Analysis
  const auditResults = useMemo(() => {
    const weakItems = [];
    const reusedMap = {}; // secret -> items[]
    let totalScore = 0;
    let decryptedCount = 0;

    for (const item of vaultItems) {
      const secret = decryptedMap[item.id] || '';
      if (!secret) continue;

      decryptedCount++;
      const str = calculatePasswordStrength(secret);
      totalScore += str.score;

      if (str.score < 50) {
        weakItems.push({ item, str, secret });
      }

      if (!reusedMap[secret]) {
        reusedMap[secret] = [];
      }
      reusedMap[secret].push(item);
    }

    const reusedItems = [];
    for (const secret in reusedMap) {
      if (reusedMap[secret].length > 1) {
        reusedItems.push({
          secret,
          count: reusedMap[secret].length,
          items: reusedMap[secret],
        });
      }
    }

    const avgScore = decryptedCount > 0 ? Math.round(totalScore / decryptedCount) : 100;

    return {
      avgScore,
      weakItems,
      reusedItems,
      totalItems: vaultItems.length,
      optimalCount: decryptedCount - weakItems.length,
    };
  }, [vaultItems, decryptedMap]);

  // Handle 1-Click Auto Rotation of a weak or reused password
  const handleAutoRotate = async (item) => {
    try {
      setUpdatingId(item.id);
      const newSecret = generateSecurePassword(18);

      const payload = {
        title: item.title,
        category: item.category,
        username: item.username,
        encryptedPassword: '', // Will be encrypted inside onSaveItem
        iv: '',
        url: item.url,
        favorite: Boolean(item.favorite),
        notes: item.notes,
        newSecret, // Handled by Dashboard handler
      };

      await onSaveItem(payload, item.id, newSecret);
      setRotatedMap((prev) => ({ ...prev, [item.id]: newSecret }));
    } catch (err) {
      alert('Failed to rotate password: ' + (err.message || 'Error'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fadeIn">
      <div className="glass-modal w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border-white/[0.1] shadow-2xl bg-[#0b0f19]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">Vault Security Audit Report</h3>
              <p className="text-[10px] text-slate-400">Identify weak, reused, and vulnerable credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* Audit Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-3.5 rounded-xl border-white/[0.04] bg-slate-900/40 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
              <div className="text-xl font-extrabold text-indigo-400 font-mono mt-1">
                {auditResults.avgScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border-white/[0.04] bg-slate-900/40 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Credentials</span>
              <div className="text-xl font-extrabold text-slate-200 font-mono mt-1">
                {auditResults.totalItems}
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border-rose-500/20 bg-rose-500/[0.03] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Weak Passwords</span>
              <div className="text-xl font-extrabold text-rose-400 font-mono mt-1">
                {auditResults.weakItems.length}
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border-amber-500/20 bg-amber-500/[0.03] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Reused Passwords</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
                {auditResults.reusedItems.length}
              </div>
            </div>
          </div>

          {/* Reused Password Warnings */}
          {auditResults.reusedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Reused Passwords Warning ({auditResults.reusedItems.length} Groups)</span>
              </div>

              <div className="flex flex-col gap-3">
                {auditResults.reusedItems.map((group, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                      <span>Shared across {group.count} credentials</span>
                      <span className="text-[10px] font-mono bg-amber-500/10 px-2 py-0.5 rounded text-amber-400">High Risk</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/5 w-full sm:w-auto flex-1 min-w-[200px]"
                        >
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-200 truncate">{item.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.username || 'No Username'}</div>
                          </div>
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => handleAutoRotate(item)}
                            className="btn-secondary text-[10px] py-1.5 px-3 font-bold uppercase tracking-wider border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shrink-0 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{updatingId === item.id ? 'Rotating...' : 'Rotate'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Passwords Section */}
          {auditResults.weakItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Weak & Vulnerable Passwords ({auditResults.weakItems.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {auditResults.weakItems.map(({ item, str }) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.04] flex items-center justify-between gap-4 hover:border-rose-500/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                        !
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.username || 'No Username'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {str.label} ({str.score}/100)
                      </span>
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => handleAutoRotate(item)}
                        className="btn-primary text-[10px] py-1.5 px-3 font-bold uppercase tracking-wider flex items-center gap-1 hover:scale-[1.01]"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        <span>{updatingId === item.id ? 'Rotating...' : 'Auto-Fix'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Vault state or Clean Health Message */}
          {auditResults.totalItems === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-200">Vault is Currently Empty</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                No credentials found to audit. Add your first credential or item to run security analysis and password health monitoring.
              </p>
              {onAddNew && (
                <button
                  onClick={onAddNew}
                  className="btn-primary text-xs py-2.5 px-5 font-bold uppercase tracking-wider mt-2 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Credential / Item</span>
                </button>
              )}
            </div>
          ) : auditResults.weakItems.length === 0 && auditResults.reusedItems.length === 0 && (
            <div className="p-8 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
              <h4 className="font-bold text-sm text-emerald-300">Your Vault is Secure & Healthy!</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                No weak passwords or reused credentials were detected across your {auditResults.totalItems} stored credentials.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="text-[11px] text-slate-400 font-medium">
            Automated PBKDF2 + AES-256 Security Scanner
          </div>
          <button
            onClick={onClose}
            className="btn-primary text-xs uppercase font-bold tracking-wider py-2.5 px-6"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
