import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'guest' | 'user' | 'owner' | 'admin';
  phone?: string;
  isVerified: boolean;
}

const API_BASE_URL = 'http://localhost:4000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by calling /users/me
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('leaselink_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUser({
            id: result.data.id,
            email: result.data.email,
            fullName: result.data.fullName,
            role: result.data.role,
            phone: result.data.phone,
            isVerified: result.data.isVerified,
          });
          setIsAuthenticated(true);
        }
      } else {
        // Token might be expired, try to refresh
        await tryRefreshToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('leaselink_access_token');
    }
    
    setLoading(false);
  };

  const tryRefreshToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.accessToken) {
          localStorage.setItem('leaselink_access_token', result.data.accessToken);
          await checkAuthStatus(); // Re-check with new token
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.accessToken) {
          localStorage.setItem('leaselink_access_token', result.data.accessToken);
          await checkAuthStatus(); // Fetch user data
          setLoading(false);
          return true;
        }
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string, phone?: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data?.accessToken) {
        localStorage.setItem('leaselink_access_token', result.data.accessToken);
        await checkAuthStatus(); // Fetch user data
        setLoading(false);
        return true;
      } else {
        // Handle specific error messages from backend
        const errorMessage = result.error?.message || result.message || 'Registration failed';
        console.error('Registration failed:', errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      throw error; // Re-throw so SignUp component can handle it
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('leaselink_access_token');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
