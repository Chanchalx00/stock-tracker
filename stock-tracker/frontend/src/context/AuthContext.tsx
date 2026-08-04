'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAccessToken } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;

    api
      .post('/auth/refresh')
      .then(({ data }) => {
        if (cancelled) return;
        setAccessToken(data.token);
        setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const { data } = await api.post('/auth/google', { credential });
    setAccessToken(data.token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    setAccessToken(data.token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const forgotPassword = async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (token: string, password: string) => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    setAccessToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, still clear the local session.
    }
    setAccessToken(null);
    setUser(null);
    disconnectSocket();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, signup, forgotPassword, resetPassword, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
