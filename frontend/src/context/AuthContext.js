import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { joinUserRoom } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  // Join the user's socket room whenever the user changes so they receive
  // personal events (price-drop notifications, etc).
  useEffect(() => {
    if (user?.id) {
      try { joinUserRoom(user.id); } catch (e) {}
    }
  }, [user?.id]);

  const login = async (email, password, twoFactorCode = null) => {
    const payload = { email, password };
    if (twoFactorCode) {
      payload.twoFactorCode = twoFactorCode;
    }
    const response = await authService.login(payload);

    // Check if 2FA is required
    if (response.data.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Continue with local logout even if backend call fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
