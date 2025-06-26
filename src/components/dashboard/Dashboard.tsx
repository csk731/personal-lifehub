'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Grid3X3, 
  LogOut, 
  AlertCircle, 
  CheckCircle, 
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  HelpCircle
} from 'lucide-react';
import { WidgetWrapper } from '../widgets/WidgetWrapper';
import { TaskWidget } from '../widgets/TaskWidget';
import { MoodWidget } from '../widgets/MoodWidget';
import { FinanceWidget } from '../widgets/FinanceWidget';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getAuthHeaders, widgetUtils } from '@/lib/utils';

interface UserWidget {
  id: string;
  widget_type_id: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config: Record<string, any>;
  is_visible: boolean;
  widget_types: {
    name: string;
    display_name: string;
    description: string;
    icon: string;
    category: string;
    default_config: Record<string, any>;
  };
}

interface WidgetType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  default_config: Record<string, any>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  title?: string;
}

const widgetComponents = {
  'finance_tracker': FinanceWidget,
  'task_manager': TaskWidget,
  'mood_tracker': MoodWidget,
  // Add more widget components here as they're created
};

export function Dashboard() {
  const [widgets, setWidgets] = useState<UserWidget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<Record<string, WidgetType[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [addingWidget, setAddingWidget] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalMoodEntries: 0,
    averageMood: 0,
    totalFinanceEntries: 0,
    totalBalance: 0
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  // Helper functions for Smart Dashboard Insights
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getSmartRecommendations = () => {
    const recommendations = [];
    const enabledStats = getEnabledWidgetStats();
    
    // Task-based recommendations (only if task widget is enabled)
    if (isTaskWidgetEnabled()) {
      if (enabledStats.totalTasks === 0) {
        recommendations.push('Start your productivity journey by adding your first task');
      } else if (enabledStats.completedTasks === 0) {
        recommendations.push('You have tasks to complete - start with the most important one');
      } else if (enabledStats.completedTasks / enabledStats.totalTasks < 0.5) {
        recommendations.push('Focus on completing more tasks today to boost your productivity');
      } else if (enabledStats.completedTasks / enabledStats.totalTasks >= 0.8) {
        recommendations.push('Excellent progress! You\'re on track for a productive day');
      }
    }
    
    // Mood-based recommendations (only if mood widget is enabled)
    if (isMoodWidgetEnabled()) {
      if (enabledStats.totalMoodEntries === 0) {
        recommendations.push('Track your mood to understand your emotional patterns');
      } else if (enabledStats.averageMood < 5) {
        recommendations.push('Your mood seems low - consider taking a break or doing something you enjoy');
      } else if (enabledStats.averageMood >= 8) {
        recommendations.push('Great mood! Keep up the positive energy');
      }
    }
    
    // Finance-based recommendations (only if finance widget is enabled)
    if (isFinanceWidgetEnabled()) {
      if (enabledStats.totalFinanceEntries === 0) {
        recommendations.push('Start tracking your finances to better understand your spending habits');
      } else if (enabledStats.totalBalance < 0) {
        recommendations.push('Consider reviewing your expenses to improve your financial health');
      } else if (enabledStats.totalBalance > 1000) {
        recommendations.push('Great job managing your finances! Consider setting savings goals');
      }
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('You\'re doing great! Keep up the consistent tracking');
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + N: Add new widget
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowWidgetPicker(true);
      }

      // Ctrl/Cmd + T: Go to tasks
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        router.push('/dashboard/tasks');
      }

      // Ctrl/Cmd + M: Go to mood
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        router.push('/dashboard/mood');
      }

      // Ctrl/Cmd + F: Go to finance
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        router.push('/dashboard/finance');
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (showWidgetPicker) {
          setShowWidgetPicker(false);
        }
        if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showWidgetPicker, sidebarOpen, router]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (widgets.length > 0) {
      calculateStats();
    }
  }, [widgets]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await Promise.all([fetchUserWidgets(), fetchAvailableWidgets()]);
    } catch (err) {
      setError('Failed to check user authentication');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const fetchUserWidgets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widgets', {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user widgets');
      }
      const data = await response.json();
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widgets');
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const response = await fetch('/api/widget-types');
      if (!response.ok) {
        throw new Error('Failed to fetch widget types');
      }
      const data = await response.json();
      setAvailableWidgets(data.widgetTypes || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widget types');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Fetch tasks stats
      const tasksResponse = await fetch('/api/tasks', { headers });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const totalTasks = tasksData.tasks?.length || 0;
        const completedTasks = tasksData.tasks?.filter((t: any) => t.status === 'completed').length || 0;
        setStats(prev => ({ ...prev, totalTasks, completedTasks }));
      }

      // Fetch mood stats
      const moodResponse = await fetch('/api/mood', { headers });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        const totalMoodEntries = moodData.entries?.length || 0;
        const averageMood = moodData.entries?.length > 0 
          ? moodData.entries.reduce((sum: number, entry: any) => sum + entry.mood_score, 0) / moodData.entries.length 
          : 0;
        setStats(prev => ({ ...prev, totalMoodEntries, averageMood: Math.round(averageMood * 10) / 10 }));
      }

      // Fetch finance stats
      const financeResponse = await fetch('/api/finance', { headers });
      if (financeResponse.ok) {
        const financeData = await financeResponse.json();
        const totalFinanceEntries = financeData.entries?.length || 0;
        const totalBalance = financeData.entries?.reduce((sum: number, entry: any) => {
          return sum + (entry.type === 'income' ? entry.amount : -entry.amount);
        }, 0) || 0;
        setStats(prev => ({ ...prev, totalFinanceEntries, totalBalance }));
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const addWidget = async (widgetTypeId: string, displayName: string) => {
    try {
      setAddingWidget(widgetTypeId);
      
      // Calculate optimal position for the new widget
      const position = widgetUtils.calculateOptimalPosition(widgets);
      
      // Generate unique title if needed
      const existingTitles = widgets.map(w => w.title);
      const uniqueTitle = widgetUtils.generateUniqueTitle(displayName, existingTitles);
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          widget_type_id: widgetTypeId,
          title: uniqueTitle,
          position_x: position.x,
          position_y: position.y,
          width: 1,
          height: 1
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicate widget error
          addNotification({
            type: 'warning',
            title: 'Widget Already Added',
            message: data.error,
            duration: 6000
          });
          return;
        }
        throw new Error(data.error || 'Failed to add widget');
      }

      setWidgets(prev => [...prev, data.widget]);
      setShowWidgetPicker(false);
      addNotification({
        type: 'success',
        title: 'Widget Added',
        message: data.message || `${displayName} widget added successfully!`,
        duration: 3000
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add widget';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 6000
      });
    } finally {
      setAddingWidget(null);
    }
  };

  const isWidgetTypeAdded = (widgetTypeId: string): boolean => {
    return widgets.some(widget => widget.widget_type_id === widgetTypeId);
  };

  // Helper functions to check enabled widgets
  const isTaskWidgetEnabled = () => {
    return widgets.some(widget => widget.widget_types.name === 'task_manager');
  };

  const isMoodWidgetEnabled = () => {
    return widgets.some(widget => widget.widget_types.name === 'mood_tracker');
  };

  const isFinanceWidgetEnabled = () => {
    return widgets.some(widget => widget.widget_types.name === 'finance_tracker');
  };

  const getEnabledWidgetStats = () => {
    const enabledStats = {
      totalTasks: 0,
      completedTasks: 0,
      totalMoodEntries: 0,
      averageMood: 0,
      totalFinanceEntries: 0,
      totalBalance: 0
    };

    // Only calculate stats for enabled widgets
    if (isTaskWidgetEnabled()) {
      enabledStats.totalTasks = stats.totalTasks;
      enabledStats.completedTasks = stats.completedTasks;
    }

    if (isMoodWidgetEnabled()) {
      enabledStats.totalMoodEntries = stats.totalMoodEntries;
      enabledStats.averageMood = stats.averageMood;
    }

    if (isFinanceWidgetEnabled()) {
      enabledStats.totalFinanceEntries = stats.totalFinanceEntries;
      enabledStats.totalBalance = stats.totalBalance;
    }

    return enabledStats;
  };

  const renderWidget = (widget: UserWidget) => {
    const WidgetComponent = widgetComponents[widget.widget_types.name as keyof typeof widgetComponents];
    
    if (!WidgetComponent) {
      return (
        <WidgetWrapper 
          key={widget.id} 
          widget={{
            id: widget.id,
            width: widget.width,
            height: widget.height,
            name: widget.title
          }}
        >
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Widget type "{widget.widget_types.display_name}" not implemented yet</p>
            <p className="text-xs text-gray-400 mt-1">{widget.widget_types.description}</p>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetComponent
        key={widget.id}
        widgetId={widget.id}
        title={widget.title}
        config={widget.config || widget.widget_types.default_config || {}}
        widget={{
          id: widget.id,
          width: widget.width,
          height: widget.height,
          name: widget.title
        }}
      />
    );
  };

  const filteredWidgetTypes = () => {
    let filtered = availableWidgets;
    
    if (selectedCategory !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(availableWidgets).filter(([category]) => category === selectedCategory)
      );
    }
    
    if (searchQuery) {
      filtered = Object.fromEntries(
        Object.entries(filtered).map(([category, widgets]) => [
          category,
          widgets.filter(widget => 
            widget.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            widget.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        ]).filter(([_, widgets]) => widgets.length > 0)
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading your dashboard...</h3>
          <p className="text-gray-600 font-medium">Preparing your personalized experience</p>
          <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
          
          {/* Loading Skeleton for Insights Panel */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-blue-100 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg w-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              Promise.all([fetchUserWidgets(), fetchAvailableWidgets()]);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-start space-x-3 p-4 rounded-xl shadow-lg border-l-4 transform transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-400 text-red-800'
                : notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                : 'bg-blue-50 border-blue-400 text-blue-800'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : notification.type === 'warning' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {notification.title && (
                <p className="text-sm font-semibold mb-1">{notification.title}</p>
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full max-h-screen">
          {/* Sidebar Header - Fixed at top */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LifeHub</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <nav className="space-y-2">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
                >
                  <Grid3X3 className="w-5 h-5" />
                  <span>Dashboard</span>
                </a>
                {isTaskWidgetEnabled() && (
                  <button
                    onClick={() => router.push('/dashboard/tasks')}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Tasks</span>
                  </button>
                )}
                {isMoodWidgetEnabled() && (
                  <button
                    onClick={() => router.push('/dashboard/mood')}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Mood</span>
                  </button>
                )}
                {isFinanceWidgetEnabled() && (
                  <button
                    onClick={() => router.push('/dashboard/finance')}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Finance</span>
                  </button>
                )}
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer - Fixed at bottom */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Adjusted for fixed sidebar */}
      <div className="lg:ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Navigation - Simplified */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                {getTimeBasedGreeting()}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Help Button */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
              title="Keyboard Shortcuts (?)"
              aria-label="Show keyboard shortcuts help"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                ?
              </span>
            </button>
            
            {/* Add Widget Button */}
            <button
              onClick={() => setShowWidgetPicker(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
              title="Add Widget (Ctrl+N)"
            >
              <Plus className="w-4 h-4" />
              <span>Add Widget</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Smart Dashboard Insights Panel - Streamlined */}
            {[isTaskWidgetEnabled(), isMoodWidgetEnabled(), isFinanceWidgetEnabled()].some(Boolean) && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Overview</h2>
                    <p className="text-gray-600">Your key metrics at a glance</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className={`grid gap-4 mb-6 ${
                  [isTaskWidgetEnabled(), isMoodWidgetEnabled(), isFinanceWidgetEnabled()].filter(Boolean).length === 1 
                    ? 'grid-cols-1' 
                    : [isTaskWidgetEnabled(), isMoodWidgetEnabled(), isFinanceWidgetEnabled()].filter(Boolean).length === 2 
                    ? 'grid-cols-1 md:grid-cols-2' 
                    : 'grid-cols-1 md:grid-cols-3'
                }`}>
                  {/* Tasks Metric */}
                  {isTaskWidgetEnabled() && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <button
                          onClick={() => router.push('/dashboard/tasks')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{getEnabledWidgetStats().totalTasks}</span>
                        <span className="text-sm text-gray-600">tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getEnabledWidgetStats().totalTasks > 0 ? (getEnabledWidgetStats().completedTasks / getEnabledWidgetStats().totalTasks) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getEnabledWidgetStats().completedTasks} completed
                      </p>
                    </div>
                  )}

                  {/* Mood Metric */}
                  {isMoodWidgetEnabled() && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <button
                          onClick={() => router.push('/dashboard/mood')}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Log Mood
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{getEnabledWidgetStats().averageMood}/10</span>
                        <span className="text-sm text-gray-600">average</span>
                      </div>
                      <div className="flex items-center space-x-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              i < Math.floor(getEnabledWidgetStats().averageMood / 2) ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {getEnabledWidgetStats().totalMoodEntries} entries
                      </p>
                    </div>
                  )}

                  {/* Finance Metric */}
                  {isFinanceWidgetEnabled() && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <button
                          onClick={() => router.push('/dashboard/finance')}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Add Entry
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-2xl font-bold ${getEnabledWidgetStats().totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${getEnabledWidgetStats().totalBalance.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">balance</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                            getEnabledWidgetStats().totalBalance >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(Math.abs(getEnabledWidgetStats().totalBalance) / 1000 * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getEnabledWidgetStats().totalFinanceEntries} transactions
                      </p>
                    </div>
                  )}
                </div>

                {/* Smart Recommendations - Only if there are actionable insights */}
                {getSmartRecommendations().length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Quick Tips</h3>
                        <div className="space-y-2">
                          {getSmartRecommendations().slice(0, 2).map((recommendation, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Widgets Section - Simplified */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Widgets</h2>
                <p className="text-sm text-gray-600">
                  {widgets.length === 0 ? 'Get started by adding your first widget' : `${widgets.length} active widget${widgets.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Widgets Grid */}
            {widgets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Grid3X3 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to LifeHub!</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by adding your first widget. Choose from task management, mood tracking, 
                  finance monitoring, and more to customize your personal dashboard.
                </p>
                <button
                  onClick={() => setShowWidgetPicker(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Your First Widget</span>
                </button>
              </div>
            ) : (
              <div className="columns-1 lg:columns-2 gap-6 space-y-6">
                {widgets.map(renderWidget)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Widget</h2>
                <p className="text-gray-600 mt-1">Choose from our collection of widgets</p>
              </div>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search widgets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(availableWidgets).map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Widgets Grid */}
              {Object.keys(filteredWidgetTypes()).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No widgets found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                  {Object.entries(filteredWidgetTypes()).map(([category, widgetTypes]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize flex items-center">
                        {category}
                        <span className="ml-2 text-sm text-gray-500">({widgetTypes.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {widgetTypes.map((widgetType) => {
                          const isAdded = isWidgetTypeAdded(widgetType.id);
                          const isAdding = addingWidget === widgetType.id;
                          
                          return (
                            <div
                              key={widgetType.id}
                              className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                                isAdded 
                                  ? 'border-green-300 bg-green-50 cursor-not-allowed'
                                  : isAdding
                                  ? 'border-blue-300 bg-blue-50 cursor-wait'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                              }`}
                              onClick={() => {
                                if (!isAdded && !isAdding) {
                                  addWidget(widgetType.id, widgetType.display_name);
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  isAdded ? 'bg-green-100' : 'bg-blue-100'
                                }`}>
                                  <span className={`text-xl ${
                                    isAdded ? 'text-green-600' : 'text-blue-600'
                                  }`}>
                                    {widgetUtils.getWidgetIcon(widgetType.icon)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 truncate">{widgetType.display_name}</h4>
                                    {isAdded && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Added
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{widgetType.description}</p>
                                  {isAdding && (
                                    <div className="flex items-center text-sm text-blue-600">
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                      Adding...
                                    </div>
                                  )}
                                  {isAdded && (
                                    <p className="text-xs text-green-600">Already added to your dashboard</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                <p className="text-gray-600 mt-1">Use these shortcuts to navigate and manage your dashboard</p>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Navigation</h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Go to Tasks</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">Ctrl+T</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Go to Mood</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">Ctrl+M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Go to Finance</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">Ctrl+F</kbd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Grid3X3 className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Add Widget</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">Ctrl+N</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Close Modals</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Show Help</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">?</kbd>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> These shortcuts work when you're not typing in input fields. 
                  Use them to navigate quickly and boost your productivity!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 