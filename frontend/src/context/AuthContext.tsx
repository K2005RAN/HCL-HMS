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

// 24 Hours Session Timeout in milliseconds (matches JWT token lifetime)
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginTime');
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(newUser));
    sessionStorage.setItem('loginTime', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  useEffect(() => {
    // Check sessionStorage on load
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    const storedLoginTime = sessionStorage.getItem('loginTime');

    if (storedToken) {
      const now = Date.now();
      let loginTimestamp = storedLoginTime ? parseInt(storedLoginTime, 10) : 0;

      // If loginTime was missing, auto-initialize it instead of logging out
      if (!loginTimestamp) {
        loginTimestamp = now;
        sessionStorage.setItem('loginTime', now.toString());
      }

      // Auto logout ONLY if session timestamp exceeds 24 hours
      if (now - loginTimestamp > SESSION_TIMEOUT_MS) {
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
          sessionStorage.setItem('user', JSON.stringify(res.data));
        }
      })
      .catch(err => {
        console.error('Failed to refresh user profile from backend:', err);
        // Force logout ONLY if token is explicitly expired/unauthorized (401)
        if (err.response?.status === 401) {
          logout();
        }
      });
    }
    setIsInitialized(true);
  }, []);

  // Global Axios interceptor for automatic logout ONLY on 401 Unauthorized (Expired JWT)
  // NEVER log out on 403 Forbidden (Permission Denied) or auth/login requests!
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const requestUrl = error.config?.url || '';
          const isAuthRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');
          if (!isAuthRoute) {
            console.warn('Session expired (401). Logging out...');
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
      const storedLoginTime = sessionStorage.getItem('loginTime');
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
