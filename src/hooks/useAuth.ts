import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { checkAuthStatus, refreshSession } from '@/lib/utils';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        updateState({ error: error.message, loading: false });
        return;
      }

      updateState({
        user: session?.user || null,
        session,
        loading: false,
        error: null,
      });
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to refresh authentication',
        loading: false 
      });
    }
  }, [updateState]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        updateState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      updateState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      updateState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        updateState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      // For email confirmation flow, we don't immediately set the user
      updateState({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      updateState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        updateState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      updateState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      updateState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        updateState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      updateState({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      updateState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  const updatePassword = useCallback(async (password: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        updateState({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      updateState({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      updateState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    refreshAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        updateState({
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth, updateState]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshAuth,
  };
} 