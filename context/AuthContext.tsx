"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { fetchWithAuth } from '@/lib/api';

interface User {
  id: string;
  email: string;
  quota: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isExtractingDiary: boolean;
  setIsExtractingDiary: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
  isExtractingDiary: false,
  setIsExtractingDiary: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExtractingDiary, setIsExtractingDiary] = useState(false);

  const fetchUser = async () => {
    const token = Cookies.get('auth_token');
    if (token) {
      try {
        const res = await fetchWithAuth('/api/v1/users/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          Cookies.remove('auth_token');
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    Cookies.remove('auth_token');
    Cookies.remove('guest_session_id');
    window.location.href = '/'; // Hard refresh to reset state and issue new guest_session_id
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser, isExtractingDiary, setIsExtractingDiary }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
