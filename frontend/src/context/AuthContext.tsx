import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
  employeeId?: string;
  doctorId?: string;
  patientId?: string;
  staffId?: string;
  adminId?: string;
  department?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4 Hours Session Timeout in milliseconds
const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('loginTime', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  useEffect(() => {
    // Check localStorage on load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedLoginTime = localStorage.getItem('loginTime');

    if (storedToken) {
      const now = Date.now();
      const loginTimestamp = storedLoginTime ? parseInt(storedLoginTime, 10) : 0;

      // Auto logout if login timestamp is missing or session exceeded 4 hours
      if (!loginTimestamp || (now - loginTimestamp > SESSION_TIMEOUT_MS)) {
        logout();
        setIsInitialized(true);
        return;
      }

      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }

      // Fetch fresh user profile details from backend
      axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(res => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      })
      .catch(err => {
        console.error('Failed to refresh user profile from backend:', err);
        // Force logout if token is expired or unauthorized
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
        }
      });
    }
    setIsInitialized(true);
  }, []);

  // Global Axios interceptor for automatic logout on 401 Unauthorized / 403 Forbidden
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Do not trigger logout for login attempts
          if (!error.config?.url?.includes('/api/auth/login')) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Periodic session expiration check while application tab is open
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const storedLoginTime = localStorage.getItem('loginTime');
      if (storedLoginTime) {
        const loginTimestamp = parseInt(storedLoginTime, 10);
        if (Date.now() - loginTimestamp > SESSION_TIMEOUT_MS) {
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  if (!isInitialized) return null; // Or a loading spinner

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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
