'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, CheckCircle, Loader2 } from 'lucide-react';

interface WidgetType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  default_config: Record<string, any>;
  isSubscribed: boolean;
}

interface WidgetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: Record<string, WidgetType[]>;
  onAddWidget: (widgetTypeId: string, displayName: string) => Promise<void>;
  onUnsubscribe?: (widgetTypeId: string, displayName: string) => Promise<void>;
  addingWidget: string | null;
  enabledWidgets?: string[];
  isLoading?: boolean;
}

export function WidgetPickerModal({
  isOpen,
  onClose,
  availableWidgets,
  onAddWidget,
  onUnsubscribe,
  addingWidget,
  enabledWidgets,
  isLoading = false
}: WidgetPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredWidgetTypes = () => {
    console.log('WidgetPickerModal - filteredWidgetTypes called');
    console.log('availableWidgets:', availableWidgets);
    console.log('enabledWidgets:', enabledWidgets);
    
    if (!availableWidgets || Object.keys(availableWidgets).length === 0) {
      console.log('No availableWidgets, using fallback');
      // Fallback widget types if API data is not loaded
      const fallbackWidgets = {
        productivity: [
          {
            id: 'task_manager_fallback',
            name: 'task_manager',
            display_name: 'Task Manager',
            description: 'Manage your daily tasks and to-dos',
            icon: 'CheckSquare',
            category: 'productivity',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('task_manager')
          },
          {
            id: 'notes_fallback',
            name: 'notes',
            display_name: 'Quick Notes',
            description: 'Take quick notes and reminders',
            icon: 'FileText',
            category: 'productivity',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('notes')
          }
        ],
        health: [
          {
            id: 'habit_tracker_fallback',
            name: 'habit_tracker',
            display_name: 'Habit Tracker',
            description: 'Track your daily habits',
            icon: 'Target',
            category: 'health',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('habit_tracker')
          },
          {
            id: 'mood_tracker_fallback',
            name: 'mood_tracker',
            display_name: 'Mood Tracker',
            description: 'Track your daily mood and emotions',
            icon: 'Smile',
            category: 'health',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('mood_tracker')
          }
        ],
        finance: [
          {
            id: 'finance_tracker_fallback',
            name: 'finance_tracker',
            display_name: 'Finance Tracker',
            description: 'Monitor your expenses and budget',
            icon: 'DollarSign',
            category: 'finance',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('finance_tracker')
          }
        ],
        utility: [
          {
            id: 'weather_fallback',
            name: 'weather',
            display_name: 'Weather',
            description: 'Current weather information',
            icon: 'Cloud',
            category: 'utility',
            default_config: {},
            isSubscribed: enabledWidgets && enabledWidgets.includes('weather')
          }
        ]
      };
      
      let filtered = Object.values(fallbackWidgets).flat();
      console.log('Fallback widget types:', filtered);
      
      // Mark subscribed widgets but don't filter them out
      filtered = filtered.map(widget => ({
        ...widget,
        isSubscribed: enabledWidgets && enabledWidgets.includes(widget.name)
      }));
      
      console.log('Fallback widgets with subscription status:', filtered);
      return filtered;
    }
    
    let filtered = Object.values(availableWidgets).flat();
    console.log('All widget types before filtering:', filtered);
    
    // Mark subscribed widgets but don't filter them out
    filtered = filtered.map(widget => ({
      ...widget,
      isSubscribed: enabledWidgets && enabledWidgets.includes(widget.id)
    }));
    
    console.log('Widgets with subscription status:', filtered);
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(widget => widget.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(widget => 
        widget.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    console.log('Final filtered widgets:', filtered);
    return filtered;
  };

  const getWidgetIcon = (iconName: string) => {
    // Simple emoji mapping for widget icons
    const iconMap: { [key: string]: string } = {
      'Target': '🎯',
      'Heart': '❤️',
      'DollarSign': '💰',
      'TrendingUp': '📈',
      'Calendar': '📅',
      'Clock': '⏰',
      'HelpCircle': '❓',
      'Sparkles': '✨',
      'Zap': '⚡'
    };
    return iconMap[iconName] || '📦';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={isLoading ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-700 font-medium">Updating services...</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gray-900"
            >
              Subscribe to Services
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={isLoading ? undefined : onClose}
              disabled={isLoading}
              className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Close widget picker"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services to subscribe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {Object.keys(availableWidgets).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Services Grid */}
            {filteredWidgetTypes().length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No services found matching your criteria</p>
              </motion.div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(availableWidgets).map(([category, widgetTypes], categoryIndex) => {
                  const filteredWidgets = filteredWidgetTypes().filter(widget => widget.category === category);

                  if (filteredWidgets.length === 0) return null;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize flex items-center">
                        {category}
                        <span className="ml-2 text-sm text-gray-500">({filteredWidgets.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredWidgets.map((widgetType, index) => {
                          const isAdding = addingWidget === widgetType.id;
                          const isSubscribed = widgetType.isSubscribed;
                          
                          return (
                            <motion.div
                              key={widgetType.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                              whileHover={{
                                scale: isSubscribed ? 1 : 1.02,
                                y: isSubscribed ? 0 : -2,
                                transition: { duration: 0.2 }
                              }}
                              whileTap={{ scale: isSubscribed ? 1 : 0.98 }}
                              className={`border rounded-xl p-4 transition-all duration-200 ${
                                isSubscribed 
                                  ? 'border-green-200 bg-green-50 cursor-default' 
                                  : isAdding
                                    ? 'border-blue-300 bg-blue-50 cursor-wait'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg cursor-pointer'
                              }`}
                              onClick={() => {
                                if (!isSubscribed && !isAdding) {
                                  onAddWidget(widgetType.id, widgetType.display_name);
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <motion.div
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    isSubscribed ? 'bg-green-100' : 'bg-blue-100'
                                  }`}
                                  whileHover={{ scale: isSubscribed ? 1 : 1.1 }}
                                >
                                  <span className={`text-xl ${
                                    isSubscribed ? 'text-green-600' : 'text-blue-600'
                                  }`}>
                                    {getWidgetIcon(widgetType.icon)}
                                  </span>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className={`font-semibold truncate ${
                                      isSubscribed ? 'text-green-800' : 'text-gray-900'
                                    }`}>
                                      {widgetType.display_name}
                                    </h4>
                                    {isSubscribed && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Subscribed
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm mb-2 ${
                                    isSubscribed ? 'text-green-600' : 'text-gray-600'
                                  }`}>
                                    {widgetType.description}
                                  </p>
                                  {isAdding && (
                                    <div className="flex items-center text-sm text-blue-600">
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
                                      />
                                      Subscribing...
                                    </div>
                                  )}
                                  {isSubscribed && onUnsubscribe && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUnsubscribe(widgetType.id, widgetType.display_name);
                                      }}
                                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    >
                                      Unsubscribe
                                    </button>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isSubscribed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : isAdding ? (
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                  ) : (
                                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 