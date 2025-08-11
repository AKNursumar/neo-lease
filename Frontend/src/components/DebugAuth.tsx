import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const DebugAuth = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Auth Debug Info');
      console.log('Loading:', loading);
      console.log('Authenticated:', isAuthenticated);
      console.log('User:', user);
      console.groupEnd();
    }
  }, [isAuthenticated, user, loading]);
  
  // Don't render anything on screen
  return null;
};

export default DebugAuth;
