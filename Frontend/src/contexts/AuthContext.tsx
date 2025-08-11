import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

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
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('leaselink_user');
    const storedAuth = localStorage.getItem('leaselink_auth');
    
    if (storedUser && storedAuth === 'true') {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Mock authentication - in real app, this would be an API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username && password) {
        const mockUser: User = {
          id: '1',
          username,
          email: `${username}@example.com`,
          role: username.toLowerCase() === 'admin' ? 'admin' : 'user'
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        
        // Store in localStorage
        localStorage.setItem('leaselink_user', JSON.stringify(mockUser));
        localStorage.setItem('leaselink_auth', 'true');
        
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('leaselink_user');
    localStorage.removeItem('leaselink_auth');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
