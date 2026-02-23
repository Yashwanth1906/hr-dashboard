import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { User, UserRole } from '../types';
import { API_URL } from '../utils/utils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  updateOnBoardingStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // We can optionally add a useEffect here if there's a /me endpoint in the future to maintain session

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user: backendUser, token } = response.data;

      localStorage.setItem('token', token);

      setUser({
        id: backendUser.id,
        name: `${backendUser.firstName} ${backendUser.lastName}`,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        isOnBoarded: backendUser.isOnBoarded,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Invalid credentials');
      }
      throw new Error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const register = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { firstName, lastName, email, password });
      const { user: backendUser, token } = response.data;

      localStorage.setItem('token', token);

      setUser({
        id: backendUser.id,
        name: `${backendUser.firstName} ${backendUser.lastName}`,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        isOnBoarded: backendUser.isOnBoarded,
        joinDate: backendUser.createdAt ? new Date(backendUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw new Error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOnBoardingStatus = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, isOnBoarded: true } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        register,
        updateOnBoardingStatus,
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
