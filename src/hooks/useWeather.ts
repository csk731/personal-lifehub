import { useState, useEffect, useCallback } from 'react';
import { WeatherData, WeatherSettings } from '@/types';

interface UseWeatherReturn {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  updateSettings: (newSettings: Partial<WeatherSettings>) => void;
  settings: WeatherSettings;
}

export const useWeather = (initialSettings: WeatherSettings): UseWeatherReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WeatherSettings>(initialSettings);

  const fetchWeatherData = useCallback(async () => {
    if (!settings.location) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        location: settings.location,
        unit: settings.unit,
        showForecast: settings.showForecast.toString(),
        showHourly: settings.showHourly.toString(),
        autoRefresh: settings.autoRefresh.toString(),
        refreshInterval: settings.refreshInterval.toString(),
      });

      const response = await fetch(`/api/weather?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  const refreshWeather = useCallback(async () => {
    await fetchWeatherData();
  }, [fetchWeatherData]);

  const updateSettings = useCallback((newSettings: Partial<WeatherSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!settings.autoRefresh || !settings.refreshInterval) return;

    const interval = setInterval(() => {
      fetchWeatherData();
    }, settings.refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, fetchWeatherData]);

  return {
    weatherData,
    isLoading,
    error,
    refreshWeather,
    updateSettings,
    settings,
  };
}; 