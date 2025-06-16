"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api, { setTokens, clearTokens, TOKEN_KEY, REFRESH_TOKEN_KEY, getAuthToken, getRefreshToken } from '../api';
import jwt_decode from 'jwt-decode';

// Fix for "This expression is not callable" error with jwt-decode:
// jwt_decode may be imported as a module object instead of a function depending on build config.
// Always use: (jwt_decode as any)<T>(token)
interface User {
  sub: string;
  user_id: number;
  role: 'usuario_cliente' | 'funcionario' | string;
  nome?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (matricula: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      try {
        const decodedUser = (jwt_decode as any)(storedToken) as User;
        setUser(decodedUser);
      } catch (error) {
        console.error("Falha ao decodificar token JWT:", error);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post<{ access_token: string, refresh_token: string }>('/auth/token', formData);

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      setTokens(newAccessToken, newRefreshToken);
      setToken(newAccessToken);
      try {
        const decodedUser = (jwt_decode as any)(newAccessToken) as User;
        setUser(decodedUser);
      } catch (error) {
        console.error("Falha ao decodificar token JWT:", error);
        setUser(null);
      }
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorDetail = error.response?.data?.detail || error.message || "Falha no login.";
      setAuthError(errorDetail);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    clearTokens();
    setToken(null);
    setUser(null);
    setAuthError(null);
    router.push('/login');
  };
  
  const clearError = () => {
    setAuthError(null);
  };

  // --- Refresh token automático ao expirar o access_token ---
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;

    function scheduleRefresh(token: string) {
      try {
        const decoded: any = (jwt_decode as any)(token);
        if (decoded.exp) {
          const expiresAt = decoded.exp * 1000;
          const now = Date.now();
          // Refresh 1 minute before expiration
          const timeout = Math.max(expiresAt - now - 60 * 1000, 5000);
          if (refreshTimeout) clearTimeout(refreshTimeout);
          refreshTimeout = setTimeout(refreshAccessToken, timeout);
        }
      } catch {
        // ignore
      }
    }

    async function refreshAccessToken() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logout();
        return;
      }
      try {
        const res = await api.post<{ access_token: string, refresh_token: string }>('/auth/refresh_token', { refresh_token: refreshToken });
        setTokens(res.data.access_token, res.data.refresh_token);
        setToken(res.data.access_token);
        try {
          const decodedUser = (jwt_decode as any)(res.data.access_token) as User;
          setUser(decodedUser);
        } catch {
          setUser(null);
        }
        scheduleRefresh(res.data.access_token);
      } catch {
        logout();
      }
    }

    if (token) {
      scheduleRefresh(token);
    }
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isLoading, login, logout, authError, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
