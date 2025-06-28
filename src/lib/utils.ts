import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';
import { createClient } from './supabase';
import { NextRequest } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export const validation = {
  email: (email: string): { isValid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  confirmPassword: (password: string, confirmPassword: string): { isValid: boolean; error?: string } => {
    if (!confirmPassword) {
      return { isValid: false, error: 'Please confirm your password' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true };
  },

  required: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  },

  minLength: (value: string, minLength: number, fieldName: string): { isValid: boolean; error?: string } => {
    if (value.length < minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
    }
    return { isValid: true };
  },

  maxLength: (value: string, maxLength: number, fieldName: string): { isValid: boolean; error?: string } => {
    if (value.length > maxLength) {
      return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters long` };
    }
    return { isValid: true };
  },

  number: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    if (isNaN(Number(value))) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }
    return { isValid: true };
  },

  positiveNumber: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return { isValid: false, error: `${fieldName} must be a positive number` };
    }
    return { isValid: true };
  },

  url: (url: string): { isValid: boolean; error?: string } => {
    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  },

  widget: {
    typeId: (typeId: string): { isValid: boolean; error?: string } => {
      if (!typeId || typeof typeId !== 'string') {
        return { isValid: false, error: 'Widget type ID is required' };
      }
      if (typeId.trim().length === 0) {
        return { isValid: false, error: 'Widget type ID cannot be empty' };
      }
      return { isValid: true };
    },

    title: (title: string): { isValid: boolean; error?: string } => {
      if (!title || typeof title !== 'string') {
        return { isValid: false, error: 'Widget title is required' };
      }
      if (title.trim().length === 0) {
        return { isValid: false, error: 'Widget title cannot be empty' };
      }
      if (title.trim().length > 100) {
        return { isValid: false, error: 'Widget title must be 100 characters or less' };
      }
      return { isValid: true };
    },

    dimensions: (width: number, height: number): { isValid: boolean; error?: string } => {
      if (width < 1 || width > 4) {
        return { isValid: false, error: 'Widget width must be between 1 and 4' };
      }
      if (height < 1 || height > 4) {
        return { isValid: false, error: 'Widget height must be between 1 and 4' };
      }
      return { isValid: true };
    },

    position: (x: number, y: number): { isValid: boolean; error?: string } => {
      if (x < 0) {
        return { isValid: false, error: 'Widget position X must be non-negative' };
      }
      if (y < 0) {
        return { isValid: false, error: 'Widget position Y must be non-negative' };
      }
      return { isValid: true };
    },

    config: (config: any): { isValid: boolean; error?: string } => {
      if (config !== null && config !== undefined && typeof config !== 'object') {
        return { isValid: false, error: 'Widget config must be an object or null' };
      }
      return { isValid: true };
    }
  }
};

export async function getAuthToken(): Promise<string | null> {
  try {
    // Try to get the session with a small retry mechanism
    let session = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`Error getting auth token (attempt ${attempts + 1}):`, error);
        attempts++;
        if (attempts < maxAttempts) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          continue;
        }
        return null;
      }
      
      if (currentSession?.access_token) {
        session = currentSession;
        break;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user, error: null };
}

export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user: any | null; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return { isAuthenticated: false, user: null, error: error.message };
    }
    return { isAuthenticated: !!user, user };
  } catch (error) {
    return { isAuthenticated: false, user: null, error: 'Failed to check authentication status' };
  }
}

export async function refreshSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to refresh session' };
  }
}

export function handleAuthError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred';
}

export function validateForm(fields: Record<string, any>, validations: Record<string, () => { isValid: boolean; error?: string }>) {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, validationFn] of Object.entries(validations)) {
    const result = validationFn();
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

export const widgetUtils = {
  isWidgetTypeAdded: (widgets: any[], widgetTypeId: string): boolean => {
    return widgets.some(widget => widget.widget_type_id === widgetTypeId);
  },

  getWidgetIcon: (iconName: string): string => {
    switch (iconName) {
      case 'CheckSquare': return '✅';
      case 'Smile': return '😊';
      case 'DollarSign': return '💰';
      case 'FileText': return '📝';
      case 'Target': return '🎯';
      case 'Cloud': return '🌤️';
      case 'Calendar': return '📅';
      default: return '📦';
    }
  },

  validateWidgetData: (data: {
    widget_type_id: string;
    title: string;
    width?: number;
    height?: number;
    position_x?: number;
    position_y?: number;
    config?: any;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const typeIdValidation = validation.widget.typeId(data.widget_type_id);
    if (!typeIdValidation.isValid) {
      errors.push(typeIdValidation.error!);
    }

    const titleValidation = validation.widget.title(data.title);
    if (!titleValidation.isValid) {
      errors.push(titleValidation.error!);
    }

    if (data.width !== undefined || data.height !== undefined) {
      const dimensionsValidation = validation.widget.dimensions(
        data.width ?? 1,
        data.height ?? 1
      );
      if (!dimensionsValidation.isValid) {
        errors.push(dimensionsValidation.error!);
      }
    }

    if (data.position_x !== undefined || data.position_y !== undefined) {
      const positionValidation = validation.widget.position(
        data.position_x ?? 0,
        data.position_y ?? 0
      );
      if (!positionValidation.isValid) {
        errors.push(positionValidation.error!);
      }
    }

    if (data.config !== undefined) {
      const configValidation = validation.widget.config(data.config);
      if (!configValidation.isValid) {
        errors.push(configValidation.error!);
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  generateUniqueTitle: (baseTitle: string, existingTitles: string[]): string => {
    if (!existingTitles.includes(baseTitle)) {
      return baseTitle;
    }

    let counter = 1;
    let newTitle = `${baseTitle} ${counter}`;
    
    while (existingTitles.includes(newTitle)) {
      counter++;
      newTitle = `${baseTitle} ${counter}`;
    }

    return newTitle;
  },

  calculateOptimalPosition: (widgets: any[]): { x: number; y: number } => {
    if (widgets.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find the maximum Y position
    const maxY = Math.max(...widgets.map(w => w.position_y || 0));
    
    // Find widgets in the current row (max Y)
    const currentRowWidgets = widgets.filter(w => (w.position_y || 0) === maxY);
    
    if (currentRowWidgets.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find the maximum X position in the current row
    const maxX = Math.max(...currentRowWidgets.map(w => w.position_x || 0));

    // If there's space in the current row, place it there
    if (maxX < 3) {
      return { x: maxX + 1, y: maxY };
    } else {
      // Otherwise, start a new row
      return { x: 0, y: maxY + 1 };
    }
  }
}; 