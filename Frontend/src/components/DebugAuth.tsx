import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useEffect } from 'react';

const DebugAuth = () => {
  const { user, loading } = useSupabaseAuth();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Auth Debug Info');
      console.log('Loading:', loading);
      console.log('Authenticated:', !!user);
      console.log('User:', user);
      console.groupEnd();
    }
  }, [user, loading]);
  
  // Don't render anything on screen
  return null;
};

export default DebugAuth;
