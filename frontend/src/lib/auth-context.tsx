'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { initPushNotifications, onForegroundMessage } from '@/lib/firebase';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    lieuResidence?: string;
    region?: number;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/profile');
      setUser(res.data.data);
      initPushNotifications();
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedToken !== 'undefined') {
      setToken(savedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      if (savedUser && savedUser !== 'undefined') {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          refreshUser();
        }
      }
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    onForegroundMessage((payload) => {
      if (Notification.permission === 'granted' && payload.title) {
        new Notification(payload.title, { body: payload.body, icon: '/window.svg' });
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/login', { email, password });
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);

    const profileRes = await api.get('/api/profile');
    const userData = profileRes.data.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    initPushNotifications(true);
    router.push('/');
  };

  const register = async (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    lieuResidence?: string;
  }) => {
    await api.post('/api/register', data);
    router.push('/login');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
