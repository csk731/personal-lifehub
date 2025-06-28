'use client';

import React, { useState } from 'react';
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
  Zap,
  X,
  Save,
  Globe,
  ThermometerSun,
  Clock3,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { WeatherSettings } from '@/types';
import { TopBar } from '@/components/dashboard/TopBar';

export default function WeatherDashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempSettings, setTempSettings] = useState<WeatherSettings>({
    location: 'New York',
    unit: 'celsius',
    showForecast: true,
    showHourly: true,
    autoRefresh: true,
    refreshInterval: 10,
  });

  const { weatherData, isLoading, error, refreshWeather, updateSettings, settings } = useWeather(tempSettings);

  // Sync tempSettings with hook settings when they change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWeather();
    setIsRefreshing(false);
  };

  const handleSettingChange = (key: keyof WeatherSettings, value: any) => {
    const newSettings = { ...tempSettings, [key]: value };
    setTempSettings(newSettings);
  };

  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
  };

  const getWeatherIcon = (condition: string, isDay: boolean = true, size: 'sm' | 'md' | 'lg' = 'md') => {
    const conditionLower = condition.toLowerCase();
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-16 h-16'
    };
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <Sun className={`${sizeClasses[size]} text-yellow-400 drop-shadow-lg`} />;
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return <Cloud className={`${sizeClasses[size]} text-slate-400 drop-shadow-lg`} />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className={`${sizeClasses[size]} text-blue-400 drop-shadow-lg`} />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className={`${sizeClasses[size]} text-cyan-300 drop-shadow-lg`} />;
    } else if (conditionLower.includes('wind')) {
      return <Wind className={`${sizeClasses[size]} text-slate-400 drop-shadow-lg`} />;
    } else {
      return <Cloud className={`${sizeClasses[size]} text-slate-400 drop-shadow-lg`} />;
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
    const temp = formatTemperature(current.temp_c, current.temp_f, tempSettings.unit);
    const feelsLike = formatTemperature(current.feelslike_c, current.feelslike_f, tempSettings.unit);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-purple-600 rounded-3xl p-8 mb-8 shadow-2xl"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Weather Display */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-white/90" />
                <h1 className="text-3xl font-bold text-white">
                  {location.name}, {location.country}
                </h1>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-8 mb-8">
                <div className="transform hover:scale-110 transition-transform duration-300">
                  {getWeatherIcon(current.condition.text, current.is_day, 'lg')}
                </div>
                <div>
                  <div className="text-7xl font-bold text-white mb-2">{temp}</div>
                  <div className="text-xl text-white/80">Feels like {feelsLike}</div>
                </div>
              </div>
              
              <div className="text-2xl font-medium text-white/90 mb-6">
                {current.condition.text}
              </div>
              
              <div className="text-white/70 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                Last updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Droplets className="w-6 h-6 text-blue-200" />
                  <span className="text-white/90 font-medium">Humidity</span>
                </div>
                <div className="text-3xl font-bold text-white">{current.humidity}%</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Wind className="w-6 h-6 text-slate-200" />
                  <span className="text-white/90 font-medium">Wind</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {tempSettings.unit === 'celsius' ? current.wind_kph : current.wind_mph}
                  <span className="text-lg font-normal">
                    {tempSettings.unit === 'celsius' ? ' km/h' : ' mph'}
                  </span>
                </div>
                <div className="text-white/70 flex items-center space-x-1 mt-1">
                  <span className="text-lg">{getWindDirection(current.wind_dir)}</span>
                  <span>{current.wind_dir}</span>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Eye className="w-6 h-6 text-slate-200" />
                  <span className="text-white/90 font-medium">Visibility</span>
                </div>
                <div className="text-3xl font-bold text-white">{current.visibility_km} km</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Thermometer className="w-6 h-6 text-red-300" />
                  <span className="text-white/90 font-medium">UV Index</span>
                </div>
                <div className="text-3xl font-bold text-white">{current.uv}</div>
                <div className="text-white/70 text-sm mt-1">
                  {current.uv <= 2 ? 'Low' : current.uv <= 5 ? 'Moderate' : current.uv <= 7 ? 'High' : 'Very High'}
                </div>
              </motion.div>
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Hourly Forecast</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {upcomingHours.map((hour: any, index: number) => (
            <motion.div 
              key={hour.time}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50"
            >
              <div className="text-sm font-semibold text-gray-600 mb-3">
                {formatHour(hour.time)}
              </div>
              <div className="mb-4 flex justify-center">
                {getWeatherIcon(hour.condition.text, hour.is_day, 'sm')}
              </div>
              <div className="text-xl font-bold text-gray-800 mb-2">
                {formatTemperature(hour.temp_c, hour.temp_f, tempSettings.unit)}
              </div>
              <div className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-1">
                {hour.chance_of_rain}% rain
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderDailyForecast = () => {
    if (!weatherData?.forecast) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">7-Day Forecast</h2>
        </div>
        
        <div className="space-y-4">
          {weatherData.forecast.map((day, index) => (
            <motion.div 
              key={day.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50"
            >
              <div className="flex items-center space-x-6">
                <div className="w-20 text-lg font-semibold text-gray-700">
                  {index === 0 ? 'Today' : formatDate(day.date).split(',')[0]}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="transform hover:scale-110 transition-transform">
                    {getWeatherIcon(day.day.condition.text)}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {day.day.condition.text}
                    </div>
                    <div className="text-sm text-blue-600 bg-blue-50 rounded-full px-3 py-1 inline-block mt-1">
                      {day.day.daily_chance_of_rain}% chance of rain
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatTemperature(day.day.maxtemp_c, day.day.maxtemp_f, tempSettings.unit)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">High</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-600">
                    {formatTemperature(day.day.mintemp_c, day.day.mintemp_f, tempSettings.unit)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Low</div>
                </div>
              </div>
            </motion.div>
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 mb-8 shadow-xl border border-purple-200/50"
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Sun & Moon</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200/50"
            >
              <div className="p-3 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-xl">
                <Sunrise className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Sunrise</div>
                <div className="text-2xl font-bold text-gray-800">{astro.sunrise}</div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200/50"
            >
              <div className="p-3 bg-gradient-to-r from-red-400 to-orange-500 rounded-xl">
                <Sunset className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Sunset</div>
                <div className="text-2xl font-bold text-gray-800">{astro.sunset}</div>
              </div>
            </motion.div>
          </div>
          
          <div className="space-y-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50"
            >
              <div className="p-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl">
                <Moon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Moon Phase</div>
                <div className="text-2xl font-bold text-gray-800">{astro.moon_phase}</div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200/50"
            >
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Moon Illumination</div>
                <div className="text-2xl font-bold text-gray-800">{astro.moon_illumination}%</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSettings = () => {
    return (
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            
            {/* Settings Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Weather Settings</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>

                {/* Settings Content */}
                <div className="space-y-8">
                  {/* Location Setting */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <label className="text-lg font-semibold text-gray-700">Location</label>
                    </div>
                    <input
                      type="text"
                      value={tempSettings.location}
                      onChange={(e) => handleSettingChange('location', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 bg-white transition-all duration-300"
                      placeholder="Enter city name"
                    />
                  </div>

                  {/* Temperature Unit Setting */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <ThermometerSun className="w-5 h-5 text-orange-600" />
                      </div>
                      <label className="text-lg font-semibold text-gray-700">Temperature Unit</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSettingChange('unit', 'celsius')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          tempSettings.unit === 'celsius'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold">°C</div>
                          <div className="text-sm">Celsius</div>
                        </div>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSettingChange('unit', 'fahrenheit')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          tempSettings.unit === 'fahrenheit'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold">°F</div>
                          <div className="text-sm">Fahrenheit</div>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <label className="text-lg font-semibold text-gray-700">Display Options</label>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-800">Show Forecast</div>
                          <div className="text-sm text-gray-600">Display 7-day forecast</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSettingChange('showForecast', !tempSettings.showForecast)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                            tempSettings.showForecast ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: tempSettings.showForecast ? 24 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-800">Show Hourly</div>
                          <div className="text-sm text-gray-600">Display hourly forecast</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSettingChange('showHourly', !tempSettings.showHourly)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                            tempSettings.showHourly ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: tempSettings.showHourly ? 24 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Auto Refresh Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <label className="text-lg font-semibold text-gray-700">Auto Refresh</label>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-800">Auto Refresh</div>
                          <div className="text-sm text-gray-600">Automatically update weather data</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSettingChange('autoRefresh', !tempSettings.autoRefresh)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                            tempSettings.autoRefresh ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: tempSettings.autoRefresh ? 24 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>

                      {tempSettings.autoRefresh && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <label className="block text-sm font-medium text-gray-700">Refresh Interval (minutes)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={tempSettings.refreshInterval}
                            onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value) || 10)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 bg-white transition-all duration-300"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveSettings}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-purple-600 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/20 backdrop-blur-sm rounded-3xl p-12 border border-white/30"
        >
          <RefreshCw className="w-16 h-16 animate-spin text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Loading Weather</h2>
          <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              animate={{ x: [-100, 300] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/20 backdrop-blur-sm rounded-3xl p-12 border border-white/30 max-w-md"
        >
          <Cloud className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Weather Unavailable</h2>
          <p className="text-white/80 mb-8 text-lg">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="px-8 py-4 bg-white text-purple-600 rounded-2xl hover:bg-white/90 font-semibold text-lg shadow-lg transition-all duration-300"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <TopBar isLoggedIn={true} />
      
      {/* Header */}
      <div className="border-b border-white/20 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Weather Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 bg-white/30 backdrop-blur-sm"
              >
                <RefreshCw className={`w-6 h-6 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 bg-white/30 backdrop-blur-sm"
              >
                <Settings className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {renderCurrentWeather()}
          {settings.showHourly && renderHourlyForecast()}
          {settings.showForecast && renderDailyForecast()}
          {renderAstronomy()}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      {renderSettings()}
    </div>
  );
}
