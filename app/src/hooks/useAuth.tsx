import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const profile = await getCurrentUser();
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          const profile = await getCurrentUser();
          setUser(profile);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; success: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error: new Error(error.message), success: false };
      }
      
      if (!data.user) {
        return { error: new Error('No user returned'), success: false };
      }

      // Get full user profile
      const profile = await getCurrentUser();
      setUser(profile);
      
      return { error: null, success: true };
    } catch (error: any) {
      return { error: new Error(error.message || 'Login failed'), success: false };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser,
      }}
    >
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
