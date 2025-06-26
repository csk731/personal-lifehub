import { useState, useEffect } from 'react';
import { getUserTimezone, setUserTimezone, getDetectedTimezone } from '@/utils/timezone';
import { getAuthHeaders } from '@/lib/utils';

export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(() => getUserTimezone());
  const [loading, setLoading] = useState(true);

  // Sync timezone with profile on app load
  useEffect(() => {
    const syncTimezoneWithProfile = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/profile', { headers });
        
        if (response.ok) {
          const data = await response.json();
          const profileTimezone = data.profile?.timezone;
          
          if (profileTimezone && profileTimezone !== timezone) {
            // Update localStorage to match profile
            setUserTimezone(profileTimezone);
            setTimezoneState(profileTimezone);
          } else if (!profileTimezone) {
            // If profile doesn't have timezone, detect and update profile
            const detected = getDetectedTimezone();
            await updateProfileTimezone(detected);
            setUserTimezone(detected);
            setTimezoneState(detected);
          }
        }
      } catch (error) {
        console.error('Failed to sync timezone with profile:', error);
        // Fallback to detected timezone
        const detected = getDetectedTimezone();
        setUserTimezone(detected);
        setTimezoneState(detected);
      } finally {
        setLoading(false);
      }
    };

    syncTimezoneWithProfile();
  }, [timezone]);

  const updateProfileTimezone = async (newTimezone: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ timezone: newTimezone }),
      });
    } catch (error) {
      console.error('Failed to update profile timezone:', error);
    }
  };

  const updateTimezone = async (newTimezone: string) => {
    setUserTimezone(newTimezone);
    setTimezoneState(newTimezone);
    await updateProfileTimezone(newTimezone);
  };

  return {
    timezone,
    updateTimezone,
    loading,
  };
} 