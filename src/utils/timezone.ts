/**
 * Comprehensive timezone utility for consistent date/time handling across the app
 */

// Common timezone options for the dropdown
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)', offset: 'UTC-7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Rome', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10/+11' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', offset: 'UTC+12/+13' },
];

// Get user's detected timezone
export function getDetectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Get user's preferred timezone from profile (fallback to detected)
export function getUserTimezone(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('userTimezone');
    if (stored) return stored;
  }
  return getDetectedTimezone();
}

// Set user's preferred timezone
export function setUserTimezone(timezone: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userTimezone', timezone);
  }
}

// Convert UTC date to user's timezone
export function utcToUserTimezone(utcDate: string | Date, userTimezone?: string): Date {
  const timezone = userTimezone || getUserTimezone();
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Create a new date in the user's timezone
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
}

// Convert user timezone date to UTC
export function userTimezoneToUtc(date: Date | string, userTimezone?: string): Date {
  const timezone = userTimezone || getUserTimezone();
  
  if (typeof date === 'string') {
    // If it's a date string like "2025-06-26", assume it's in user's timezone
    const localDate = new Date(date + 'T00:00:00');
    // Get the timezone offset for the user's timezone
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
    return utcDate;
  }
  
  return new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
}

// Format date in user's timezone
export function formatDateInUserTimezone(
  date: string | Date, 
  options: Intl.DateTimeFormatOptions = {},
  userTimezone?: string
): string {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Check if a date is today in user's timezone
export function isDateToday(date: string | Date, userTimezone?: string): boolean {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Get the date parts in the user's timezone
  const dateInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(dateObj);
  const todayInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(today);
  
  return dateInUserTz === todayInUserTz;
}

// Check if a date is overdue in user's timezone
export function isDateOverdue(date: string | Date, userTimezone?: string): boolean {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Get the date parts in the user's timezone
  const dateInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(dateObj);
  const todayInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(today);
  
  // Get yesterday in user's timezone
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(yesterday);
  
  // Compare date strings (YYYY-MM-DD format)
  return dateInUserTz <= yesterdayInUserTz;
}

// Get date string in user's timezone for date inputs
export function getDateStringForInput(date?: string | Date, userTimezone?: string): string {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  
  // Use Intl.DateTimeFormat to get the date in user's timezone
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(dateObj);
}

// Convert date input value to user's timezone date string for API
export function convertDateInputToUtc(dateString: string, userTimezone?: string): string {
  if (!dateString) return '';
  
  const timezone = userTimezone || getUserTimezone();
  
  // The dateString is already in YYYY-MM-DD format from the date input
  // We just need to ensure it's interpreted in the user's timezone
  // Since the database stores dates as simple date strings, we return the date as-is
  // The API will store it as a date string in the user's timezone
  return dateString;
}

// Debug function to verify timezone conversions
export function debugTimezone(date: string | Date, userTimezone?: string): void {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  console.log('=== Timezone Debug ===');
  console.log('User timezone:', timezone);
  console.log('Original date:', dateObj.toISOString());
  console.log('Date in user timezone:', new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(dateObj));
  console.log('Is today:', isDateToday(dateObj, timezone));
  console.log('Is overdue:', isDateOverdue(dateObj, timezone));
  console.log('Current time in user timezone:', new Intl.DateTimeFormat('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(new Date()));
  console.log('=====================');
}

// Get relative time string (e.g., "2 days ago", "in 3 hours")
export function getRelativeTimeString(date: string | Date, userTimezone?: string): string {
  const timezone = userTimezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const dateInUserTz = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const diffMs = dateInUserTz.getTime() - nowInUserTz.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (Math.abs(diffDays) >= 1) {
    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
    }
  } else if (Math.abs(diffHours) >= 1) {
    if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    } else {
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'} ago`;
    }
  } else if (Math.abs(diffMinutes) >= 1) {
    if (diffMinutes > 0) {
      return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
    } else {
      return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) === 1 ? '' : 's'} ago`;
    }
  } else {
    return 'now';
  }
}

// Convert database date back to user's timezone for display
export function formatDatabaseDateForDisplay(dbDate: string, userTimezone?: string): string {
  const timezone = userTimezone || getUserTimezone();
  
  // If the date is already in YYYY-MM-DD format, it's a simple date string
  // Interpret it in the user's timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dbDate)) {
    // Create a date object in the user's timezone
    const dateInUserTz = new Date(dbDate + 'T12:00:00'); // Use noon to avoid DST issues
    return dateInUserTz.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone
    });
  }
  
  // If it's a full ISO string, convert from UTC to user's timezone
  const dateObj = new Date(dbDate);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  });
} 