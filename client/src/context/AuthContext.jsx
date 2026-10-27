import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('staffsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('staffsync_token') || null);
  const [loading, setLoading] = useState(true);

  // Refresh user data from API on load if token exists
  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('staffsync_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosClient.get('/auth/me');
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('staffsync_user', JSON.stringify(response.user));
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid, logging out:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    if (response.success && response.token) {
      localStorage.setItem('staffsync_token', response.token);
      localStorage.setItem('staffsync_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Authentication failed');
  };

  const register = async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    if (response.success && response.token) {
      localStorage.setItem('staffsync_token', response.token);
      localStorage.setItem('staffsync_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setToken(null);
    setUser(null);
  };

  // Switch demo account conveniently
  const switchDemoRole = async (targetRole) => {
    const credentials = {
      HR: { email: 'hr@staffsync.com', password: 'Password123!' },
      Manager: { email: 'manager@staffsync.com', password: 'Password123!' },
      Employee: { email: 'employee@staffsync.com', password: 'Password123!' },
    };

    const creds = credentials[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser: fetchCurrentUser,
        isAuthenticated: !!user && !!token,
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
