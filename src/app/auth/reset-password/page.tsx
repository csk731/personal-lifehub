'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { validation, handleAuthError } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';

interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  loading: boolean;
  message: string;
  messageType: 'success' | 'error' | 'info';
  showPassword: boolean;
  showConfirmPassword: boolean;
}

function ResetPasswordPageContent() {
  const [state, setState] = useState<ResetPasswordState>({
    password: '',
    confirmPassword: '',
    loading: false,
    message: '',
    messageType: 'info',
    showPassword: false,
    showConfirmPassword: false,
  });
  
  const router = useRouter();

  const updateState = (updates: Partial<ResetPasswordState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    updateState({ message, messageType: type });
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
        showMessage('Password updated successfully! Redirecting to sign in...', 'success');
        setTimeout(() => {
          router.push('/auth');
        }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>
        
        {state.message && (
          <div className={`mb-6 p-4 rounded-lg ${getMessageStyles()}`}>
            {state.message}
          </div>
        )}

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

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthGuard requireAuth={false}>
      <ResetPasswordPageContent />
    </AuthGuard>
  );
} 