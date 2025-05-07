import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { githubAuthService } from '../services/githubAuthService';

interface User {
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
  id: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      const storedToken = localStorage.getItem('github_token');
      
      if (storedToken) {
        try {
          const userData = await githubAuthService.getCurrentUser(storedToken);
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to authenticate with stored token:', error);
          localStorage.removeItem('github_token');
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    try {
      setIsLoading(true);
      const accessToken = await githubAuthService.initiateOAuth();
      
      if (accessToken) {
        const userData = await githubAuthService.getCurrentUser(accessToken);
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('github_token', accessToken);
      }
    } catch (error) {
      console.error('Failed to authenticate with GitHub:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};