import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUserInfo = useCallback(async (authToken) => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      // Use dynamic host if deployed, else localhost:5000
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (e) {
      console.error('Error fetching user info:', e);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserInfo(token);
    } else {
      logout();
    }
  }, [token, fetchUserInfo, logout]);

  const login = (newToken, userData) => {
    setUser(userData);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser: () => fetchUserInfo(token) }}>
      {children}
    </AuthContext.Provider>
  );
};
