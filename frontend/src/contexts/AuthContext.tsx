import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface User {
  id: number;
  email: string;
  handle: string;
  bio: string;
  favorite_snack: string;
  karma: number;
  isModerator?: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, handle: string, bio?: string, favoriteSnack?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const storedToken = localStorage.getItem('confessly_token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token: authToken, user: userData } = response.data;
      
      localStorage.setItem('confessly_token', authToken);
      setToken(authToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (
    email: string, 
    password: string, 
    handle: string, 
    bio = '', 
    favoriteSnack = ''
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        handle,
        bio,
        favoriteSnack
      });
      
      const { token: authToken, user: userData } = response.data;
      
      localStorage.setItem('confessly_token', authToken);
      setToken(authToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('confessly_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};