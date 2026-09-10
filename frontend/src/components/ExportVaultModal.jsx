import React, { useState } from 'react';
import { X, Download, Shield, FileJson, FileSpreadsheet, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { deriveKey, encryptPassword } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function ExportVaultModal({ isOpen, onClose, vaultItems, decryptedMap }) {
  const { user } = useAuth();
  const [exportType, setExportType] = useState('encrypted'); // 'encrypted' | 'csv' | 'json'
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = async (e) => {
    e.preventDefault();
    setError('');

    if (exportType === 'encrypted' && !passphrase) {
      setError('Please enter a backup passphrase to protect your encrypted export');
      return;
    }

    try {
      setExporting(true);

      if (exportType === 'encrypted') {
        // Derive export key from user passphrase
        const exportKey = await deriveKey(passphrase, user?.email || 'PasswordVaultSalt');
        
        const encryptedItems = [];
        for (const item of vaultItems) {
          const plainSecret = decryptedMap[item.id] || '';
          const { encryptedPassword, iv } = await encryptPassword(plainSecret, exportKey);
          encryptedItems.push({
            title: item.title,
            category: item.category,
            username: item.username,
            encryptedPassword,
            iv,
            url: item.url,
            favorite: item.favorite,
            notes: item.notes,
            createdAt: item.createdAt,
          });
        }

        const backupData = {
          version: '1.0',
          app: 'PasswordVault Zero-Knowledge Backup',
          exportedAt: new Date().toISOString(),
          userEmail: user?.email,
          itemCount: encryptedItems.length,
          items: encryptedItems,
        };

        downloadFile(
          JSON.stringify(backupData, null, 2),
          `password_vault_backup_${new Date().toISOString().slice(0, 10)}.json`,
          'application/json'
        );
      } else if (exportType === 'json') {
        // Plaintext JSON export
        const plaintextItems = vaultItems.map((item) => ({
          title: item.title,
          category: item.category,
          username: item.username,
          password: decryptedMap[item.id] || '',
          url: item.url,
          favorite: item.favorite,
          notes: item.notes,
        }));

        downloadFile(
          JSON.stringify(plaintextItems, null, 2),
          `password_vault_export_${new Date().toISOString().slice(0, 10)}.json`,
          'application/json'
        );
      } else if (exportType === 'csv') {
        // Plaintext CSV export
        const headers = ['Title', 'Category', 'Username', 'Password', 'URL', 'Favorite', 'Notes'];
        const csvRows = [headers.join(',')];

        for (const item of vaultItems) {
          const plainSecret = decryptedMap[item.id] || '';
          const row = [
            escapeCsv(item.title),
            escapeCsv(item.category),
            escapeCsv(item.username),
            escapeCsv(plainSecret),
            escapeCsv(item.url),
            item.favorite ? 'true' : 'false',
            escapeCsv(item.notes),
          ];
          csvRows.push(row.join(','));
        }

        downloadFile(
          csvRows.join('\n'),
          `password_vault_export_${new Date().toISOString().slice(0, 10)}.csv`,
          'text/csv'
        );
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const escapeCsv = (str) => {
    if (!str) return '""';
    const escaped = String(str).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fadeIn">
      <div className="glass-modal w-full max-w-md overflow-hidden border-white/[0.1] shadow-2xl bg-[#0b0f19]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white tracking-wide">Export Vault Credentials</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleExport} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Export Options */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Select Export Format
            </label>
            <div className="flex flex-col gap-2.5">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  exportType === 'encrypted'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    : 'bg-slate-900/40 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="encrypted"
                  checked={exportType === 'encrypted'}
                  onChange={() => setExportType('encrypted')}
                  className="mt-1 accent-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Encrypted Zero-Knowledge Backup (.json)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Safest option. Encrypts all vault items using a custom passphrase before downloading.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  exportType === 'csv'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-slate-900/40 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="csv"
                  checked={exportType === 'csv'}
                  onChange={() => setExportType('csv')}
                  className="mt-1 accent-amber-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unencrypted CSV File (.csv)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Plaintext export compatible with spreadsheets and external password managers.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  exportType === 'json'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                    : 'bg-slate-900/40 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="json"
                  checked={exportType === 'json'}
                  onChange={() => setExportType('json')}
                  className="mt-1 accent-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Unencrypted JSON File (.json)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Plaintext JSON export format.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Passphrase prompt for encrypted export */}
          {exportType === 'encrypted' ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Export Passphrase *
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  required
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a passphrase to lock backup file"
                  className="glass-input text-xs pl-11 pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Warning: Unencrypted exports contain your plain passwords in readable format. Keep the file safe!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs uppercase font-bold tracking-wider py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exporting || vaultItems.length === 0}
              className="btn-primary text-xs uppercase font-bold tracking-wider py-2.5 px-5 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting Vault...' : `Export ${vaultItems.length} Credentials`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
