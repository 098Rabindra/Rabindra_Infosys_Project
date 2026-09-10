import React from 'react';
import { Shield, LogOut, User, Lock, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import Swal from 'sweetalert2';

export default function Navbar({ onOpenGenerator, onToggleMobileMenu, isMobileMenuOpen }) {
  const { user, logout, isVaultUnlocked } = useAuth();

  const handleLogoutClick = () => {
    Swal.fire({
      title: 'Do you Want Logout this session?',
      text: 'Your current vault session will be terminated and locked.',
      icon: 'warning',
      iconColor: '#f59e0b',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'No',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: {
        popup: 'swal-animated-border',
        confirmButton: 'swal-logout-yes-btn',
        cancelButton: 'swal-logout-no-btn',
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Logged Out Successfully',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f1f5f9',
        });
      } else {
        // User clicked "No" button or dismissed modal
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Session Active',
          text: 'You remain logged into your vault session.',
          showConfirmButton: false,
          timer: 2000,
          background: '#0f172a',
          color: '#f1f5f9',
        });
      }
    });
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/80 border-b border-white/[0.05] px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3 select-none">
        {/* Mobile Sidebar Hamburger Toggle (Visible on screens < lg) */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition border border-white/10"
            title={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
          <Shield className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1">
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">PASSWORD</span>
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">VAULT</span>
            </h1>
            <span className="hidden xs:inline-block bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
              ZERO-KNOWLEDGE
            </span>
          </div>
          <p className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide"> Password Vault & Credential Management System </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Password Generator Button */}
        <button
          onClick={onOpenGenerator}
          className="btn-secondary text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 flex items-center gap-1.5 border border-white/5 hover:border-white/15"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xs:inline">Generator</span>
        </button>

        {/* Encryption Status Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${isVaultUnlocked
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
          }`}>
          <Lock className="w-3 h-3" />
          <span>{isVaultUnlocked ? 'Vault Active' : 'Vault Locked'}</span>
        </div>

        {/* Notifications Bell Dropdown */}
        {user && <NotificationDropdown />}

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-200">{user.fullName || user.username}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              title="Logout"
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition duration-150"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

