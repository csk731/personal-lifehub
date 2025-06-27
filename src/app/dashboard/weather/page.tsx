'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin,
  Settings,
  RefreshCw,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Calendar,
  Clock,
  Sunrise,
  Sunset,
  Moon,
  Gauge,
  Zap
} from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { WeatherSettings } from '@/types';
import { TopBar } from '@/components/dashboard/TopBar';

export default function WeatherPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default weather settings
  const defaultSettings: WeatherSettings = {
    location: 'New York',
    unit: 'celsius',
    showForecast: true,
    showHourly: true,
    autoRefresh: true,
    refreshInterval: 10,
  };

  const { weatherData, isLoading, error, refreshWeather, updateSettings } = useWeather(defaultSettings);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWeather();
    setIsRefreshing(false);
  };

  const handleSettingChange = (key: keyof WeatherSettings, value: any) => {
    const newSettings = { ...defaultSettings, [key]: value };
    updateSettings(newSettings);
  };

  const getWeatherIcon = (condition: string, isDay: boolean = true, size: 'sm' | 'md' | 'lg' = 'md') => {
    const conditionLower = condition.toLowerCase();
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <Sun className={`${sizeClasses[size]} text-yellow-500`} />;
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return <Cloud className={`${sizeClasses[size]} text-gray-500`} />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className={`${sizeClasses[size]} text-blue-500`} />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className={`${sizeClasses[size]} text-blue-300`} />;
    } else if (conditionLower.includes('wind')) {
      return <Wind className={`${sizeClasses[size]} text-gray-400`} />;
    } else {
      return <Cloud className={`${sizeClasses[size]} text-gray-500`} />;
    }
  };

  const formatTemperature = (tempC: number, tempF: number, unit: 'celsius' | 'fahrenheit') => {
    const temp = unit === 'celsius' ? tempC : tempF;
    const symbol = unit === 'celsius' ? '°C' : '°F';
    return `${Math.round(temp)}${symbol}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHour = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  };

  const getWindDirection = (direction: string) => {
    const directions: { [key: string]: string } = {
      'N': '↑', 'NNE': '↑', 'NE': '↗', 'ENE': '↗',
      'E': '→', 'ESE': '→', 'SE': '↘', 'SSE': '↘',
      'S': '↓', 'SSW': '↓', 'SW': '↙', 'WSW': '↙',
      'W': '←', 'WNW': '←', 'NW': '↖', 'NNW': '↖',
    };
    return directions[direction] || direction;
  };

  const renderCurrentWeather = () => {
    if (!weatherData?.current) return null;

    const { current, location } = weatherData;
    const temp = formatTemperature(current.temp_c, current.temp_f, defaultSettings.unit);
    const feelsLike = formatTemperature(current.feelslike_c, current.feelslike_f, defaultSettings.unit);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Weather Display */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                {location.name}, {location.country}
              </h1>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start space-x-6 mb-6">
              {getWeatherIcon(current.condition.text, current.is_day, 'lg')}
              <div>
                <div className="text-6xl font-bold text-gray-800">{temp}</div>
                <div className="text-lg text-gray-600">Feels like {feelsLike}</div>
              </div>
            </div>
            
            <div className="text-xl font-medium text-gray-700 mb-4">
              {current.condition.text}
            </div>
            
            <div className="text-sm text-gray-600">
              Last updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Humidity</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{current.humidity}%</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Wind className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Wind</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {defaultSettings.unit === 'celsius' ? current.wind_kph : current.wind_mph}
                <span className="text-sm font-normal">
                  {defaultSettings.unit === 'celsius' ? ' km/h' : ' mph'}
                </span>
              </div>
              <div className="text-sm text-gray-600 flex items-center space-x-1">
                <span>{getWindDirection(current.wind_dir)}</span>
                <span>{current.wind_dir}</span>
              </div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Visibility</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{current.visibility_km} km</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">UV Index</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{current.uv}</div>
              <div className="text-sm text-gray-600">
                {current.uv <= 2 ? 'Low' : current.uv <= 5 ? 'Moderate' : current.uv <= 7 ? 'High' : 'Very High'}
              </div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Gauge className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Pressure</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{current.pressure_mb} mb</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Cloud className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Cloud Cover</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{current.cloud}%</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderHourlyForecast = () => {
    if (!weatherData?.forecast?.[0]?.hour) return null;

    const today = weatherData.forecast[0];
    const currentHour = new Date().getHours();
    const upcomingHours = today.hour.filter((hour: any) => {
      const hourDate = new Date(hour.time);
      const hourTime = hourDate.getHours();
      return hourTime > currentHour;
    }).slice(0, 12);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Hourly Forecast</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {upcomingHours.map((hour: any) => (
            <div key={hour.time} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm font-medium text-gray-600 mb-2">
                {formatHour(hour.time)}
              </div>
              <div className="mb-2">
                {getWeatherIcon(hour.condition.text, hour.is_day, 'sm')}
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatTemperature(hour.temp_c, hour.temp_f, defaultSettings.unit)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {hour.chance_of_rain}% rain
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderDailyForecast = () => {
    if (!weatherData?.forecast) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">7-Day Forecast</h2>
        </div>
        
        <div className="space-y-4">
          {weatherData.forecast.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {index === 0 ? 'Today' : formatDate(day.date)}
                </div>
                <div className="flex items-center space-x-3">
                  {getWeatherIcon(day.day.condition.text)}
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {day.day.condition.text}
                    </div>
                    <div className="text-xs text-gray-600">
                      {day.daily_chance_of_rain}% chance of rain
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-800">
                      {formatTemperature(day.day.maxtemp_c, day.day.maxtemp_f, defaultSettings.unit)}
                    </div>
                    <div className="text-xs text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">
                      {formatTemperature(day.day.mintemp_c, day.day.mintemp_f, defaultSettings.unit)}
                    </div>
                    <div className="text-xs text-gray-600">Low</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderAstronomy = () => {
    if (!weatherData?.forecast?.[0]?.astro) return null;

    const astro = weatherData.forecast[0].astro;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Moon className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Sun & Moon</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Sunrise className="w-6 h-6 text-orange-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Sunrise</div>
                <div className="text-lg font-bold text-gray-800">{astro.sunrise}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Sunset className="w-6 h-6 text-red-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Sunset</div>
                <div className="text-lg font-bold text-gray-800">{astro.sunset}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Moon className="w-6 h-6 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Moon Phase</div>
                <div className="text-lg font-bold text-gray-800">{astro.moon_phase}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Moon Illumination</div>
                <div className="text-lg font-bold text-gray-800">{astro.moon_illumination}%</div>
              </div>
            </div>
          </div>
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
        className="bg-white rounded-2xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6">Weather Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={defaultSettings.location}
                onChange={(e) => handleSettingChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                placeholder="Enter city name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Unit</label>
              <select
                value={defaultSettings.unit}
                onChange={(e) => handleSettingChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
              >
                <option value="celsius">Celsius</option>
                <option value="fahrenheit">Fahrenheit</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={defaultSettings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-700">Auto refresh</label>
            </div>
            
            {defaultSettings.autoRefresh && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={defaultSettings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Loading weather data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load weather</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar isLoggedIn={true} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b pt-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Weather</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence>
          {renderCurrentWeather() && (
            <div key="current-weather">
              {renderCurrentWeather()}
            </div>
          )}
          {renderSettings() && (
            <div key="settings">
              {renderSettings()}
            </div>
          )}
          {renderHourlyForecast() && (
            <div key="hourly-forecast">
              {renderHourlyForecast()}
            </div>
          )}
          {renderDailyForecast() && (
            <div key="daily-forecast">
              {renderDailyForecast()}
            </div>
          )}
          {renderAstronomy() && (
            <div key="astronomy">
              {renderAstronomy()}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 