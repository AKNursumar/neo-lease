import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import type { User, AuthError, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: { data?: { full_name?: string; phone?: string } }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { full_name?: string; phone?: string }) => Promise<{ error: AuthError | null }>;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const log = useCallback((message: string, data?: any) => {
    if (config.debug.auth) {
      console.log(`[Auth] ${message}`, data || '');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        log('Initializing authentication...');
        
        // Get initial session with timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null }, error: AuthError }>((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
          )
        ]);

        if (!mounted) return;

        if (error) {
          log('Session initialization error:', error);
        } else {
          log('Session initialized:', { hasSession: !!session });
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        log('Auth initialization failed:', error);
        // Continue without blocking the app
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      log('Auth state change:', { event, hasSession: !!session });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync user data only when signing in
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
              phone: session.user.user_metadata?.phone,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error syncing user data:', error);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [log]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Add timeout for slow connections
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result = await Promise.race([signInPromise, timeoutPromise]);
      
      if (result.error) {
        log('Sign in error:', result.error.message);
        throw result.error;
      }

      if (result.data?.user) {
        log('Sign in successful for user:', result.data.user.email);
        setUser(result.data.user);
      }

      return { error: null };
    } catch (error: any) {
      log('Sign in failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    options?: { data?: { full_name?: string; phone?: string } }
  ) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data || {},
      },
    });
    return { error: result.error };
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Clear cache before signing out
      const { clearUserCache } = await import('@/lib/supabase');
      clearUserCache();
      
      const result = await supabase.auth.signOut();
      setUser(null);
      return { error: result.error };
    } catch (error: any) {
      log('Sign out error:', error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: result.error };
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string }) => {
    if (!user) return { error: new Error('No user logged in') as AuthError };

    const result = await supabase.auth.updateUser({
      data: updates,
    });

    // Also update our users table
    if (!result.error) {
      await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return { error: result.error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
