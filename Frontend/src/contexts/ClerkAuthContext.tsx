import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { useNotifications } from './NotificationContext';

interface ClerkAuthContextType {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => void;
  syncUserToSupabase: (userData: any) => Promise<void>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut: clerkSignOut } = useClerk();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync user data to Supabase
  const syncUserToSupabase = async (userData: any) => {
    if (isSyncing) return; // Prevent duplicate sync calls
    
    setIsSyncing(true);
    try {
      // Map Clerk user data to your Supabase user structure
      const userPayload = {
        id: userData.id,
        email: userData.emailAddresses?.[0]?.emailAddress,
        full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        first_name: userData.firstName,
        last_name: userData.lastName,
        profile_image: userData.imageUrl,
        phone: userData.phoneNumbers?.[0]?.phoneNumber || null,
        created_at: userData.createdAt,
        updated_at: new Date().toISOString(),
        last_sign_in: userData.lastSignInAt,
        // Add any additional fields you need
      };

      console.log('🔄 Syncing user to Supabase:', userPayload);

      // Call your Supabase sync function (you'll implement this)
      const response = await fetch('/api/sync-user-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });

      if (response.ok) {
        console.log('✅ User synced to Supabase successfully');
        addNotification({
          type: 'success',
          title: 'Account Synced',
          message: 'Your profile has been synchronized successfully.',
        });
      } else {
        throw new Error('Failed to sync user to Supabase');
      }
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
      addNotification({
        type: 'error',
        title: 'Sync Error',
        message: 'Failed to sync your profile. Please try again.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync user when they sign in
  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
      
      if (isSignedIn && user) {
        console.log('👤 User signed in:', user);
        // Sync user data to Supabase on sign in
        syncUserToSupabase(user);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // Handle sign out
  const signOut = async () => {
    try {
      await clerkSignOut();
      addNotification({
        type: 'success',
        title: 'Signed Out',
        message: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      addNotification({
        type: 'error',
        title: 'Sign Out Error',
        message: 'Failed to sign out. Please try again.',
      });
    }
  };

  const value: ClerkAuthContextType = {
    user: user ? {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      phone: user.phoneNumbers?.[0]?.phoneNumber,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    } : null,
    isAuthenticated: isSignedIn || false,
    loading: loading || isSyncing,
    signOut,
    syncUserToSupabase,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};
