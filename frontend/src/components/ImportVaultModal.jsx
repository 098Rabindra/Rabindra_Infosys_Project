import React, { useState } from 'react';
import { X, Upload, Shield, FileText, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { deriveKey, encryptPassword, decryptPassword } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function ImportVaultModal({ isOpen, onClose, onImportItems }) {
  const { user, encryptionKey } = useAuth();
  
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileType, setFileType] = useState(''); // 'csv' | 'json'
  const [isEncryptedJson, setIsEncryptedJson] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setSuccessCount(null);

    const filename = selectedFile.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      setFileContent(text);

      if (filename.endsWith('.json')) {
        setFileType('json');
        try {
          const parsed = JSON.parse(text);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items[0]?.encryptedPassword) {
            setIsEncryptedJson(true);
          } else {
            setIsEncryptedJson(false);
          }
        } catch (err) {
          setError('Invalid JSON format');
        }
      } else if (filename.endsWith('.csv')) {
        setFileType('csv');
        setIsEncryptedJson(false);
      } else {
        setError('Unsupported file type. Please upload a .csv or .json file');
      }
    };

    reader.readAsText(selectedFile);
  };

  const parseCsv = (csvText) => {
    const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const result = [];
    const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim());

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvRow(lines[i]);
      if (values.length === 0) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });

      const title = obj.title || obj.name || obj.url || 'Imported Credential';
      const username = obj.username || obj['username / email'] || obj.login_username || obj.email || '';
      const password = obj.password || obj.secret || obj.login_password || '';
      const url = obj.url || obj.website || obj.login_uri || '';
      const notes = obj.notes || obj.comment || '';
      let category = (obj.category || obj.type || 'LOGIN').toUpperCase();
      if (!['LOGIN', 'GITHUB', 'WORK', 'SOCIAL'].includes(category)) {
        category = 'LOGIN';
      }

      if (title || password) {
        result.push({ title, username, password, url, category, notes });
      }
    }

    return result;
  };

  const parseCsvRow = (rowText) => {
    const arr = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        if (insideQuote && rowText[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        arr.push(entry);
        entry = '';
      } else {
        entry += char;
      }
    }
    arr.push(entry);
    return arr;
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fileContent) {
      setError('Please select a vault backup or CSV file to import');
      return;
    }

    if (!encryptionKey) {
      setError('Vault encryption key missing. Please unlock vault.');
      return;
    }

    try {
      setImporting(true);
      setProgress(10);

      let itemsToImport = [];

      if (fileType === 'json') {
        const parsed = JSON.parse(fileContent);
        if (isEncryptedJson) {
          if (!passphrase) {
            setError('Please enter the backup passphrase to decrypt the backup file');
            setImporting(false);
            return;
          }
          const backupKey = await deriveKey(passphrase, parsed.userEmail || user?.email || 'PasswordVaultSalt');
          
          for (const item of parsed.items) {
            const plainPass = await decryptPassword(item.encryptedPassword, item.iv, backupKey);
            if (plainPass.includes('Decryption Error')) {
              throw new Error('Invalid backup passphrase. Could not decrypt import file.');
            }
            itemsToImport.push({
              title: item.title || 'Imported Credential',
              username: item.username || '',
              password: plainPass,
              url: item.url || '',
              category: item.category || 'LOGIN',
              notes: item.notes || '',
              favorite: Boolean(item.favorite),
            });
          }
        } else {
          // Plain JSON
          const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
          itemsToImport = rawItems.map((item) => ({
            title: item.title || item.name || 'Imported Credential',
            username: item.username || item.email || '',
            password: item.password || item.secret || '',
            url: item.url || item.website || '',
            category: item.category || 'LOGIN',
            notes: item.notes || '',
            favorite: Boolean(item.favorite),
          }));
        }
      } else if (fileType === 'csv') {
        itemsToImport = parseCsv(fileContent);
      }

      if (itemsToImport.length === 0) {
        throw new Error('No valid credential records found in file.');
      }

      // Batch encrypt and save each item client-side
      let completed = 0;
      let skippedCount = 0;
      for (const item of itemsToImport) {
        const secretText = item.password || '';
        const { encryptedPassword, iv } = await encryptPassword(secretText, encryptionKey);

        const payload = {
          title: item.title.trim(),
          category: item.category,
          username: (item.username || '').trim(),
          encryptedPassword,
          iv,
          url: (item.url || '').trim(),
          favorite: Boolean(item.favorite),
          notes: item.notes || '',
        };

        try {
          await onImportItems(payload);
          completed++;
        } catch (err) {
          if (err.message && err.message.toLowerCase().includes('already exist')) {
            skippedCount++;
          } else {
            throw err;
          }
        }
        setProgress(Math.round(((completed + skippedCount) / itemsToImport.length) * 100));
      }

      if (completed === 0 && skippedCount > 0) {
        setError('All credentials in this backup file already exist in your vault! No duplicates were imported.');
      } else {
        setSuccessCount(completed);
      }
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fadeIn">
      <div className="glass-modal w-full max-w-md overflow-hidden border-white/[0.1] shadow-2xl bg-[#0b0f19]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white tracking-wide">Import Vault Credentials</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleImportSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col items-center justify-center text-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h4 className="font-bold text-sm">Successfully Imported {successCount} Credentials!</h4>
              <p className="text-xs text-slate-400">All credentials were client-side AES-256 encrypted and stored in your vault.</p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary text-xs uppercase font-bold tracking-wider py-2.5 px-6 mt-2"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* File Dropzone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Select Backup File (.csv, .json)
                </label>
                <div className="relative border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center transition bg-slate-900/30">
                  <input
                    type="file"
                    accept=".csv, .json"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileText className="w-8 h-8 text-cyan-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">
                    {file ? file.name : 'Click or drop backup file here'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports Password Vault JSON and Chrome/Bitwarden CSV</span>
                </div>
              </div>

              {/* Passphrase field if file is encrypted JSON */}
              {isEncryptedJson && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-2">
                  <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    Encrypted Backup Passphrase *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      required
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter passphrase used when exporting"
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
              )}

              {/* Progress bar */}
              {importing && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span>Encrypting & Importing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
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
                  disabled={importing || !fileContent}
                  className="btn-primary text-xs uppercase font-bold tracking-wider py-2.5 px-5 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importing ? 'Processing...' : 'Import Credentials'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
