import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import SessionTimeoutModal from './SessionTimeoutModal';
import Swal from 'sweetalert2';

const IDLE_TIME_MS = 60 * 1000; // 1 minute of no activity
const COUNTDOWN_SECONDS = 10;   // 10 seconds warning countdown

export default function IdleSessionManager({ children }) {
  const { isAuthenticated, logout } = useAuth();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const idleTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastResetTimeRef = useRef(Date.now());

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const performAutoLogout = useCallback(() => {
    clearAllTimers();
    setIsWarningOpen(false);

    logout();

    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'You were automatically logged out due to 1 minute of inactivity for vault security.',
      background: '#0f172a',
      color: '#f1f5f9',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'swal-logout-yes-btn',
      },
      buttonsStyling: false,
    });
  }, [logout, clearAllTimers]);

  const startCountdown = useCallback(() => {
    setIsWarningOpen(true);
    setSecondsLeft(COUNTDOWN_SECONDS);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let currentSec = COUNTDOWN_SECONDS;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      setSecondsLeft(currentSec);

      if (currentSec <= 0) {
        clearInterval(countdownIntervalRef.current);
        performAutoLogout();
      }
    }, 1000);
  }, [performAutoLogout]);

  const resetIdleTimer = useCallback(() => {
    clearAllTimers();
    setIsWarningOpen(false);
    setSecondsLeft(COUNTDOWN_SECONDS);

    // Set 1 minute idle timer
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, IDLE_TIME_MS);
  }, [clearAllTimers, startCountdown]);

  // Activity listener callback (throttled to max 1 update per second)
  const handleUserActivity = useCallback(() => {
    if (!isAuthenticated) return;
    const now = Date.now();
    if (now - lastResetTimeRef.current > 1000) {
      lastResetTimeRef.current = now;
      resetIdleTimer();
    }
  }, [isAuthenticated, resetIdleTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setIsWarningOpen(false);
      return;
    }

    // Initialize 1-minute inactivity timer
    resetIdleTimer();

    // Attach activity listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'keypress', 'touchstart', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isAuthenticated, resetIdleTimer, handleUserActivity, clearAllTimers]);

  return (
    <>
      {children}
      <SessionTimeoutModal
        isOpen={isWarningOpen}
        secondsLeft={secondsLeft}
        onStayLoggedIn={resetIdleTimer}
        onLogoutNow={performAutoLogout}
      />
    </>
  );
}
