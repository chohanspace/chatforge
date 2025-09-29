

// src/components/providers/auth-provider.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const JWT_TOKEN_KEY = 'chatforge_jwt';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromToken = useCallback(() => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (token) {
        const decoded = jwt.decode(token) as User | null;
        if (decoded && (decoded as any).exp * 1000 > Date.now()) {
            setUser(decoded);
        } else {
            localStorage.removeItem(JWT_TOKEN_KEY);
            setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem(JWT_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromToken();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === JWT_TOKEN_KEY) {
        loadUserFromToken();
      }
    };

    const handleFocus = () => {
        loadUserFromToken();
    }
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadUserFromToken]);

  const login = (token: string) => {
    try {
        const decoded = jwt.decode(token) as User | null;
        if (!decoded) {
            logout();
            return;
        }
        
        localStorage.setItem(JWT_TOKEN_KEY, token);
        setUser(decoded as User);
    } catch (e) {
        console.error("Failed to process login", e);
        logout();
    }
  };

  const logout = () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
