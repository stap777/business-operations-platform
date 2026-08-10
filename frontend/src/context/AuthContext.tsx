import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthResponse, Role, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse, rememberMe?: boolean) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  getRoleRedirectPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session from localStorage or sessionStorage
    const storedToken =
      localStorage.getItem('bms_jwt_token') || sessionStorage.getItem('bms_jwt_token');
    const storedUserInfo =
      localStorage.getItem('bms_user_info') || sessionStorage.getItem('bms_user_info');

    if (storedToken && storedUserInfo) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error('Failed to parse stored auth session', e);
        clearAuthStorage();
      }
    }
    setIsLoading(false);
  }, []);

  const clearAuthStorage = () => {
    localStorage.removeItem('bms_jwt_token');
    localStorage.removeItem('bms_user_info');
    sessionStorage.removeItem('bms_jwt_token');
    sessionStorage.removeItem('bms_user_info');
  };

  const login = (authData: AuthResponse, rememberMe = true) => {
    const userInfo: User = {
      fullName: authData.fullName,
      username: authData.username,
      role: authData.role,
      status: 'ACTIVE',
    };

    setToken(authData.token);
    setUser(userInfo);

    // Clear existing storage before saving to selected storage
    clearAuthStorage();

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem('bms_jwt_token', authData.token);
    targetStorage.setItem('bms_user_info', JSON.stringify(userInfo));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthStorage();
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const getRoleRedirectPath = (targetRole?: Role): string => {
    const role = targetRole || user?.role;
    switch (role) {
      case 'DELIVERY':
        return '/delivery/dashboard';
      case 'MANAGER':
        return '/manager/dashboard';
      case 'ADMIN':
      default:
        return '/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
