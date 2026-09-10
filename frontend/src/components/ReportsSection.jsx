import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  KeyRound,
  TrendingUp,
  BarChart3,
  PieChart,
  Lock,
  ArrowUpRight,
  Clock,
  User,
  Shield,
  Download,
  AlertCircle
} from 'lucide-react';
import { reportsApi } from '../utils/api';
import { calculatePasswordStrength } from '../utils/crypto';
import Swal from 'sweetalert2';

export default function ReportsSection({ token, vaultItems = [], decryptedMap = {}, isVaultUnlocked = false }) {
  const [activeReportTab, setActiveReportTab] = useState('PASSWORD_HEALTH'); // 'PASSWORD_HEALTH', 'LOGIN_ACTIVITY'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passwordHealthData, setPasswordHealthData] = useState(null);
  const [loginActivityData, setLoginActivityData] = useState(null);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const [passRes, loginRes] = await Promise.all([
        reportsApi.getPasswordHealth(token).catch(() => null),
        reportsApi.getLoginActivity(token).catch(() => null),
      ]);

      setPasswordHealthData(passRes);
      setLoginActivityData(loginRes);
    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Reports Data Refreshed',
      showConfirmButton: false,
      timer: 2000,
      background: '#0f172a',
      color: '#f1f5f9',
    });
  };

  // Compute live client password health if vault is unlocked
  const clientPasswordMetrics = useMemo(() => {
    if (!vaultItems || vaultItems.length === 0) {
      return {
        total: 0,
        strong: 0,
        medium: 0,
        weak: 0,
        healthScore: 100,
        summary: 'No Credentials Available'
      };
    }

    let strong = 0;
    let medium = 0;
    let weak = 0;
    let scoreSum = 0;
    let count = 0;

    for (const item of vaultItems) {
      const secret = decryptedMap[item.id];
      if (secret) {
        const str = calculatePasswordStrength(secret);
        scoreSum += str.score;
        count++;
        if (str.label === 'Strong' || str.label === 'Very Strong') {
          strong++;
        } else if (str.label === 'Moderate' || str.label === 'Medium') {
          medium++;
        } else {
          weak++;
        }
      }
    }

    if (count === 0) {
      // Fallback to backend API data or default structure
      if (passwordHealthData) {
        return {
          total: passwordHealthData.totalCredentials || vaultItems.length,
          strong: passwordHealthData.strongCount || 0,
          medium: passwordHealthData.mediumCount || 0,
          weak: passwordHealthData.weakCount || 0,
          healthScore: passwordHealthData.healthScore || 85,
          summary: passwordHealthData.summary || 'Password Health Analyzed'
        };
      }
      return {
        total: vaultItems.length,
        strong: 0,
        medium: 0,
        weak: 0,
        healthScore: 85,
        summary: 'Unlock Vault for Full Precision'
      };
    }

    const healthScore = Math.round(scoreSum / count);
    let summary = 'Excellent Password Health';
    if (healthScore < 60) summary = 'Action Required - High Risk Passwords Found';
    else if (healthScore < 80) summary = 'Good Password Health - Weak/Medium Passwords Need Updating';

    return {
      total: vaultItems.length,
      strong,
      medium,
      weak,
      healthScore,
      summary
    };
  }, [vaultItems, decryptedMap, passwordHealthData]);

  // Combined stats
  const finalHealth = (isVaultUnlocked && decryptedMap && Object.keys(decryptedMap).length > 0)
    ? clientPasswordMetrics
    : {
      total: passwordHealthData?.totalCredentials ?? vaultItems.length,
      strong: passwordHealthData?.strongCount ?? 0,
      medium: passwordHealthData?.mediumCount ?? 0,
      weak: passwordHealthData?.weakCount ?? 0,
      healthScore: passwordHealthData?.healthScore ?? 85,
      summary: passwordHealthData?.summary ?? 'Password Health Report Ready'
    };

  const finalLogin = {
    totalAttempts: loginActivityData?.totalAttempts ?? 0,
    successfulLogins: loginActivityData?.successfulLogins ?? 0,
    failedLogins: loginActivityData?.failedLogins ?? 0,
    successRate: loginActivityData?.successRate ?? 100.0,
    recentActivities: loginActivityData?.recentActivities ?? []
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Security Reports
              </span>
              <span className="text-xs text-slate-400">• PostgreSQL & Spring Boot Engine</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-wide mt-1">
              Password Health & Login Activity Reports
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Real-time analytics evaluating vault credential strength and authentication activity logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs py-2.5 px-4 border border-white/10 flex items-center gap-2 hover:border-indigo-500/30 transition shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveReportTab('PASSWORD_HEALTH')}
            className={`justify-center py-2 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 sm:gap-2 shrink-0 ${
              activeReportTab === 'PASSWORD_HEALTH'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-md'
                : 'text-slate-400 border-white/5 bg-slate-900/40 sm:bg-transparent hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Password Health Report</span>
          </button>

          <button
            onClick={() => setActiveReportTab('LOGIN_ACTIVITY')}
            className={`justify-center py-2 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 sm:gap-2 shrink-0 ${
              activeReportTab === 'LOGIN_ACTIVITY'
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-md'
                : 'text-slate-400 border-white/5 bg-slate-900/40 sm:bg-transparent hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Login Activity Report</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium shrink-0">
          Source: <span className="text-slate-200 font-bold">PostgreSQL Database</span>
        </div>
      </div>

      {loading && !passwordHealthData && !loginActivityData ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-300">Generating Password Health & Login Activity Reports...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* 1. PASSWORD HEALTH REPORT SECTION */}
          {activeReportTab === 'PASSWORD_HEALTH' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                      1. Password Health Report
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Workflow: Credentials → Password Strength Analysis → Calculate Summary → Password Health Report
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                    finalHealth.healthScore >= 80
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : finalHealth.healthScore >= 60
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {finalHealth.summary}
                  </span>
                </div>
              </div>

              {/* Password Health Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Total Credentials */}
                <div className="glass-panel p-4 flex flex-col justify-between border-white/[0.06] bg-slate-900/60 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credentials</span>
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-white font-mono">{finalHealth.total}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Available in Vault</div>
                  </div>
                </div>

                {/* Strong Passwords */}
                <div className="glass-panel p-4 flex flex-col justify-between border-emerald-500/20 bg-emerald-500/[0.02] shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Strong Passwords</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-emerald-300 font-mono">{finalHealth.strong}</div>
                    <div className="text-[10px] text-emerald-500/80 mt-1">High Security Level</div>
                  </div>
                </div>

                {/* Medium Passwords */}
                <div className="glass-panel p-4 flex flex-col justify-between border-amber-500/20 bg-amber-500/[0.02] shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Medium Passwords</span>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-amber-300 font-mono">{finalHealth.medium}</div>
                    <div className="text-[10px] text-amber-500/80 mt-1">Moderate Security Level</div>
                  </div>
                </div>

                {/* Weak Passwords */}
                <div className="glass-panel p-4 flex flex-col justify-between border-rose-500/20 bg-rose-500/[0.02] shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Weak Passwords</span>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-rose-300 font-mono">{finalHealth.weak}</div>
                    <div className="text-[10px] text-rose-500/80 mt-1">Requires Strength Upgrade</div>
                  </div>
                </div>

                {/* Health Score % */}
                <div className="glass-panel p-4 flex flex-col justify-between border-cyan-500/20 bg-cyan-500/[0.02] shadow-lg relative overflow-hidden col-span-2 sm:col-span-1 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Health Score</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-cyan-300 font-mono">{finalHealth.healthScore}%</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, finalHealth.healthScore))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Breakdown Visualization & Detailed Summary Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="glass-panel p-5 lg:col-span-2 border-white/[0.05] bg-slate-900/40 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-400" />
                    <span>Password Strength Distribution Analysis</span>
                  </h3>

                  {finalHealth.total === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No vault credentials available to display distribution.</p>
                  ) : (
                    <div className="flex flex-col gap-3 py-2">
                      {/* Strong Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-emerald-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Strong Passwords
                          </span>
                          <span className="text-slate-300 font-mono">
                            {finalHealth.strong} ({finalHealth.total > 0 ? Math.round((finalHealth.strong / finalHealth.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-500"
                            style={{ width: `${finalHealth.total > 0 ? (finalHealth.strong / finalHealth.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Medium Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-amber-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Medium Passwords
                          </span>
                          <span className="text-slate-300 font-mono">
                            {finalHealth.medium} ({finalHealth.total > 0 ? Math.round((finalHealth.medium / finalHealth.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="bg-amber-400 h-full transition-all duration-500"
                            style={{ width: `${finalHealth.total > 0 ? (finalHealth.medium / finalHealth.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Weak Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-rose-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Weak Passwords
                          </span>
                          <span className="text-slate-300 font-mono">
                            {finalHealth.weak} ({finalHealth.total > 0 ? Math.round((finalHealth.weak / finalHealth.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="bg-rose-400 h-full transition-all duration-500"
                            style={{ width: `${finalHealth.total > 0 ? (finalHealth.weak / finalHealth.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel p-5 border-white/[0.05] bg-slate-900/40 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Password Health Summary</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluated using the Milestone 2 Password Strength Checker algorithm (analyzing length, uppercase, lowercase, digits, and symbols).
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                        <span className="text-slate-400">Total Analyzed</span>
                        <span className="font-bold text-slate-100 font-mono">{finalHealth.total} Credentials</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                        <span className="text-slate-400">Health Index</span>
                        <span className="font-bold text-emerald-400 font-mono">{finalHealth.healthScore}%</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 text-xs">
                        <span className="text-slate-400">Status</span>
                        <span className="font-bold text-indigo-300">{finalHealth.summary}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500">
                    Calculated dynamically from PostgreSQL database records.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. LOGIN ACTIVITY REPORT SECTION */}
          {activeReportTab === 'LOGIN_ACTIVITY' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                      2. Login Activity Report
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Workflow: Login Logs → Analyze Login Activity → Calculate Statistics → Login Activity Report
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    Success Rate: {finalLogin.successRate}%
                  </span>
                </div>
              </div>

              {/* Login Activity Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Attempts */}
                <div className="glass-panel p-4 flex flex-col justify-between border-white/[0.06] bg-slate-900/60 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Attempts</span>
                    <Activity className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-white font-mono">{finalLogin.totalAttempts}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Recorded Authentication Log Entries</div>
                  </div>
                </div>

                {/* Successful Logins */}
                <div className="glass-panel p-4 flex flex-col justify-between border-emerald-500/20 bg-emerald-500/[0.02] shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Successful Logins</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-emerald-300 font-mono">{finalLogin.successfulLogins}</div>
                    <div className="text-[10px] text-emerald-500/80 mt-1">Authenticated Successfully</div>
                  </div>
                </div>

                {/* Failed Logins */}
                <div className="glass-panel p-4 flex flex-col justify-between border-rose-500/20 bg-rose-500/[0.02] shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Failed Logins</span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-rose-300 font-mono">{finalLogin.failedLogins}</div>
                    <div className="text-[10px] text-rose-500/80 mt-1">Rejected / Invalid Password</div>
                  </div>
                </div>

                {/* Authentication Success Rate */}
                <div className="glass-panel p-4 flex flex-col justify-between border-indigo-500/20 bg-indigo-500/[0.02] shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Authentication Rate</span>
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-indigo-300 font-mono">{finalLogin.successRate}%</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, finalLogin.successRate))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Login Activities Table */}
              <div className="glass-panel p-5 border-white/[0.06] bg-slate-900/40 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Recent Login Activities Log</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Showing top <span className="font-bold text-white">{finalLogin.recentActivities.length}</span> recent logs
                  </span>
                </div>

                {finalLogin.recentActivities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No login activity logs recorded in database yet.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar w-full">
                      <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-white/[0.02] whitespace-nowrap">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Identifier / Email</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Activity Description</th>
                            <th className="py-3 px-4">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {finalLogin.recentActivities.map((log, index) => {
                            const statusUpper = String(log.loginStatus || log.status || '').toUpperCase();
                            const isSuccess = statusUpper === 'SUCCESS';
                            return (
                              <tr key={log.id || index} className="hover:bg-white/[0.02] transition">
                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{index + 1}</td>
                                <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">{log.email || log.username || 'System User'}</td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                    isSuccess
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}>
                                    {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                                    <span>{isSuccess ? 'Success' : 'Failed'}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-300 min-w-[180px]">{log.activity}</td>
                                <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card Box View */}
                    <div className="flex flex-col gap-3 p-1 md:hidden">
                      {finalLogin.recentActivities.map((log, index) => {
                        const statusUpper = String(log.loginStatus || log.status || '').toUpperCase();
                        const isSuccess = statusUpper === 'SUCCESS';
                        return (
                          <div key={log.id || index} className="p-4 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-2.5 shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                                #{index + 1}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                isSuccess
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}>
                                {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                                <span>{isSuccess ? 'Success' : 'Failed'}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <User className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span className="truncate">{log.email || log.username || 'System User'}</span>
                            </div>

                            <div className="text-xs text-slate-300 font-medium bg-slate-900/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                              {log.activity}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                              <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
