import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from './api.ts';
import type { User, CustomerProfile, WorkerProfile, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  customerProfile: CustomerProfile | null;
  workerProfile: WorkerProfile | null;
  loading: boolean;
  mustChangePassword?: boolean;
  setMustChangePassword?: (must: boolean) => void;
  login: (email: string, pass: string, expectedRole?: string) => Promise<{ user: User; mustChangePassword?: boolean }>;
  loginWithGoogle: (googleData?: { email?: string; name?: string; avatarUrl?: string }, expectedRole?: string) => Promise<User>;
  forgotPassword: (email: string, newPassword?: string) => Promise<{ success: boolean; message: string; userFound?: boolean; name?: string; role?: string }>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string, email?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customerProfile: null,
  workerProfile: null,
  loading: true,
  mustChangePassword: false,
  setMustChangePassword: () => {},
  login: async () => ({} as any),
  loginWithGoogle: async () => ({} as any),
  forgotPassword: async () => ({} as any),
  changePassword: async () => ({} as any),
  register: async () => ({} as any),
  logout: () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
  role: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setCustomerProfile(null);
      setWorkerProfile(null);
      setMustChangePassword(false);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      setUser(data.user);
      setMustChangePassword(Boolean(data.user?.temporaryPassword));
      setCustomerProfile(data.customerProfile || null);
      setWorkerProfile(data.workerProfile || null);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      clearAuthToken();
      setUser(null);
      setCustomerProfile(null);
      setWorkerProfile(null);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for OAuth message from popup
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshUser();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = async (email: string, pass: string, expectedRole?: string): Promise<{ user: User; mustChangePassword?: boolean }> => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, expectedRole }),
    });

    setAuthToken(data.token);
    setUser(data.user);
    const requiresPasswordChange = Boolean(data.mustChangePassword || data.user?.temporaryPassword);
    setMustChangePassword(requiresPasswordChange);
    setCustomerProfile(data.customerProfile || null);
    setWorkerProfile(data.workerProfile || null);
    return { user: data.user, mustChangePassword: requiresPasswordChange };
  };

  const loginWithGoogle = async (googleData?: { email?: string; name?: string; avatarUrl?: string }, expectedRole?: string): Promise<User> => {
    const data = await apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ ...(googleData || {}), expectedRole }),
    });

    setAuthToken(data.token);
    setUser(data.user);
    setCustomerProfile(data.customerProfile || null);
    setWorkerProfile(data.workerProfile || null);
    return data.user;
  };

  const forgotPassword = async (email: string, newPassword?: string) => {
    const data = await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
    return data;
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string, email?: string) => {
    const data = await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email || user?.email,
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      }),
    });

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    setMustChangePassword(false);
    return data;
  };

  const register = async (formData: any): Promise<User> => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    setAuthToken(data.token);
    setUser(data.user);
    setCustomerProfile(data.customerProfile || null);
    setWorkerProfile(null);
    return data.user;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setCustomerProfile(null);
    setWorkerProfile(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerProfile,
        workerProfile,
        loading,
        mustChangePassword,
        setMustChangePassword,
        login,
        loginWithGoogle,
        forgotPassword,
        changePassword,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        role: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
