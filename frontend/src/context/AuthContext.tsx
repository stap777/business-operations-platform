import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthResponse, Role, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  getRoleRedirectPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verify server session on application mount
    const verifySession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const clearAuthStorage = () => {
    localStorage.removeItem('aven_session_token');
    localStorage.removeItem('bms_jwt_token');
    localStorage.removeItem('bms_user_info');
    sessionStorage.removeItem('bms_jwt_token');
    sessionStorage.removeItem('bms_user_info');
  };

  const login = (authData: AuthResponse) => {
    clearAuthStorage();
    if (authData.token) {
      localStorage.setItem('aven_session_token', authData.token);
    }
    const userInfo: User = {
      fullName: authData.fullName,
      username: authData.username,
      role: authData.role,
      status: 'ACTIVE',
    };
    setUser(userInfo);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Backend logout call failed or session already expired', e);
    } finally {
      setUser(null);
      clearAuthStorage();
    }
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
        token: null,
        isAuthenticated: !!user,
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

