import React, { createContext, useContext, useState, useEffect } from 'react';

interface SimpleAuthContextType {
  isAuthenticated: boolean;
  user: SimpleUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface SimpleUser {
  id: string;
  email: string;
  fullName?: string;
  role: 'guest' | 'user' | 'owner' | 'admin';
  phone?: string;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('leaselink_user');
    const savedAuth = localStorage.getItem('leaselink_authenticated');

    if (savedUser && savedAuth === 'true') {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('📦 Restored user session:', userData.email);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('leaselink_user');
        localStorage.removeItem('leaselink_authenticated');
      }
    }

    setLoading(false);
  }, []);

  // Save session whenever auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('leaselink_user', JSON.stringify(user));
      localStorage.setItem('leaselink_authenticated', 'true');
    } else {
      localStorage.removeItem('leaselink_user');
      localStorage.removeItem('leaselink_authenticated');
    }
  }, [isAuthenticated, user]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any username/password combination
      // In real app, this would call your backend API
      const userData: SimpleUser = {
        id: `user_${Date.now()}`,
        email: username.includes('@') ? username : `${username}@example.com`,
        fullName: username === 'admin' ? 'Admin User' : `User ${username}`,
        role: username === 'admin' ? 'admin' : 'user',
      };

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      console.log('✅ User logged in:', userData.email);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string, phone?: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, always succeed
      const userData: SimpleUser = {
        id: `user_${Date.now()}`,
        email,
        fullName,
        role: 'user',
        phone,
      };

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      console.log('✅ User registered:', userData.email);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('leaselink_user');
    localStorage.removeItem('leaselink_authenticated');
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
    <SimpleAuthContext.Provider value={value}>
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
    </SimpleAuthContext.Provider>
  );
};
