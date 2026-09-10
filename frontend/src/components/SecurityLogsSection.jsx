import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  User,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
  Database,
  Trash2,
  Bell,
  AlertTriangle,
  FileText,
  Eye,
  Check,
  BarChart2,
  PieChart,
  TrendingUp,
  Shield
} from 'lucide-react';
import { securityApi } from '../utils/api';
import Swal from 'sweetalert2';

export default function SecurityLogsSection({ token, user }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'alerts', 'suspicious', 'audit', 'login_logs'

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchAllData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [analyticsRes, alertsRes, suspiciousRes, auditRes, loginLogsRes] = await Promise.all([
        securityApi.getAnalytics(token).catch(() => null),
        securityApi.getAlerts(token).catch(() => []),
        securityApi.getSuspiciousActivities(token).catch(() => []),
        securityApi.getAuditLogs(token).catch(() => []),
        securityApi.getLogs(token).catch(() => [])
      ]);

      setAnalytics(analyticsRes);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setSuspicious(Array.isArray(suspiciousRes) ? suspiciousRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
      setLoginLogs(Array.isArray(loginLogsRes) ? loginLogsRes : []);
    } catch (err) {
      console.warn('Failed to fetch security analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Security Analytics Updated',
      showConfirmButton: false,
      timer: 2000,
      background: '#0f172a',
      color: '#f1f5f9',
    });
  };

  const handleMarkAlertRead = async (id) => {
    try {
      await securityApi.markAlertRead(id, token);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'READ' } : a));
      if (analytics) {
        setAnalytics(prev => prev ? { ...prev, unreadAlertsCount: Math.max(0, prev.unreadAlertsCount - 1) } : prev);
      }
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Alert marked as read',
        showConfirmButton: false,
        timer: 1500,
        background: '#0f172a',
        color: '#f1f5f9',
      });
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleClearLogs = async () => {
    const result = await Swal.fire({
      title: 'Clear Login Security Logs?',
      text: 'Are you sure you want to delete all your login activity log data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Yes, Clear All Logs',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (result.isConfirmed) {
      try {
        setClearing(true);
        await securityApi.clearLogs(token);
        setLoginLogs([]);
        if (analytics) {
          setAnalytics(prev => prev ? { ...prev, totalLogins: 0, successfulLogins: 0, failedLogins: 0, successRatePercentage: 100 } : prev);
        }
        Swal.fire({
          icon: 'success',
          title: 'Logs Cleared',
          text: 'Your security activity logs have been deleted.',
          background: '#0f172a',
          color: '#f1f5f9',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Clear Logs',
          text: err.message || 'An error occurred while clearing logs.',
          background: '#0f172a',
          color: '#f1f5f9',
        });
      } finally {
        setClearing(false);
      }
    }
  };

  const handleDeleteLog = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Log Entry?',
      text: 'Are you sure you want to delete this specific log entry?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Delete Entry',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (result.isConfirmed) {
      try {
        await securityApi.deleteLog(id, token);
        setLoginLogs(prev => prev.filter(l => l.id !== id));
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Log Entry Deleted',
          showConfirmButton: false,
          timer: 2000,
          background: '#0f172a',
          color: '#f1f5f9',
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Deletion Failed',
          text: err.message || 'Could not delete log entry.',
          background: '#0f172a',
          color: '#f1f5f9',
        });
      }
    }
  };

  // Metrics derived from analytics DTO or local arrays
  const totalLogins = analytics?.totalLogins ?? loginLogs.length;
  const successfulLogins = analytics?.successfulLogins ?? loginLogs.filter(l => (l.loginStatus || l.status) === 'SUCCESS').length;
  const failedLogins = analytics?.failedLogins ?? loginLogs.filter(l => (l.loginStatus || l.status) === 'FAILED').length;
  const successRate = analytics?.successRatePercentage ?? (totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 100);

  const suspiciousCount = analytics?.suspiciousActivitiesCount ?? suspicious.length;
  const flaggedSuspiciousCount = analytics?.flaggedSuspiciousCount ?? suspicious.filter(s => s.status === 'FLAGGED').length;

  const totalAlertsCount = analytics?.totalAlertsCount ?? alerts.length;
  const unreadAlertsCount = analytics?.unreadAlertsCount ?? alerts.filter(a => a.status === 'UNREAD').length;
  const highSeverityAlertsCount = analytics?.highSeverityAlertsCount ?? alerts.filter(a => a.severity === 'HIGH').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Combine recent activities for the unified activity feed
  const unifiedRecentActivities = React.useMemo(() => {
    const combined = [];

    (analytics?.recentSecurityAlerts || alerts).forEach(item => {
      combined.push({
        id: `alert-${item.id}`,
        type: 'ALERT',
        title: item.message || 'Security Alert',
        subtitle: `Severity: ${item.severity || 'HIGH'} | Status: ${item.status}`,
        user: item.email,
        timestamp: item.createdAt,
        severity: item.severity
      });
    });

    (analytics?.recentSuspiciousActivities || suspicious).forEach(item => {
      combined.push({
        id: `suspicious-${item.id}`,
        type: 'SUSPICIOUS',
        title: item.activityType || 'Suspicious Activity Detected',
        subtitle: item.description,
        user: item.email,
        timestamp: item.detectedAt,
        severity: 'HIGH'
      });
    });

    (analytics?.recentAuditLogs || auditLogs).forEach(item => {
      combined.push({
        id: `audit-${item.id}`,
        type: 'AUDIT',
        title: item.action || 'System Audit',
        subtitle: item.description,
        user: item.email,
        timestamp: item.timestamp,
        severity: item.action?.includes('Failed') ? 'MEDIUM' : 'LOW'
      });
    });

    (analytics?.recentLoginActivities || loginLogs).forEach(item => {
      const status = item.loginStatus || item.status;
      combined.push({
        id: `login-${item.id || item.slNo}`,
        type: 'LOGIN',
        title: `Login Attempt (${status})`,
        subtitle: item.activity || `Login status: ${status}`,
        user: item.email || item.username,
        timestamp: item.timestamp || item.dateAndTime,
        severity: status === 'FAILED' ? 'HIGH' : 'LOW',
        status: status
      });
    });

    // Sort descending by timestamp
    return combined.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    }).slice(0, 12);
  }, [analytics, alerts, suspicious, auditLogs, loginLogs]);

  // Donut chart math calculation - All Security Activity Breakdown
  const activitySlices = React.useMemo(() => {
    const auditLogsCount = analytics?.recentAuditLogs?.length ?? auditLogs.length;

    const rawSlices = [
      {
        label: 'Successful Logins',
        value: successfulLogins,
        color: '#10b981',
        bgBorder: 'border-emerald-500/20',
        textColor: 'text-emerald-400',
        dotBg: 'bg-emerald-500'
      },
      {
        label: 'Failed Logins',
        value: failedLogins,
        color: '#f43f5e',
        bgBorder: 'border-rose-500/20',
        textColor: 'text-rose-400',
        dotBg: 'bg-rose-500'
      },
      {
        label: 'Suspicious Events',
        value: suspiciousCount,
        color: '#f59e0b',
        bgBorder: 'border-amber-500/20',
        textColor: 'text-amber-400',
        dotBg: 'bg-amber-500'
      },
      {
        label: 'Security Alerts',
        value: totalAlertsCount,
        color: '#8b5cf6',
        bgBorder: 'border-purple-500/20',
        textColor: 'text-purple-400',
        dotBg: 'bg-purple-500'
      },
      {
        label: 'Audit Logs',
        value: auditLogsCount,
        color: '#06b6d4',
        bgBorder: 'border-cyan-500/20',
        textColor: 'text-cyan-400',
        dotBg: 'bg-cyan-500'
      }
    ];

    const total = rawSlices.reduce((sum, item) => sum + item.value, 0);

    const CIRCUMFERENCE = 282.743; // 2 * Math.PI * 45 radius
    let accumulatedOffset = 0;

    const slices = rawSlices.map(slice => {
      const percentage = total > 0 ? (slice.value / total) * 100 : 0;
      const strokeLength = total > 0 ? (slice.value / total) * CIRCUMFERENCE : 0;
      const strokeDasharray = `${strokeLength} ${CIRCUMFERENCE - strokeLength}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        ...slice,
        percentage: Math.round(percentage * 10) / 10,
        strokeDasharray,
        strokeDashoffset
      };
    });

    return { total, slices };
  }, [successfulLogins, failedLogins, suspiciousCount, totalAlertsCount, analytics, auditLogs]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Hero Banner Header */}
      <div className="glass-panel p-6 border-indigo-500/20 bg-indigo-950/20 shadow-premium relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">Security Analytics Dashboard</h2>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PostgreSQL → REST API Live Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of authentication events, suspicious login detection, security alert triggers, and system audit trails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs py-2 px-3.5 border border-white/10 flex items-center gap-2 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{refreshing ? 'Syncing DB...' : 'Refresh Analytics'}</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Summary Cards (2-by-2 Layout on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Logins */}
        <div className="glass-panel p-3.5 sm:p-4 border-indigo-500/20 bg-indigo-500/[0.03] flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Total Logins
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-400 font-mono mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span>{totalLogins}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">Events</span>
          </div>
        </div>

        {/* Successful Logins */}
        <div className="glass-panel p-3.5 sm:p-4 border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Successful
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span>{successfulLogins}</span>
            <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded-full">
              {successRate}%
            </span>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="glass-panel p-3.5 sm:p-4 border-rose-500/20 bg-rose-500/[0.03] flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Failed Logins
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span>{failedLogins}</span>
            {failedLogins > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                Attention
              </span>
            )}
          </div>
        </div>

        {/* Suspicious Activities */}
        <div className="glass-panel p-3.5 sm:p-4 border-amber-500/20 bg-amber-500/[0.03] flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Suspicious
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span>{suspiciousCount}</span>
            {flaggedSuspiciousCount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 sm:px-2 py-0.5 rounded-full">
                {flaggedSuspiciousCount} Flagged
              </span>
            )}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="glass-panel p-3.5 sm:p-4 border-rose-500/30 bg-rose-500/[0.04] flex flex-col justify-between col-span-2 sm:col-span-1 lg:col-span-1">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Security Alerts
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <span>{totalAlertsCount}</span>
            {unreadAlertsCount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {unreadAlertsCount} Unread
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security Navigation Sub-Tabs (2-by-2 Grid Layout on Mobile) */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center border-b border-white/10 gap-2 sm:overflow-x-auto sm:custom-scrollbar pb-2 sm:pb-1 shrink-0">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`col-span-2 sm:col-span-1 justify-center sm:justify-start py-2.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'overview'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-white/5 bg-slate-900/40 sm:bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Analytics Overview & Visuals</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`col-span-1 justify-center sm:justify-start py-2.5 px-2.5 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'alerts'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-white/5 bg-slate-900/40 sm:bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span className="truncate">Security Alerts</span>
          {unreadAlertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('suspicious')}
          className={`col-span-1 justify-center sm:justify-start py-2.5 px-2.5 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'suspicious'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-white/5 bg-slate-900/40 sm:bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="truncate">Suspicious Activity</span>
          {flaggedSuspiciousCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`col-span-1 justify-center sm:justify-start py-2.5 px-2.5 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'audit'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-white/5 bg-slate-900/40 sm:bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('login_logs')}
          className={`col-span-1 justify-center sm:justify-start py-2.5 px-2.5 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'login_logs'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-white/5 bg-slate-900/40 sm:bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate">Login Activity Logs</span>
        </button>
      </div>

      {/* TAB CONTENT 0: ANALYTICS OVERVIEW & VISUAL CHARTS */}
      {activeSubTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Charts & Visual Indicators Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Visual Chart 1: Donut Chart - All Security Activity Breakdown */}
            <div className="glass-panel p-5 border-white/10 bg-slate-900/60 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">All Activity Breakdown</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{activitySlices.total} Total Events</span>
              </div>

              <div className="py-5 flex items-center justify-center relative">
                {/* SVG Donut Chart */}
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#1e293b"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Dynamic Multi-Slice Segments */}
                  {activitySlices.total > 0 && activitySlices.slices.map((slice, idx) => (
                    slice.value > 0 && (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="45"
                        stroke={slice.color}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-700 ease-out"
                      />
                    )
                  ))}
                </svg>

                {/* Donut Inner Label */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-white font-mono tracking-tight">{activitySlices.total}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Events</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs">
                {activitySlices.slices.map((slice, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/50 border ${slice.bgBorder} ${
                      idx === 4 ? 'col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`w-2.5 h-2.5 rounded-full ${slice.dotBg} shrink-0`} />
                      <span className="text-[10px] text-slate-300 font-medium truncate">{slice.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`font-bold ${slice.textColor} font-mono text-[11px]`}>{slice.value}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({slice.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Chart 2: Threat Severity & Distribution Bar Chart */}
            <div className="glass-panel p-5 border-white/10 bg-slate-900/60 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">Threat & Alert Distribution</h3>
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold">{totalAlertsCount + suspiciousCount} Events</span>
              </div>

              <div className="py-4 flex flex-col gap-3">
                {/* High Severity Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> High Severity Alerts
                    </span>
                    <span className="font-mono text-rose-400 font-bold">{highSeverityAlertsCount}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (highSeverityAlertsCount / Math.max(1, totalAlertsCount + suspiciousCount)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Flagged Suspicious Activity Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Suspicious Login Detection
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{suspiciousCount}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (suspiciousCount / Math.max(1, totalAlertsCount + suspiciousCount)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Unread Alerts Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" /> Unread Alerts
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">{unreadAlertsCount}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (unreadAlertsCount / Math.max(1, totalAlertsCount + suspiciousCount)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Summary Banner */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Spring Security Monitoring</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Automated Rules Active
                </span>
              </div>
            </div>

            {/* Visual Card 3: Security System Health & Live Indicator */}
            <div className="glass-panel p-5 border-white/10 bg-slate-900/60 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">System Threat Status</h3>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live
                </span>
              </div>

              <div className="py-4 flex flex-col gap-3">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  unreadAlertsCount > 0
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  {unreadAlertsCount > 0 ? (
                    <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs">
                      {unreadAlertsCount > 0 ? `${unreadAlertsCount} Unread Security Alerts!` : 'All Security Systems Operational'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {unreadAlertsCount > 0
                        ? 'Review security alerts tab for detailed threat reports.'
                        : 'No active unhandled security anomalies detected.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Database Sync</span>
                    <span className="font-bold text-indigo-300 font-mono text-xs">PostgreSQL Active</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Audit Logging</span>
                    <span className="font-bold text-emerald-300 font-mono text-xs">ENABLED</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center font-mono">
                Data pipeline: PostgreSQL DB → Spring Boot REST API → React Dashboard
              </div>
            </div>
          </div>

          {/* Unified Recent Security & Audit Activity Feed */}
          <div className="glass-panel border-white/10 bg-slate-900/50 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Recent Security & Audit Feed</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Showing Top {unifiedRecentActivities.length} Chronological Activities</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading Activity Stream...
              </div>
            ) : unifiedRecentActivities.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
                No activity recorded yet. Perform login or security actions to generate live data feeds.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {unifiedRecentActivities.map((act) => {
                  const isAlert = act.type === 'ALERT';
                  const isSuspicious = act.type === 'SUSPICIOUS';
                  const isAudit = act.type === 'AUDIT';
                  const isLogin = act.type === 'LOGIN';

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-white/[0.04] bg-slate-950/60 hover:bg-slate-950/90 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 border ${
                          isAlert
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : isSuspicious
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : isAudit
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                            : act.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isAlert && <Bell className="w-4 h-4" />}
                          {isSuspicious && <AlertTriangle className="w-4 h-4" />}
                          {isAudit && <FileText className="w-4 h-4" />}
                          {isLogin && (act.status === 'FAILED' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white">{act.title}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isAlert
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : isSuspicious
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : isAudit
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                            }`}>
                              {act.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{act.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4 text-[11px] text-slate-400 font-mono w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {act.user && (
                          <span className="flex items-center gap-1.5 text-slate-400 max-w-full">
                            <User className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">{act.user}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                          <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{formatDate(act.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: SECURITY ALERTS */}
      {activeSubTab === 'alerts' && (
        <div className="glass-panel border-white/10 bg-slate-900/50 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Generated Security Alerts</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{alerts.length} Total Alerts</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading Security Alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl bg-slate-950/40">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-70" />
              <span>No security alerts detected. Your account activity is normal and secure.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {alerts.map((alert) => {
                const isUnread = alert.status === 'UNREAD';
                const isHigh = alert.severity === 'HIGH';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isUnread
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-lg'
                        : 'bg-slate-950/60 border-white/5 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">{alert.message || 'Security Alert'}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            isHigh ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            Severity: {alert.severity || 'HIGH'}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isUnread ? 'bg-rose-600 text-white font-extrabold animate-pulse' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Status: {alert.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-slate-400">
                            <User className="w-3 h-3 text-indigo-400" /> User: {alert.email}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-400">
                            <Clock className="w-3 h-3 text-indigo-400" /> Time: {formatDate(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAlertRead(alert.id)}
                        className="btn-secondary text-[11px] py-1.5 px-3 border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mark as Read</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: SUSPICIOUS ACTIVITY */}
      {activeSubTab === 'suspicious' && (
        <div className="glass-panel border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Detected Suspicious Activities Log</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{suspicious.length} Entries</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading Suspicious Activities...
            </div>
          ) : suspicious.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No suspicious activities flagged. System threshold rules monitor failed logins and authorization anomalies.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar w-full">
                <table className="w-full min-w-[640px] text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">Detected Date & Time</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {suspicious.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{item.activityType || 'Multiple Failed Logins'}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-300 min-w-[200px]">{item.description}</td>
                        <td className="py-3 px-4 font-mono text-indigo-300 whitespace-nowrap">{item.email}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">{formatDate(item.detectedAt)}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>{item.status || 'Flagged'}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Box View */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {suspicious.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 flex flex-col gap-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{item.activityType || 'Multiple Failed Logins'}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>{item.status || 'Flagged'}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                      {item.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 flex-wrap gap-2">
                      <span className="font-mono text-indigo-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-400" /> {item.email}
                      </span>
                      <span className="font-mono text-slate-400 flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-indigo-400" /> {formatDate(item.detectedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="glass-panel border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">System Audit Logs</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{auditLogs.length} Records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading Audit Logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit logs recorded yet. System activities generate structured audit records in PostgreSQL.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar w-full">
                <table className="w-full min-w-[640px] text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {auditLogs.map((log) => {
                      const isAlertAction = log.action && (log.action.includes('Alert') || log.action.includes('Suspicious'));
                      const isFailAction = log.action && log.action.includes('Failed');
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isAlertAction
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : isFailAction
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200 min-w-[200px]">{log.description}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">{log.email}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 text-right whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Box View */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {auditLogs.map((log) => {
                  const isAlertAction = log.action && (log.action.includes('Alert') || log.action.includes('Suspicious'));
                  const isFailAction = log.action && log.action.includes('Failed');
                  return (
                    <div key={log.id} className="p-4 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isAlertAction
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : isFailAction
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> {formatDate(log.timestamp)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                        {log.description}
                      </div>

                      <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-white/5">
                        <User className="w-3 h-3 text-indigo-400" /> {log.email}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: SECURITY LOGIN ACTIVITY LOG */}
      {activeSubTab === 'login_logs' && (
        <div className="glass-panel border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Login Activity Log</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">{loginLogs.length} Entries</span>
              {loginLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  disabled={clearing}
                  className="text-xs py-1.5 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 flex items-center gap-1.5 transition disabled:opacity-50 font-semibold shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{clearing ? 'Clearing...' : 'Clear All Logs'}</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-indigo-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading Login Security Activity Logs...</span>
            </div>
          ) : loginLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No login activity logs recorded yet. Log in or attempt authentication to populate security logs.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar w-full">
                <table className="w-full min-w-[640px] text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
                      <th className="py-3 px-4 w-16">SL. No</th>
                      <th className="py-3 px-4">Username / Email</th>
                      <th className="py-3 px-4">Login Activity</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Status</th>
                      <th className="py-3 px-4 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loginLogs.map((log) => {
                      const statusVal = log.loginStatus || log.status;
                      const isSuccess = statusVal === 'SUCCESS';
                      const displayEmail = log.email || log.username;
                      const displayDate = log.dateAndTime || log.timestamp;
                      return (
                        <tr key={log.id || log.slNo} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 font-mono text-slate-400 font-semibold whitespace-nowrap">{log.slNo}</td>
                          <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{displayEmail}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200 min-w-[180px]">{log.activity}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">{displayDate}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                              <span>{statusVal}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-slate-400 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-rose-500/10 inline-flex items-center justify-center"
                              title="Delete Log Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Box View */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {loginLogs.map((log) => {
                  const statusVal = log.loginStatus || log.status;
                  const isSuccess = statusVal === 'SUCCESS';
                  const displayEmail = log.email || log.username;
                  const displayDate = log.dateAndTime || log.timestamp;
                  return (
                    <div key={log.id || log.slNo} className="p-4 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-2.5 shadow-lg relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                            #{log.slNo}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                            <span>{statusVal}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-slate-400 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-rose-500/10"
                          title="Delete Log Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">{displayEmail}</span>
                      </div>

                      <div className="text-xs text-slate-300 font-medium bg-slate-900/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                        {log.activity}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                        <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{displayDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
