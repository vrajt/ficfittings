
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
        const loggedIn = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(loggedIn);
    } catch (error) {
        console.error("Could not access localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = () => {
    try {
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        router.push('/dashboard');
    } catch (error) {
        console.error("Could not access localStorage", error);
    }
  };

  const logout = () => {
    try {
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        router.push('/login');
    } catch (error) {
        console.error("Could not access localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
