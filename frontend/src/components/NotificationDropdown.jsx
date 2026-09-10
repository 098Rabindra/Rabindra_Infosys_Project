import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  Share2,
  Key,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../utils/api';

export default function NotificationDropdown() {
  const { token, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingExpirations, setCheckingExpirations] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, SECURITY, SHARING
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token || !isAuthenticated) return;
    try {
      const data = await notificationApi.getNotifications(token);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
      const countRes = await notificationApi.getUnreadCount(token);
      if (countRes && typeof countRes.unreadCount === 'number') {
        setUnreadCount(countRes.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // poll every 10s

      const handleCustomUpdate = () => fetchNotifications();
      window.addEventListener('notification-updated', handleCustomUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('notification-updated', handleCustomUpdate);
      };
    }
  }, [token, isAuthenticated]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await notificationApi.markRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await notificationApi.markAllRead(token);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleCheckExpirations = async () => {
    if (!token || checkingExpirations) return;
    setCheckingExpirations(true);
    try {
      await notificationApi.checkExpirations(token);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to run expiration check:', err);
    } finally {
      setCheckingExpirations(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'LOGIN_SUCCESS':
        return <Lock className="w-4 h-4 text-emerald-400" />;
      case 'FAILED_LOGIN':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'CREDENTIAL_SHARED':
        return <Share2 className="w-4 h-4 text-cyan-400" />;
      case 'PASSWORD_EXPIRATION':
        return <Key className="w-4 h-4 text-amber-400" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getBadgeStyle = (type) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'LOGIN_SUCCESS':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'FAILED_LOGIN':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'CREDENTIAL_SHARED':
        return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
      case 'PASSWORD_EXPIRATION':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'SUSPICIOUS_ACTIVITY':
        return 'bg-rose-600/10 border-rose-600/20 text-rose-300';
      default:
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !(n.isRead || n.read);
    const nType = (n.type || '').toUpperCase();
    if (filter === 'UNREAD') return isUnread;
    if (filter === 'SECURITY') return ['LOGIN_SUCCESS', 'FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY'].includes(nType);
    if (filter === 'SHARING') return nType === 'CREDENTIAL_SHARED';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition duration-150 border border-white/5 hover:border-white/15 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-[10px] font-extrabold text-white shadow-md shadow-rose-500/30 animate-pulse border border-slate-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 shadow-2xl shadow-slate-950/80 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-slate-800/50 bg-slate-950/20 flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: `Unread (${unreadCount})` },
              { id: 'SECURITY', label: 'Security' },
              { id: 'SHARING', label: 'Sharing' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-800/40 flex-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No notifications found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {filter === 'UNREAD'
                    ? "You've read all your notifications!"
                    : 'Your notification center is completely up to date.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isRead = notification.isRead || notification.read;
                return (
                  <div
                    key={notification.id}
                    className={`p-3.5 transition duration-150 flex items-start gap-3 relative ${
                      isRead ? 'bg-transparent opacity-75 hover:opacity-100 hover:bg-white/[0.02]' : 'bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08]'
                    }`}
                  >
                    {/* Status Dot */}
                    {!isRead && (
                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    )}

                    {/* Icon Badge */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getBadgeStyle(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`text-xs font-semibold truncate ${isRead ? 'text-slate-300' : 'text-slate-100 font-bold'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                        {notification.message}
                      </p>
                    </div>

                    {/* Mark as read action */}
                    {!isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition self-center"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={handleCheckExpirations}
              disabled={checkingExpirations}
              className="text-[11px] text-slate-300 hover:text-indigo-400 font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              title="Run a password health & expiration scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${checkingExpirations ? 'animate-spin' : ''}`} />
              <span>{checkingExpirations ? 'Scanning passwords...' : 'Scan Password Health'}</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              SecureVault System
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
