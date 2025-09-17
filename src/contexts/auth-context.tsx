
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (id: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validUsers = [
    { id: 'amin', pass: 'amin@123' },
    { id: 'mtc', pass: 'amin@123' }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // No need to check storage, so start with false.
  const router = useRouter();
  const pathname = usePathname();

   useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && pathname === '/login') {
        router.push('/dashboard');
      }
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  const login = (id: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setIsLoading(true);
        setTimeout(() => { // Simulate network delay
            const user = validUsers.find(u => u.id === id && u.pass === pass);
            if (user) {
                setIsAuthenticated(true);
                router.push('/dashboard');
                resolve();
            } else {
                reject(new Error('Invalid User ID or Password. Please try again.'));
            }
            setIsLoading(false);
        }, 500);
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    router.push('/login');
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
