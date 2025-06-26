'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { validation, handleAuthError } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password';

interface AuthState {
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  message: string;
  messageType: 'success' | 'error' | 'info';
  showPassword: boolean;
  showConfirmPassword: boolean;
}

function AuthPageContent() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [state, setState] = useState<AuthState>({
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,
    message: '',
    messageType: 'info',
    showPassword: false,
    showConfirmPassword: false,
  });
  
  const router = useRouter();

  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    updateState({ message, messageType: type });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation using utility functions
    const emailValidation = validation.email(state.email);
    if (!emailValidation.isValid) {
      showMessage(emailValidation.error!, 'error');
      return;
    }

    const passwordValidation = validation.password(state.password);
    if (!passwordValidation.isValid) {
      showMessage(passwordValidation.errors.join(', '), 'error');
      return;
    }

    const confirmPasswordValidation = validation.confirmPassword(state.password, state.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      showMessage(confirmPasswordValidation.error!, 'error');
      return;
    }

    updateState({ loading: true, message: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: state.email,
        password: state.password,
      });

      if (error) {
        showMessage(handleAuthError(error), 'error');
      } else {
        showMessage('Check your email for the confirmation link!', 'success');
        updateState({ email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      showMessage(handleAuthError(error), 'error');
    } finally {
      updateState({ loading: false });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validation.email(state.email);
    if (!emailValidation.isValid) {
      showMessage(emailValidation.error!, 'error');
      return;
    }

    if (!state.password) {
      showMessage('Password is required', 'error');
      return;
    }

    updateState({ loading: true, message: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });

      if (error) {
        showMessage(handleAuthError(error), 'error');
      } else {
        router.push('/');
      }
    } catch (error) {
      showMessage(handleAuthError(error), 'error');
    } finally {
      updateState({ loading: false });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validation.email(state.email);
    if (!emailValidation.isValid) {
      showMessage(emailValidation.error!, 'error');
      return;
    }

    updateState({ loading: true, message: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(state.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        showMessage(handleAuthError(error), 'error');
      } else {
        showMessage('Password reset link sent to your email!', 'success');
        updateState({ email: '' });
      }
    } catch (error) {
      showMessage(handleAuthError(error), 'error');
    } finally {
      updateState({ loading: false });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordValidation = validation.password(state.password);
    if (!passwordValidation.isValid) {
      showMessage(passwordValidation.errors.join(', '), 'error');
      return;
    }

    const confirmPasswordValidation = validation.confirmPassword(state.password, state.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      showMessage(confirmPasswordValidation.error!, 'error');
      return;
    }

    updateState({ loading: true, message: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: state.password,
      });

      if (error) {
        showMessage(handleAuthError(error), 'error');
      } else {
        showMessage('Password updated successfully!', 'success');
        setMode('signin');
        updateState({ email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      showMessage(handleAuthError(error), 'error');
    } finally {
      updateState({ loading: false });
    }
  };

  const getMessageStyles = () => {
    switch (state.messageType) {
      case 'success':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'error':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border border-blue-300';
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={state.email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={state.showPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateState({ showPassword: !state.showPassword })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sign up
              </button>
            </div>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={state.email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={state.showPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateState({ showPassword: !state.showPassword })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={(e) => updateState({ confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateState({ showConfirmPassword: !state.showConfirmPassword })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sign in
              </button>
            </div>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={state.email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </button>
            </div>
          </form>
        );

      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={state.showPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateState({ showPassword: !state.showPassword })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={(e) => updateState({ confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateState({ showConfirmPassword: !state.showConfirmPassword })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      case 'reset-password':
        return 'Set New Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign in to your LifeHub account';
      case 'signup':
        return 'Create your LifeHub account';
      case 'forgot-password':
        return 'Enter your email to receive a reset link';
      case 'reset-password':
        return 'Enter your new password';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
          <p className="text-gray-600">{getSubtitle()}</p>
        </div>
        
        {state.message && (
          <div className={`mb-6 p-4 rounded-lg ${getMessageStyles()}`}>
            {state.message}
          </div>
        )}

        {renderForm()}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthPageContent />
    </AuthGuard>
  );
} 