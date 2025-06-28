'use client';

import { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  Heart,
  DollarSign,
  Target,
  Zap,
  Loader2,
  ExternalLink,
  ArrowRight,
  Smile,
  FileText,
  CheckSquare,
  Cloud,
  Book,
  ChevronRight,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import { WidgetWrapper } from '../widgets/WidgetWrapper';
import { TaskWidget } from '../widgets/TaskWidget';
import { MoodWidget } from '../widgets/MoodWidget';
import { FinanceWidget } from '../widgets/FinanceWidget';
import { CalendarWidget } from '../widgets/CalendarWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders, widgetUtils } from '@/lib/utils';
import Image from 'next/image';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingModal } from './OnboardingModal';
import { WidgetPickerModal } from './WidgetPickerModal';
import { getDateStringForInput, getUserTimezone } from '@/utils/timezone';
import NotesWidget from '@/components/widgets/NotesWidget';
import { SkeletonTopBar, SkeletonHero, SkeletonServicesGrid, SkeletonTile, Skeleton } from '../ui/Skeleton';

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
  isSubscribed?: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  title?: string;
}

interface ServiceTile {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  gradient: string;
  isEnabled: boolean;
  data?: any;
  loading?: boolean;
  route: string;
}

const widgetComponents: { [key: string]: React.ComponentType<any> } = {
  'tasks': TaskWidget,
  'finance': FinanceWidget,
  'mood': MoodWidget,
  'notes': NotesWidget,
  'calendar': CalendarWidget,
};

const moodEmojis: { [key: number]: string } = {
  1: '😢',
  2: '😞',
  3: '😐',
  4: '😕',
  5: '😊',
  6: '😄',
  7: '😁',
  8: '😆',
  9: '🤩',
  10: '🥰'
};
const moodLabels: { [key: number]: string } = {
  1: 'Terrible',
  2: 'Very Bad',
  3: 'Bad',
  4: 'Not Great',
  5: 'Okay',
  6: 'Good',
  7: 'Great',
  8: 'Excellent',
  9: 'Amazing',
  10: 'Perfect'
};

/**
 * Returns true if dueDate is today (local time by default).
 * Pass useUTC=true to compare in UTC.
 */
function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  return (
    due.getUTCFullYear() === today.getUTCFullYear() &&
    due.getUTCMonth() === today.getUTCMonth() &&
    due.getUTCDate() === today.getUTCDate()
  );
}

export function Dashboard() {
  const [widgets, setWidgets] = useState<UserWidget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<Record<string, WidgetType[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [addingWidget, setAddingWidget] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
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
  const [profile, setProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [todaysMood, setTodaysMood] = useState<any | null>(null);
  const [todaysFinance, setTodaysFinance] = useState<any[]>([]);
  const dataLoadedRef = useRef(false);

  // Service tiles configuration - will be populated dynamically
  const [serviceTiles, setServiceTiles] = useState<ServiceTile[]>([]);

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
    
    if (todaysTasks.length === 0) {
      recommendations.push({
        type: 'task',
        message: 'No tasks scheduled for today',
        action: 'Add a task',
        icon: CheckSquare,
        color: 'blue'
      });
    }
    
    if (!todaysMood) {
      recommendations.push({
        type: 'mood',
        message: 'How are you feeling today?',
        action: 'Log your mood',
        icon: Smile,
        color: 'purple'
      });
      }
    
    if (todaysFinance.length === 0) {
      recommendations.push({
        type: 'finance',
        message: 'Track your daily expenses',
        action: 'Add expense',
        icon: DollarSign,
        color: 'green'
      });
    }
    
    return recommendations;
  };

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      const loadDashboardData = async () => {
        await Promise.all([
          fetchUserWidgets(),
          fetchAvailableWidgets(),
          calculateStats(),
          fetchTodaysData(),
          fetchProfile()
        ]);
      };
      
      await loadDashboardData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysData = async () => {
    try {
      const headers = await getAuthHeaders();
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's tasks
      try {
        const tasksResponse = await fetch(`/api/tasks?date=${today}`, { headers });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
          setTodaysTasks(tasksData.tasks || []);
        } else {
          console.warn('Failed to fetch tasks:', tasksResponse.status);
          setTodaysTasks([]);
        }
      } catch (error) {
        console.warn('Error fetching tasks:', error);
        setTodaysTasks([]);
      }
      
      // Fetch today's mood
      try {
        const moodResponse = await fetch(`/api/mood?date=${today}`, { headers });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
          setTodaysMood(moodData.mood || null);
        } else {
          console.warn('Failed to fetch mood:', moodResponse.status);
          setTodaysMood(null);
        }
      } catch (error) {
        console.warn('Error fetching mood:', error);
        setTodaysMood(null);
      }
      
      // Fetch today's finance entries
      try {
        const financeResponse = await fetch(`/api/finance?date=${today}`, { headers });
      if (financeResponse.ok) {
        const financeData = await financeResponse.json();
          setTodaysFinance(financeData.entries || []);
        } else {
          console.warn('Failed to fetch finance:', financeResponse.status);
          setTodaysFinance([]);
      }
    } catch (error) {
        console.warn('Error fetching finance:', error);
        setTodaysFinance([]);
      }
      
    } catch (error) {
      console.error('Error in fetchTodaysData:', error);
      // Set default values to prevent undefined errors
      setTodaysTasks([]);
      setTodaysMood(null);
      setTodaysFinance([]);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    if (notification.duration !== 0) {
      setTimeout(() => removeNotification(id), notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && !dataLoadedRef.current) {
        dataLoadedRef.current = true;
        await initializeDashboard();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleSignOut = async () => {
    try {
    await supabase.auth.signOut();
    router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchUserWidgets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widgets', { headers });
      
      if (response.ok) {
      const data = await response.json();
        setWidgets(data.widgets || []);
        
        // Populate service tiles based on widgets
        const tiles: ServiceTile[] = [];
        
        data.widgets.forEach((widget: UserWidget) => {
          const getServiceId = (widgetName: string) => {
            switch (widgetName) {
              case 'weather': return 'weather';
              case 'task_manager': return 'tasks';
              case 'finance_tracker': return 'finance';
              case 'mood_tracker': return 'mood';
              case 'notes': return 'notes';
              case 'habit_tracker': return 'habits';
              case 'calendar': return 'calendar';
              default: return widgetName;
            }
          };
          
          const getServiceRoute = (widgetName: string) => {
            switch (widgetName) {
              case 'weather': return '/dashboard/weather';
              case 'task_manager': return '/dashboard/tasks';
              case 'finance_tracker': return '/dashboard/finance';
              case 'mood_tracker': return '/dashboard/mood';
              case 'notes': return '/dashboard/notes';
              case 'habit_tracker': return '/dashboard/habits';
              case 'calendar': return '/dashboard/calendar';
              default: return '/dashboard';
            }
          };
          
          const serviceId = getServiceId(widget.widget_types.name);
          const serviceRoute = getServiceRoute(widget.widget_types.name);
          const existingTile = tiles.find(t => t.id === serviceId);
          
          if (!existingTile) {
            tiles.push({
              id: serviceId,
              name: widget.widget_types.name,
              displayName: widget.widget_types.display_name,
              description: widget.widget_types.description,
              icon: widget.widget_types.icon,
              category: widget.widget_types.category,
              color: getColorForCategory(widget.widget_types.category),
              gradient: getGradientForCategory(widget.widget_types.category),
              isEnabled: true,
              route: serviceRoute,
              loading: false
            });
          }
        });
        
        // Add "Add Service" tile
        tiles.push({
          id: 'add-service',
          name: 'add_service',
          displayName: 'Add Service',
          description: 'Discover and add new services to your dashboard',
          icon: 'Plus',
          category: 'system',
          color: 'gray',
          gradient: 'from-gray-500 to-gray-600',
          isEnabled: true,
          route: '#',
          loading: false
      });
      
        setServiceTiles(tiles);
      } else {
        console.error('Failed to fetch widgets:', response.status);
      }
    } catch (error) {
      console.error('Error fetching widgets:', error);
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widget-types', { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Widget types API response:', data);
        
        // The API returns { widgetTypes: groupedData }
        const widgetTypes = data.widgetTypes || data.widget_types || {};
        
        if (typeof widgetTypes === 'object' && widgetTypes !== null) {
          // It's already grouped by category
          setAvailableWidgets(widgetTypes);
        } else {
          console.warn('Invalid widget types data structure:', data);
          setAvailableWidgets({});
        }
      } else {
        console.error('Failed to fetch available widgets:', response.status);
        setAvailableWidgets({});
      }
    } catch (error) {
      console.error('Error fetching available widgets:', error);
      setAvailableWidgets({});
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
        const completedTasks = tasksData.tasks?.filter((task: any) => task.completed)?.length || 0;
        
        setStats(prev => ({
          ...prev,
          totalTasks,
          completedTasks
        }));
      }

      // Fetch mood stats
      const moodResponse = await fetch('/api/mood', { headers });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        const totalMoodEntries = moodData.moods?.length || 0;
        const averageMood = moodData.moods?.length > 0 
          ? moodData.moods.reduce((sum: number, mood: any) => sum + mood.rating, 0) / moodData.moods.length 
          : 0;
        
        setStats(prev => ({
          ...prev,
          totalMoodEntries,
          averageMood
        }));
      }

      // Fetch finance stats
      const financeResponse = await fetch('/api/finance', { headers });
      if (financeResponse.ok) {
        const financeData = await financeResponse.json();
        const totalFinanceEntries = financeData.entries?.length || 0;
        const totalBalance = financeData.entries?.reduce((sum: number, entry: any) => {
          return sum + (entry.type === 'income' ? entry.amount : -entry.amount);
        }, 0) || 0;
        
        setStats(prev => ({
          ...prev,
          totalFinanceEntries,
          totalBalance
        }));
      }
      
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const addWidget = async (widgetTypeId: string, displayName: string) => {
    try {
      setAddingWidget(widgetTypeId);
      setModalLoading(true);
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          widget_type_id: widgetTypeId,
          title: displayName,
          position_x: 0,
          position_y: 0,
          width: 2,
          height: 2,
          config: {},
          is_visible: true
        }),
      });

      if (response.ok) {
        const newWidget = await response.json();
        setWidgets(prev => [...prev, newWidget]);
        setShowWidgetPicker(false);
        
        // Refresh service tiles and available widgets
        await Promise.all([
          fetchUserWidgets(),
          fetchAvailableWidgets()
        ]);
      } else {
        throw new Error('Failed to add widget');
      }
    } catch (error) {
      console.error('Error adding widget:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add widget. Please try again.',
      });
    } finally {
      setAddingWidget(null);
      setModalLoading(false);
    }
  };

  const isWidgetTypeAdded = (widgetTypeId: string): boolean => {
    return widgets.some(widget => widget.widget_type_id === widgetTypeId);
  };

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
    const enabledWidgets = widgets.filter(widget => widget.is_visible);
    const totalWidgets = enabledWidgets.length;
    const activeWidgets = enabledWidgets.filter(widget => {
      // Check if widget has recent activity
      const widgetName = widget.widget_types.name;
      switch (widgetName) {
        case 'task_manager':
          return todaysTasks.length > 0;
        case 'mood_tracker':
          return todaysMood !== null;
        case 'finance_tracker':
          return todaysFinance.length > 0;
        case 'weather':
          return weatherData !== null;
        default:
          return true;
    }
    }).length;

    return { totalWidgets, activeWidgets };
  };

  const renderWidget = (widget: UserWidget) => {
    const WidgetComponent = widgetComponents[widget.widget_types.name];
    if (!WidgetComponent) {
      return null;
    }

    return (
      <WidgetWrapper
        key={widget.id}
        widget={widget}
        onDelete={handleDeleteWidget}
        onUpdate={handleUpdateWidget}
      >
        <WidgetComponent
          config={widget.config}
          onConfigChange={(newConfig: any) => handleUpdateWidget(widget.id, { config: newConfig })}
        />
      </WidgetWrapper>
    );
  };

  const filteredWidgetTypes = () => {
    const allWidgets = Object.values(availableWidgets).flat();
    if (selectedCategory === 'all') {
      return allWidgets.filter(widget => !isWidgetTypeAdded(widget.id));
    }
    return allWidgets.filter(widget => 
      widget.category === selectedCategory && !isWidgetTypeAdded(widget.id)
      );
  };

  const fetchProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Check if onboarding has been dismissed in this session
        const onboardingDismissed = localStorage.getItem('onboarding_dismissed');
        
        // Show onboarding only for new users who haven't completed it and haven't dismissed it
        const shouldShowOnboarding = data.profile && 
          data.profile.onboarding_completed === false && 
          !onboardingDismissed;
        
        if (shouldShowOnboarding) {
          setShowOnboarding(true);
        }
      } else {
        console.error('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          onboarding_completed: true
        }),
      });

      if (response.ok) {
        // Update local profile state
        setProfile((prev: any) => prev ? { ...prev, onboarding_completed: true } : null);
      } else {
        console.error('Failed to mark onboarding complete:', response.status);
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const refreshTodaysData = async () => {
    await fetchTodaysData();
    addNotification({
      type: 'success',
      title: 'Data Refreshed',
      message: 'Your dashboard data has been updated',
    });
  };

  const refreshDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserWidgets(),
        fetchAvailableWidgets(),
        calculateStats(),
        fetchTodaysData(),
        fetchProfile()
      ]);
      addNotification({
        type: 'success',
        title: 'Dashboard Refreshed',
        message: 'All data has been updated successfully',
      });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    // Mark as dismissed in localStorage to prevent showing again
    localStorage.setItem('onboarding_dismissed', 'true');
    
    // Try to update the profile, but don't fail if it doesn't work
    try {
      await markOnboardingComplete();
    } catch (error) {
      console.warn('Could not update profile, but onboarding will not show again');
    }
    
    setShowOnboarding(false);
    addNotification({
      type: 'success',
      title: 'Welcome!',
      message: 'Your dashboard is ready. Start exploring your services!',
    });
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
        
        // Refresh service tiles
        await fetchUserWidgets();
      } else {
        throw new Error('Failed to delete widget');
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const handleUpdateWidget = async (widgetId: string, updates: any) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedWidget = await response.json();
        setWidgets(prev => prev.map(widget => 
          widget.id === widgetId ? updatedWidget : widget
        ));
      } else {
        throw new Error('Failed to update widget');
      }
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  };

  const handleTileClick = (tile: ServiceTile) => {
    if (tile.id === 'add-service') {
      setShowWidgetPicker(true);
      return;
    }
    
    if (tile.isEnabled) {
          router.push(tile.route);
        } else {
          addNotification({
            type: 'info',
        title: 'Service Disabled',
        message: `${tile.displayName} is currently disabled`,
          });
    }
  };

  const handleUnsubscribeService = async (tile: ServiceTile) => {
    try {
      const widget = widgets.find(w => w.widget_types.name === tile.name);
      if (widget) {
        await handleDeleteWidget(widget.id);
        addNotification({
          type: 'success',
          title: 'Service Removed',
          message: `${tile.displayName} has been removed from your dashboard`,
      });
      }
    } catch (error) {
      console.error('Error unsubscribing from service:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove service. Please try again.',
      });
    }
  };

  const handleUnsubscribeFromModal = async (widgetTypeId: string, displayName: string) => {
    try {
      const widget = widgets.find(w => w.widget_type_id === widgetTypeId);
      if (widget) {
        await handleDeleteWidget(widget.id);
        
        // Refresh service tiles and available widgets
        await Promise.all([
          fetchUserWidgets(),
          fetchAvailableWidgets()
        ]);
      }
    } catch (error) {
      console.error('Error removing widget from modal:', error);
    }
  };

  const getTileIcon = (iconName: string) => {
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
      'User': User,
      'Bell': Bell,
      'Search': Search,
      'Menu': Menu,
      'X': X,
      'ChevronDown': ChevronDown,
      'Sparkles': Sparkles,
      'Loader2': Loader2,
      'ExternalLink': ExternalLink,
      'ArrowRight': ArrowRight,
      'AlertCircle': AlertCircle,
      'CheckCircle': CheckCircle,
      'HelpCircle': HelpCircle,
      'LogOut': LogOut,
      'Grid3X3': Grid3X3,
      'ChevronRight': ChevronRight,
      'Play': Play,
      'Pause': Pause,
      'MoreHorizontal': MoreHorizontal
    };
    return iconMap[iconName] || Plus;
  };

  const getTilePreviewData = (tile: ServiceTile) => {
    switch (tile.id) {
      case 'tasks':
        return {
          count: todaysTasks.length,
          label: 'tasks today',
          status: todaysTasks.length > 0 ? 'active' : 'empty'
        };
      case 'mood':
        return {
          count: todaysMood ? todaysMood.rating : null,
          label: todaysMood ? moodLabels[todaysMood.rating] : 'not logged',
          status: todaysMood ? 'logged' : 'empty'
        };
      case 'finance':
        return {
          count: todaysFinance.length,
          label: 'entries today',
          status: todaysFinance.length > 0 ? 'active' : 'empty'
        };
      case 'notes':
        return {
          count: null,
          label: 'notes',
          status: 'active'
        };
      default:
        return {
          count: null,
          label: 'service',
          status: 'active'
        };
    }
  };

  const getAvailableServices = () => {
    return serviceTiles.filter(tile => tile.id !== 'add-service');
  };

  const getColorForCategory = (category: string): string => {
    const colors: { [key: string]: string } = {
      'productivity': 'blue',
      'health': 'green',
      'finance': 'emerald',
      'weather': 'sky',
      'notes': 'purple',
      'system': 'gray'
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
      'system': 'from-gray-500 to-gray-600'
    };
    return gradients[category] || 'from-blue-500 to-blue-600';
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && !dataLoadedRef.current) {
          dataLoadedRef.current = true;
      initializeDashboard();
    } else if (user === null && !loading) {
      // User is not authenticated, redirect to auth
      router.push('/auth');
    }
  }, [user, router]);

  // Reset data loaded ref when user changes
  useEffect(() => {
    dataLoadedRef.current = false;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar isLoggedIn={true} />
        <main className="pt-16">
          <SkeletonHero />
          <SkeletonServicesGrid />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.refresh()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar isLoggedIn={true} />
      
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-20 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border-l-4 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'error' ? 'border-red-500' :
              notification.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            } p-4`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' :
                notification.type === 'error' ? 'bg-red-100' :
                notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                {notification.type === 'info' && <HelpCircle className="w-4 h-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <p className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</p>
                )}
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          {/* Apple-style background threads */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Curved thread 1 */}
            <div className="absolute top-10 left-1/4 w-96 h-96 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path
                  d="M 20 100 Q 50 20 100 100 T 180 100"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Curved thread 2 */}
            <div className="absolute top-20 right-1/3 w-80 h-80 opacity-8">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path
                  d="M 30 80 Q 80 30 130 80 T 170 80"
                  stroke="url(#gradient2)"
                  strokeWidth="1.5"
                  fill="none"
                  className="animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
                <defs>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Curved thread 3 */}
            <div className="absolute bottom-10 left-1/3 w-72 h-72 opacity-6">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path
                  d="M 40 60 Q 90 40 140 60 T 160 60"
                  stroke="url(#gradient3)"
                  strokeWidth="1"
                  fill="none"
                  className="animate-pulse"
                  style={{ animationDelay: '2s' }}
                />
                <defs>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Floating dots */}
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-bounce"></div>
            <div className="absolute top-1/3 left-1/5 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-25 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-1/4 right-1/5 w-1 h-1 bg-green-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.1) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
              className="text-center"
          >
              {!profile ? (
                <>
                  <Skeleton variant="text" className="h-12 mb-4 w-96 mx-auto" />
                  <Skeleton variant="text" className="h-6 w-2/3 mx-auto" />
                </>
              ) : (
                <>
                  <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                    {getTimeBasedGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Your personal command center for productivity, wellness, and life management
                  </p>
                </>
              )}
          </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">Your Services</h2>
              <p className="text-gray-600">Manage your daily tasks, track your mood, and stay organized</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceTiles.map((tile, index) => {
              const IconComponent = getTileIcon(tile.icon);
              const previewData = getTilePreviewData(tile);
              
              // Show skeleton if tile is loading
              if (tile.loading) {
                return (
                  <motion.div
                    key={tile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <SkeletonTile />
                  </motion.div>
                );
              }
              
              if (tile.id === 'add-service') {
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group cursor-pointer"
                  onMouseEnter={() => setHoveredTile(tile.id)}
                  onMouseLeave={() => setHoveredTile(null)}
                  onClick={() => handleTileClick(tile)}
                >
                    <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-blue-400 hover:bg-blue-50">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    
                    {/* Content */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Add Service
                      </h3>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        Discover and add new services to your dashboard
                      </p>
                      
                      {/* Services count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {getAvailableServices().filter(s => !s.isEnabled).length} services available
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <Link
                  key={tile.id}
                  href={tile.isEnabled ? tile.route : '#'}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onMouseEnter={() => setHoveredTile(tile.id)}
                    onMouseLeave={() => setHoveredTile(null)}
                    onClick={(e) => {
                      if (!tile.isEnabled) {
                        e.preventDefault();
                        addNotification({
                          type: 'info',
                          title: 'Service Disabled',
                          message: `${tile.displayName} is currently disabled`,
                        });
                      }
                    }}
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-gray-300">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {tile.displayName}
                      </h3>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        {tile.description}
                      </p>
                      
                      {/* Arrow indicator */}
                      <div className="flex items-center justify-end">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
                          </div>
                        </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onComplete={handleOnboardingComplete}
            onClose={() => setShowOnboarding(false)}
          />
        )}
        
        {showWidgetPicker && (
          <WidgetPickerModal
            isOpen={showWidgetPicker}
            onClose={() => setShowWidgetPicker(false)}
            availableWidgets={availableWidgets}
            onAddWidget={addWidget}
            addingWidget={addingWidget}
            enabledWidgets={widgets.map(w => w.widget_type_id)}
            onUnsubscribe={handleUnsubscribeFromModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 