import React, { useState, useEffect } from 'react';
import {
  Share2,
  Shield,
  Eye,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  Settings,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import Swal from 'sweetalert2';
import { vaultApi } from '../utils/api';
import { deriveSharedKey, encryptPassword, decryptPassword } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function SharedCredentialsSection({
  vaultItems,
  decryptedMap,
  token,
  onRefreshItems,
  initialSelectedItem = null,
  onEditItem,
  onDeleteItem
}) {
  const { encryptionKey } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState(initialSelectedItem?.id || (vaultItems[0]?.id || ''));
  const [recipientEmail, setRecipientEmail] = useState('');
  const [assignedPermission, setAssignedPermission] = useState('VIEW_ONLY');
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [systemCheckLog, setSystemCheckLog] = useState(null);

  const handleRefreshSharing = async () => {
    setRefreshing(true);
    try {
      if (onRefreshItems) {
        await onRefreshItems();
      }
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Sharing Status & Vault Refreshed',
        showConfirmButton: false,
        timer: 2000,
        background: '#0f172a',
        color: '#f1f5f9',
      });
    } catch (e) {
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (initialSelectedItem?.id) {
      setSelectedItemId(initialSelectedItem.id);
    } else if (vaultItems.length > 0 && !selectedItemId) {
      setSelectedItemId(vaultItems[0].id);
    }
  }, [initialSelectedItem, vaultItems]);

  const selectedItem = vaultItems.find(i => i.id === selectedItemId) || vaultItems[0] || null;

  // Handle assigning/updating permission level
  const handleAssignPermission = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdating(true);
    setSystemCheckLog(null);
    try {
      let payload = null;
      let plainSecret = decryptedMap ? decryptedMap[selectedItem.id] : null;
      if ((!plainSecret || plainSecret.startsWith('[Decryption Error')) && selectedItem.encryptedPassword) {
        plainSecret = await decryptPassword(selectedItem.encryptedPassword, selectedItem.iv, encryptionKey);
      }
      if ((!plainSecret || plainSecret.startsWith('[Decryption Error')) && selectedItem.encryptedPassword) {
        plainSecret = await decryptPassword(selectedItem.encryptedPassword, selectedItem.iv, await deriveSharedKey());
      }

      if (plainSecret && !plainSecret.startsWith('[Decryption Error')) {
        const sharedKey = await deriveSharedKey();
        const encrypted = await encryptPassword(plainSecret, sharedKey);
        payload = {
          encryptedPassword: encrypted.encryptedPassword,
          iv: encrypted.iv
        };
      }

      await vaultApi.updatePermissionLevel(selectedItem.id, assignedPermission, recipientEmail, token, payload);
      window.dispatchEvent(new Event('notification-updated'));
      
      const recipientStr = recipientEmail.trim() || 'recipient@vault.io';
      
      Swal.fire({
        icon: 'success',
        title: 'Permission Assigned Successfully!',
        html: `
          <div class="text-left text-xs space-y-2 text-slate-300">
            <p><strong>Credential:</strong> ${selectedItem.title}</p>
            <p><strong>Recipient:</strong> ${recipientStr}</p>
            <p><strong>Assigned Level:</strong> <span class="text-indigo-400 font-bold">${
              assignedPermission === 'VIEW_ONLY' ? 'View Only' :
              assignedPermission === 'EDIT_ACCESS' ? 'Edit Access' : 'Full Management'
            }</span></p>
            <div class="p-2 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 mt-2">
              System permission check active. Recipient access rules updated immediately.
            </div>
          </div>
        `,
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#6366f1'
      });

      if (onRefreshItems) onRefreshItems();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.message || 'Failed to update credential permission level',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#f43f5e'
      });
    } finally {
      setUpdating(false);
    }
  };

  // System Permission Check Validator Function
  const executeSystemPermissionCheck = (item, requestedAction) => {
    const perm = item.permissionLevel || 'FULL_MANAGEMENT';
    let allowed = false;
    let explanation = '';

    switch (requestedAction) {
      case 'VIEW':
        allowed = true; // All levels can view
        explanation = 'VIEW action permitted for View Only, Edit Access, and Full Management.';
        break;

      case 'EDIT':
        if (perm === 'VIEW_ONLY') {
          allowed = false;
          explanation = "DENIED: Recipient has 'View Only' access level. Cannot edit credential.";
        } else {
          allowed = true;
          explanation = `EDIT action permitted under '${perm === 'EDIT_ACCESS' ? 'Edit Access' : 'Full Management'}' level.`;
        }
        break;

      case 'DELETE':
        if (perm === 'FULL_MANAGEMENT') {
          allowed = true;
          explanation = "DELETE action permitted under 'Full Management' level.";
        } else {
          allowed = false;
          explanation = `DENIED: Recipient has '${perm === 'VIEW_ONLY' ? 'View Only' : 'Edit Access'}' level. Only 'Full Management' level can delete credentials.`;
        }
        break;

      case 'MANAGE_SHARING':
        if (perm === 'FULL_MANAGEMENT') {
          allowed = true;
          explanation = "MANAGE SHARING action permitted under 'Full Management' level.";
        } else {
          allowed = false;
          explanation = `DENIED: Recipient has '${perm === 'VIEW_ONLY' ? 'View Only' : 'Edit Access'}' level. Only 'Full Management' level can alter sharing permissions.`;
        }
        break;

      default:
        allowed = false;
        explanation = 'Unknown action requested.';
    }

    // Set System Check Audit Result for display
    setSystemCheckLog({
      timestamp: new Date().toLocaleTimeString(),
      itemTitle: item.title,
      permissionLevel: perm,
      action: requestedAction,
      allowed,
      explanation
    });

    if (allowed) {
      if (requestedAction === 'VIEW' || requestedAction === 'EDIT') {
        onEditItem(item);
      } else if (requestedAction === 'DELETE') {
        onDeleteItem(item.id);
      } else if (requestedAction === 'MANAGE_SHARING') {
        setSelectedItemId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'System Permission Check: Action Denied',
        html: `
          <div class="text-left text-xs space-y-2 text-slate-200">
            <div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px] leading-relaxed">
              🚫 <strong>PERMISSION DENIED</strong><br/>
              Action Requested: <span class="uppercase font-bold">${requestedAction}</span><br/>
              Assigned Permission Level: <span class="uppercase font-bold">${perm}</span>
            </div>
            <p className="mt-2 text-slate-300">${explanation}</p>
          </div>
        `,
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#f43f5e',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Section Hero Header */}
      <div className="glass-panel p-6 border-indigo-500/20 bg-indigo-950/20 shadow-premium relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">Shared Credentials & Permission Management</h2>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Page Section View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Select any credential, assign granular permission levels (View Only, Edit Access, Full Management), and enforce real-time system action access controls.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshSharing}
          disabled={refreshing}
          className="btn-secondary text-xs py-2 px-3.5 border border-white/10 flex items-center gap-2 z-10 shrink-0 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Sharing Status'}</span>
        </button>
      </div>

      {/* Main Section Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Step 1 & Step 2 (Select Credential & Assign Permission) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* STEP 1: Select Shared Credential */}
          <div className="glass-panel p-5 border-white/10 bg-slate-900/50 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Select Credential</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Step 1 of 2</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Choose Credential to Share / Manage
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="glass-input text-xs font-semibold py-2.5 border-white/10 bg-slate-950/80 text-indigo-200"
              >
                {vaultItems.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900 text-slate-200">
                    {item.title} ({item.category}) — Current: {item.permissionLevel || 'FULL_MANAGEMENT'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Credential Summary Badge */}
            {selectedItem && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{selectedItem.title}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    selectedItem.permissionLevel === 'VIEW_ONLY'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      : selectedItem.permissionLevel === 'EDIT_ACCESS'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {selectedItem.permissionLevel || 'FULL_MANAGEMENT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <div>Username: <span className="text-slate-200 font-mono">{selectedItem.username || '—'}</span></div>
                  <div>Category: <span className="text-slate-200 font-semibold">{selectedItem.category}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Assign Permission Level */}
          <form onSubmit={handleAssignPermission} className="glass-panel p-5 border-white/10 bg-slate-900/50 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Assign Permission Level</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Step 2 of 2</span>
            </div>

            {/* Recipient Email Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Recipient Email / User ID
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. colleague@company.com or user@vault.io"
                className="glass-input text-xs py-2.5 border-white/10"
              />
            </div>

            {/* Permission Levels Selection Radio Cards */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Select Assigned Permission Level
              </label>
              <div className="flex flex-col gap-3">
                {/* View Only Option */}
                <div
                  onClick={() => setAssignedPermission('VIEW_ONLY')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition duration-200 flex items-start gap-3 ${
                    assignedPermission === 'VIEW_ONLY'
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${assignedPermission === 'VIEW_ONLY' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">View Only</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">View only</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Recipient can only view credentials. Cannot edit, cannot delete, and cannot manage sharing settings.
                    </p>
                  </div>
                </div>

                {/* Edit Access Option */}
                <div
                  onClick={() => setAssignedPermission('EDIT_ACCESS')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition duration-200 flex items-start gap-3 ${
                    assignedPermission === 'EDIT_ACCESS'
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${assignedPermission === 'EDIT_ACCESS' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">Edit Access</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">View + Edit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Recipient can view and update credential details. Cannot delete credential and cannot alter sharing permissions.
                    </p>
                  </div>
                </div>

                {/* Full Management Option */}
                <div
                  onClick={() => setAssignedPermission('FULL_MANAGEMENT')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition duration-200 flex items-start gap-3 ${
                    assignedPermission === 'FULL_MANAGEMENT'
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${assignedPermission === 'FULL_MANAGEMENT' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">Full Management</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">View + Edit + Delete + Manage Sharing</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Full administrative privileges: view, edit, delete, and alter permission levels or manage sharing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating || !selectedItem}
              className="btn-primary text-xs uppercase font-bold tracking-wider py-3 px-5 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition mt-2 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{updating ? 'Assigning Permission...' : 'Grant / Update Shared Permission'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Step 3, 4, 5 (User Accesses Credential & System Permission Checks) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Recipient Access & System Action Control Inspector */}
          <div className="glass-panel p-5 border-white/10 bg-slate-900/50 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                  Step 3-5: Recipient Access & Permission Check Simulator
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Test recipient action execution below. The system automatically validates the assigned permission level before executing every action (View, Edit, Delete, Manage Sharing).
            </p>

            {/* System Audit Result Alert Banner */}
            {systemCheckLog && (
              <div className={`p-4 rounded-xl border flex flex-col gap-2 text-xs animate-fadeIn ${
                systemCheckLog.allowed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    {systemCheckLog.allowed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>System Permission Check Result: {systemCheckLog.allowed ? 'ACTION ALLOWED' : 'ACTION DENIED'}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{systemCheckLog.timestamp}</span>
                </div>
                <div className="text-[11px] font-mono leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div>Item: <span className="text-white font-bold">{systemCheckLog.itemTitle}</span></div>
                  <div>Action: <span className="uppercase text-amber-300 font-bold">{systemCheckLog.action}</span></div>
                  <div>Permission Level: <span className="uppercase text-indigo-300 font-bold">{systemCheckLog.permissionLevel}</span></div>
                  <div className="mt-1 text-slate-300">{systemCheckLog.explanation}</div>
                </div>
              </div>
            )}

            {/* List of Vault Credentials with Interactive System Permission Action Checkers */}
            <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {vaultItems.map((item) => {
                const perm = item.permissionLevel || 'FULL_MANAGEMENT';

                return (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-950/80 border border-white/5 hover:border-indigo-500/30 transition flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{item.title}</h4>
                          <span className="text-[10px] text-slate-400">{item.username || 'No username'}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        perm === 'VIEW_ONLY'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : perm === 'EDIT_ACCESS'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {perm === 'VIEW_ONLY' ? 'View Only' : perm === 'EDIT_ACCESS' ? 'Edit Access' : 'Full Management'}
                      </span>
                    </div>

                    {/* Matrix of Actions with System Check Triggering */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5">
                      {/* View Action Button */}
                      <button
                        onClick={() => executeSystemPermissionCheck(item, 'VIEW')}
                        className="py-1.5 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
                        title="System Check: View Credential"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      {/* Edit Action Button */}
                      <button
                        onClick={() => executeSystemPermissionCheck(item, 'EDIT')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition border ${
                          perm === 'VIEW_ONLY'
                            ? 'bg-slate-900 text-slate-500 border-white/5 hover:border-rose-500/40 hover:text-rose-300'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                        }`}
                        title="System Check: Edit Credential"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => executeSystemPermissionCheck(item, 'DELETE')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition border ${
                          perm !== 'FULL_MANAGEMENT'
                            ? 'bg-slate-900 text-slate-500 border-white/5 hover:border-rose-500/40 hover:text-rose-300'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                        }`}
                        title="System Check: Delete Credential"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>

                      {/* Manage Sharing Action Button */}
                      <button
                        onClick={() => executeSystemPermissionCheck(item, 'MANAGE_SHARING')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition border ${
                          perm !== 'FULL_MANAGEMENT'
                            ? 'bg-slate-900 text-slate-500 border-white/5 hover:border-rose-500/40 hover:text-rose-300'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20'
                        }`}
                        title="System Check: Manage Sharing"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
