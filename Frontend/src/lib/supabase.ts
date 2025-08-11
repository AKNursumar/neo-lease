import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Optimize initial load
    flowType: 'pkce', // More secure and faster
    storageKey: 'lease-link-auth', // Custom storage key
  },
  global: {
    headers: {
      'x-application-name': 'lease-link',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Limit realtime events for better performance
    },
  },
});

// Optimized helper function to get authenticated user with caching
let userCache: { user: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export const getCurrentUser = async (useCache = true) => {
  if (useCache && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
    return { user: userCache.user, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!error && user) {
    userCache = { user, timestamp: Date.now() };
  }
  
  return { user, error };
};

// Helper function to check if user is authenticated with cache
export const isAuthenticated = async () => {
  const { user } = await getCurrentUser();
  return !!user;
};

// Optimized helper function to get user role with caching
let roleCache: { role: string | null; userId: string; timestamp: number } | null = null;

export const getUserRole = async () => {
  const { user } = await getCurrentUser();
  if (!user) return null;
  
  // Check cache first
  if (roleCache && 
      roleCache.userId === user.id && 
      Date.now() - roleCache.timestamp < CACHE_DURATION) {
    return roleCache.role;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const role = error ? null : data?.role;
  
  // Cache the result
  if (!error && role) {
    roleCache = { role, userId: user.id, timestamp: Date.now() };
  }
    
  return role;
};

// Clear cache function for logout
export const clearUserCache = () => {
  userCache = null;
  roleCache = null;
};
