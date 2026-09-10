import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../utils/api';
import { deriveKey } from '../utils/crypto';

/** @type {React.Context<any>} */
const AuthContext = createContext(null);

/**
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('vault_token') || null);
  const [encryptionKey, setEncryptionKey] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {any} */ (null));

  // Clear session state
  const logout = async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch (err) {
        console.warn('Backend logout notification warning:', err);
      }
    }
    setUser(null);
    setToken(null);
    setEncryptionKey(null);
    try {
      sessionStorage.removeItem('vault_session_pass');
    } catch (e) {}
    localStorage.removeItem('vault_user');
    localStorage.removeItem('vault_token');
  };

  /**
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      
      // Derive AES key from master password and email
      const derivedKey = await deriveKey(password, data.email || 'PasswordVaultSalt');

      const userData = {
        id: data.id,
        fullName: data.fullName,
        username: data.username,
        email: data.email,
      };

      try {
        sessionStorage.setItem('vault_session_pass', password);
      } catch (e) {}

      return { userData, token: data.token, derivedKey };
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String(/** @type {any} */ (err).message) : 'Login failed');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {{ userData: any, token: string, derivedKey: any }} param0
   */
  const completeLogin = ({ userData, token, derivedKey }) => {
    setEncryptionKey(derivedKey);
    setUser(userData);
    setToken(token);
    localStorage.setItem('vault_user', JSON.stringify(userData));
    localStorage.setItem('vault_token', token);
  };

  /**
   * @param {string} fullName
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  const register = async (fullName, username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register({ fullName, username, email, password });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String(/** @type {any} */ (err).message) : 'Registration failed');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} masterPassword
   * @param {string} [freshToken]
   */
  const unlockVault = async (masterPassword, freshToken = null) => {
    if (!user || !user.email) return false;
    try {
      let tokenToUse = freshToken;
      if (!tokenToUse) {
        const authRes = await authApi.login({ email: user.email, password: masterPassword });
        if (!authRes || !authRes.token) {
          return false;
        }
        tokenToUse = authRes.token;
      }
      const key = await deriveKey(masterPassword, user.email || 'PasswordVaultSalt');
      setEncryptionKey(key);
      setToken(tokenToUse);
      localStorage.setItem('vault_token', tokenToUse);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        encryptionKey,
        loading,
        error,
        login,
        completeLogin,
        register,
        logout,
        unlockVault,
        isAuthenticated: !!token && !!user,
        isVaultUnlocked: !!encryptionKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
