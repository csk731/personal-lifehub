'use client';

import React, { useState } from 'react';
import { WidgetProps, WeatherSettings } from '@/types';
import { WidgetWrapper } from './WidgetWrapper';
import { useWeather } from '@/hooks/useWeather';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  RefreshCw,
  Settings,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const WeatherWidget: React.FC<WidgetProps> = (props) => {
  const { widget, onUpdate } = props;
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get settings from widget or use defaults
  const settings: WeatherSettings = {
    location: widget.settings?.location || 'New York',
    unit: widget.settings?.unit || 'celsius',
    showForecast: widget.settings?.showForecast ?? true,
    showHourly: widget.settings?.showHourly ?? false,
    autoRefresh: widget.settings?.autoRefresh ?? true,
    refreshInterval: widget.settings?.refreshInterval || 10,
  };

  const { weatherData, isLoading, error, refreshWeather, updateSettings } = useWeather(settings);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWeather();
    setIsRefreshing(false);
  };

  const handleSettingChange = (key: keyof WeatherSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
    onUpdate(widget.id, { settings: newSettings });
  };

  const getWeatherIcon = (condition: string, isDay: boolean = true) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-300" />;
    } else if (conditionLower.includes('wind')) {
      return <Wind className="w-8 h-8 text-gray-400" />;
    } else {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatTemperature = (tempC: number, tempF: number, unit: 'celsius' | 'fahrenheit') => {
    const temp = unit === 'celsius' ? tempC : tempF;
    const symbol = unit === 'celsius' ? '°C' : '°F';
    return `${Math.round(temp)}${symbol}`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCurrentWeather = () => {
    if (!weatherData?.current) return null;

    const { current, location } = weatherData;
    const temp = formatTemperature(current.temp_c, current.temp_f, settings.unit);
    const feelsLike = formatTemperature(current.feelslike_c, current.feelslike_f, settings.unit);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Location and Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">
              {location.name}, {location.country}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Current Weather */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4">
            {getWeatherIcon(current.condition.text, current.is_day)}
            <div>
              <div className="text-3xl font-bold text-gray-800">{temp}</div>
              <div className="text-sm text-gray-600">Feels like {feelsLike}</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">{current.condition.text}</div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Droplets className="w-3 h-3 text-blue-500" />
            <span className="text-gray-700">Humidity: {current.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className="w-3 h-3 text-gray-500" />
            <span className="text-gray-700">
              Wind: {settings.unit === 'celsius' ? current.wind_kph : current.wind_mph} 
              {settings.unit === 'celsius' ? ' km/h' : ' mph'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-3 h-3 text-gray-500" />
            <span className="text-gray-700">Visibility: {current.visibility_km} km</span>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="w-3 h-3 text-red-500" />
            <span className="text-gray-700">UV: {current.uv}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderForecast = () => {
    if (!weatherData?.forecast || !settings.showForecast) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>3-Day Forecast</span>
        </div>
        <div className="space-y-2">
          {weatherData.forecast.slice(0, 3).map((day, index) => (
            <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 w-12">
                  {formatDate(day.date)}
                </span>
                {getWeatherIcon(day.day.condition.text)}
                <span className="text-xs text-gray-700">{day.day.condition.text}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {formatTemperature(day.day.maxtemp_c, day.day.maxtemp_f, settings.unit)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatTemperature(day.day.mintemp_c, day.day.mintemp_f, settings.unit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-3 p-3 bg-gray-50 rounded-lg"
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={settings.location}
            onChange={(e) => handleSettingChange('location', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter city name"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Temperature Unit</label>
          <select
            value={settings.unit}
            onChange={(e) => handleSettingChange('unit', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="celsius">Celsius</option>
            <option value="fahrenheit">Fahrenheit</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showForecast}
              onChange={(e) => handleSettingChange('showForecast', e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-700">Show forecast</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoRefresh}
              onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-700">Auto refresh</span>
          </label>
        </div>

        {settings.autoRefresh && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Refresh Interval (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </motion.div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
            <span className="text-sm text-gray-600">Loading weather...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <Cloud className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">Failed to load weather</p>
            <button
              onClick={handleRefresh}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderCurrentWeather()}
        {renderForecast()}
        {renderSettings()}
      </div>
    );
  };

  return (
    <WidgetWrapper widget={widget}>
      {renderContent()}
    </WidgetWrapper>
  );
};

export default WeatherWidget; 