import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import IdleSessionManager from './components/IdleSessionManager';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [loginEmail, setLoginEmail] = useState('');

  const renderMainContent = () => {
    if (!isAuthenticated) {
      if (authMode === 'register') {
        return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
      }
      if (authMode === 'forgot-password') {
        return (
          <ForgotPasswordPage
            onSwitchToLogin={(email = '') => {
              if (email) setLoginEmail(email);
              setAuthMode('login');
            }}
          />
        );
      }
      return (
        <LoginPage
          initialEmail={loginEmail}
          onSwitchToRegister={() => setAuthMode('register')}
          onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
        />
      );
    }

    return <DashboardPage />;
  };

  return (
    <>
      {renderMainContent()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IdleSessionManager>
        <AppContent />
      </IdleSessionManager>
    </AuthProvider>
  );
}

