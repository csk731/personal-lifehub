'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, CheckCircle, Loader2, ChevronRight, Settings, User, Cloud, FileText, CheckSquare, Smile, DollarSign, Target, Calendar, Clock, Heart, Zap, TrendingUp, Book } from 'lucide-react';

interface WidgetType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  default_config: Record<string, any>;
  isSubscribed?: boolean;
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

  const getWidgetIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Plus': Plus,
      'CheckSquare': CheckSquare,
      'Smile': Smile,
      'DollarSign': DollarSign,
      'Cloud': Cloud,
      'FileText': FileText,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'Calendar': Calendar,
      'Clock': Clock,
      'Heart': Heart,
      'Zap': Zap,
      'Book': Book,
      'Settings': Settings,
      'User': User
    };
    return iconMap[iconName] || Plus;
  };

  const getColorForCategory = (category: string): string => {
    const colors: { [key: string]: string } = {
      'productivity': 'blue',
      'health': 'green',
      'finance': 'emerald',
      'weather': 'sky',
      'notes': 'purple',
      'system': 'gray',
      'utility': 'orange'
    };
    return colors[category] || 'blue';
  };

  const getGradientForCategory = (category: string): string => {
    const gradients: { [key: string]: string } = {
      'productivity': 'from-blue-500 to-blue-600',
      'health': 'from-green-500 to-green-600',
      'finance': 'from-emerald-500 to-emerald-600',
      'weather': 'from-sky-500 to-sky-600',
      'notes': 'from-purple-500 to-purple-600',
      'system': 'from-gray-500 to-gray-600',
      'utility': 'from-orange-500 to-orange-600'
    };
    return gradients[category] || 'from-blue-500 to-blue-600';
  };

  const filteredWidgetTypes = () => {
    // If no availableWidgets, return empty array
    if (!availableWidgets || Object.keys(availableWidgets).length === 0) {
      return [];
    }
    
    // Flatten all widgets from all categories
    let allWidgets = Object.values(availableWidgets).flat();
    
    // Mark subscribed widgets based on enabledWidgets
    allWidgets = allWidgets.map(widget => ({
      ...widget,
      isSubscribed: enabledWidgets && enabledWidgets.includes(widget.id)
    }));
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      allWidgets = allWidgets.filter(widget => widget.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      allWidgets = allWidgets.filter(widget => 
        widget.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allWidgets;
  };

  const handleUnsubscribe = async (widgetTypeId: string, displayName: string) => {
    if (onUnsubscribe) {
      await onUnsubscribe(widgetTypeId, displayName);
    }
  };

  if (!isOpen) return null;

  const allWidgets = filteredWidgetTypes();
  const categories = Object.keys(availableWidgets || {});

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/60 flex items-center justify-center p-4 z-50"
        onClick={isLoading ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-20">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-700 font-medium">Updating services...</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                Manage Services
              </h2>
              <p className="text-gray-600 text-sm">
                Add or remove services from your dashboard
              </p>
            </div>
            <button
              onClick={isLoading ? undefined : onClose}
              disabled={isLoading}
              className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Close widget picker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-700 placeholder-gray-400"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-700"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Services Grid */}
            {allWidgets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No services found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-8 max-h-[60vh] overflow-y-auto">
                {categories.map((category) => {
                  const categoryWidgets = allWidgets.filter(widget => widget.category === category);
                  
                  if (categoryWidgets.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                        {category}
                        <span className="ml-2 text-sm text-gray-500 font-normal">({categoryWidgets.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryWidgets.map((widgetType) => {
                          const isAdding = addingWidget === widgetType.id;
                          const isSubscribed = widgetType.isSubscribed;
                          const IconComponent = getWidgetIcon(widgetType.icon);
                          const gradientClass = getGradientForCategory(widgetType.category);
                          
                          return (
                            <div
                              key={widgetType.id}
                              className={`border rounded-xl p-4 transition-all duration-200 ${
                                isSubscribed 
                                  ? 'border-green-200 bg-green-50' 
                                  : isAdding
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-semibold truncate ${
                                      isSubscribed ? 'text-green-800' : 'text-gray-900'
                                    }`}>
                                      {widgetType.display_name}
                                    </h4>
                                    {isSubscribed && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm mb-3 ${
                                    isSubscribed ? 'text-green-600' : 'text-gray-600'
                                  }`}>
                                    {widgetType.description}
                                  </p>
                                  
                                  {isAdding && (
                                    <div className="flex items-center text-sm text-blue-600">
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                      Adding...
                                    </div>
                                  )}
                                  
                                  {!isSubscribed && !isAdding && (
                                    <button
                                      onClick={() => onAddWidget(widgetType.id, widgetType.display_name)}
                                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Add Service
                                    </button>
                                  )}
                                  
                                  {isSubscribed && onUnsubscribe && (
                                    <button
                                      onClick={() => handleUnsubscribe(widgetType.id, widgetType.display_name)}
                                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isSubscribed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : isAdding ? (
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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