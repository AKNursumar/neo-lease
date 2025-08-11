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

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Check if user is authenticated by calling /users/me
    if (!initialCheckDone) {
      checkAuthStatus();
    }

    // Listen for storage changes (when user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'leaselink_access_token') {
        if (!e.newValue) {
          // Token was removed in another tab
          setIsAuthenticated(false);
          setUser(null);
        } else {
          // Token was updated in another tab
          checkAuthStatus();
        }
      }
    };

    // Listen for focus events (when user returns to the tab)
    const handleFocus = () => {
      if (isAuthenticated && initialCheckDone) {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAuthenticated, initialCheckDone]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('leaselink_access_token');
    if (!token) {
      setLoading(false);
      setInitialCheckDone(true);
      return;
    }

    try {
      console.log('🔍 Checking auth status with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🔍 Auth check response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Auth check result:', result);
        
        if (result.success && result.data?.user) {
          const userData = result.data.user;
          setUser({
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            phone: userData.phone,
            isVerified: userData.isVerified || false,
          });
          setIsAuthenticated(true);
          console.log('✅ User authenticated:', userData.email);
        } else {
          console.log('❌ Invalid response format');
          localStorage.removeItem('leaselink_access_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else if (response.status === 401) {
        console.log('🔄 Token expired, trying refresh...');
        // Try to refresh token
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
          localStorage.removeItem('leaselink_access_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('❌ Auth check failed with status:', response.status);
        localStorage.removeItem('leaselink_access_token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('leaselink_access_token');
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setLoading(false);
    setInitialCheckDone(true);
  };

  const tryRefreshToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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
      console.log('🔐 Attempting login to:', `${API_BASE_URL}/api/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📡 Login result:', result);
        
        if (result.success && result.data?.accessToken) {
          localStorage.setItem('leaselink_access_token', result.data.accessToken);
          console.log('💾 Token saved to localStorage');
          
          // Set user data immediately if available
          if (result.data.user) {
            setUser({
              id: result.data.user.id,
              email: result.data.user.email,
              fullName: result.data.user.fullName,
              role: result.data.user.role,
              phone: result.data.user.phone,
              isVerified: result.data.user.isVerified || false,
            });
            setIsAuthenticated(true);
            console.log('✅ User data set immediately:', result.data.user.email);
          } else {
            // Fallback to fetching user data
            await checkAuthStatus();
          }
          
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
      console.log('🚀 Attempting registration to:', `${API_BASE_URL}/api/auth/register`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

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
    const token = localStorage.getItem('leaselink_access_token');
    
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    // Always clear local state regardless of API call success
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('leaselink_access_token');
    console.log('🚪 User logged out');
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
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">🔄</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
            <p className="text-muted-foreground">Checking authentication status</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
