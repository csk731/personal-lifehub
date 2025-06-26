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
  Book
} from 'lucide-react';
import { WidgetWrapper } from '../widgets/WidgetWrapper';
import { TaskWidget } from '../widgets/TaskWidget';
import { MoodWidget } from '../widgets/MoodWidget';
import { FinanceWidget } from '../widgets/FinanceWidget';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getAuthHeaders, widgetUtils } from '@/lib/utils';
import Image from 'next/image';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingModal } from './OnboardingModal';
import { WidgetPickerModal } from './WidgetPickerModal';

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

const widgetComponents = {
  'finance_tracker': FinanceWidget,
  'task_manager': TaskWidget,
  'mood_tracker': MoodWidget,
  // Add more widget components here as they're created
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
        recommendations.push('Start tracking your finances to understand your spending patterns');
      } else if (enabledStats.totalBalance < 0) {
        recommendations.push('Consider reviewing your expenses to improve your financial health');
      } else if (enabledStats.totalBalance > 1000) {
        recommendations.push('Great job managing your finances! Consider setting savings goals');
      }
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  };

  const fetchTodaysData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Fetch today's tasks
      const tasksResponse = await fetch('/api/tasks', { headers });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const tasks = tasksData.tasks || tasksData || [];
        const today = new Date().toISOString().split('T')[0];
        const todaysTasks = Array.isArray(tasks) ? tasks.filter((task: any) => 
          task.due_date === today && !task.completed
        ) : [];
        setTodaysTasks(todaysTasks);
      }
      
      // Fetch today's mood
      const moodResponse = await fetch('/api/mood', { headers });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        const entries = moodData.entries || moodData || [];
        const today = new Date().toISOString().split('T')[0];
        const todaysMood = Array.isArray(entries) ? entries.find((entry: any) => entry.date === today) : null;
        setTodaysMood(todaysMood || null);
      }
      
      // Fetch today's finance entries
      const financeResponse = await fetch('/api/finance', { headers });
      if (financeResponse.ok) {
        const financeData = await financeResponse.json();
        const entries = financeData.entries || financeData || [];
        const today = new Date().toISOString().split('T')[0];
        const todaysFinance = Array.isArray(entries) ? entries.filter((entry: any) => 
          entry.date === today
        ) : [];
        setTodaysFinance(todaysFinance);
      }
    } catch (error) {
      console.error('Error fetching today\'s data:', error);
      if (error instanceof Error && error.message.includes('auth')) {
        router.push('/auth');
      }
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
      if (user) {
      setUser(user);
        // Don't call fetchProfile here - it will be called in the second useEffect
      } else {
        console.log('No user found, redirecting to auth');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const fetchUserWidgets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widgets', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch widgets');
      }
      
      const data = await response.json();
      
      // Handle different possible response structures
      const widgets = data.widgets || data || [];
      
      if (!Array.isArray(widgets)) {
        console.error('Invalid widgets response:', data);
        setWidgets([]);
        return;
      }
      
      setWidgets(widgets);
      
      // Extract unique widget types from the widgets
      const widgetTypes = widgets.map((widget: any) => widget.widget_types).filter(Boolean);
      
      // Create dynamic service tiles based on actual widget types
      const dynamicTiles: ServiceTile[] = [
        // Always include the add-service tile first
        {
          id: 'add-service',
          name: 'add_service',
          displayName: 'Add Service',
          description: 'Subscribe to new services and features',
          icon: 'Plus',
          category: 'system',
          color: 'gray',
          gradient: 'from-gray-500 to-slate-500',
          isEnabled: true,
          route: '/dashboard/add-service'
        }
      ];
      
      // Add tiles for each unique widget type
      const seenTypes = new Set();
      widgetTypes.forEach((widgetType: any) => {
        if (!seenTypes.has(widgetType.name)) {
          seenTypes.add(widgetType.name);
          
          // Map widget type name to standardized service ID
          const getServiceId = (widgetName: string) => {
            const serviceMap: { [key: string]: string } = {
              'task_manager': 'task_manager',
              'tasks': 'task_manager',
              'mood_tracker': 'mood_tracker',
              'mood': 'mood_tracker',
              'finance_tracker': 'finance_tracker',
              'finance': 'finance_tracker',
              'profile': 'profile'
            };
            return serviceMap[widgetName] || widgetName;
          };
          
          // Map widget type to service tile
          const tile: ServiceTile = {
            id: getServiceId(widgetType.name),
            name: widgetType.name,
            displayName: widgetType.display_name,
            description: widgetType.description,
            icon: widgetType.icon,
            category: widgetType.category,
            color: getColorForCategory(widgetType.category),
            gradient: getGradientForCategory(widgetType.category),
            isEnabled: true, // All fetched widgets are enabled
            route: `/dashboard/${getServiceId(widgetType.name)}`
          };
          
          dynamicTiles.push(tile);
        }
      });
      
      // Add analytics tile at the end
      dynamicTiles.push({
        id: 'analytics',
        name: 'analytics',
        displayName: 'Analytics',
        description: 'View insights and trends across all services',
        icon: 'TrendingUp',
        category: 'insights',
        color: 'purple',
        gradient: 'from-purple-500 to-violet-500',
        isEnabled: true,
        route: '/dashboard/analytics'
      });
      
      setServiceTiles(dynamicTiles);
    } catch (err) {
      console.error('Error fetching user widgets:', err);
      setWidgets([]);
      if (err instanceof Error && err.message.includes('auth')) {
        router.push('/auth');
      } else {
      setError(err instanceof Error ? err.message : 'Failed to load widgets');
      }
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/widget-types', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available widgets');
      }
      
      const data = await response.json();
      
      // Handle the actual API response structure
      const widgetTypesData = data.widgetTypes || data.widget_types || data || {};
      
      if (typeof widgetTypesData !== 'object' || widgetTypesData === null) {
        console.error('Invalid widget types response:', data);
        setAvailableWidgets({});
        return;
      }
      
      // The API returns widgetTypes grouped by category, so we can use it directly
      setAvailableWidgets(widgetTypesData);
    } catch (err) {
      console.error('Error fetching available widgets:', err);
      setAvailableWidgets({});
      if (err instanceof Error && err.message.includes('auth')) {
        router.push('/auth');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load available widgets');
      }
    }
  };

  const calculateStats = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Calculate task stats
      const tasksResponse = await fetch('/api/tasks', { headers });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const tasks = tasksData.tasks || tasksData || [];
        const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
        const completedTasks = Array.isArray(tasks) ? tasks.filter((task: any) => task.completed).length : 0;
        setStats(prev => ({ ...prev, totalTasks, completedTasks }));
      }

      // Calculate mood stats
      const moodResponse = await fetch('/api/mood', { headers });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        const entries = moodData.entries || moodData || [];
        const totalMoodEntries = Array.isArray(entries) ? entries.length : 0;
        const averageMood = Array.isArray(entries) && entries.length > 0 
          ? entries.reduce((sum: number, entry: any) => sum + (entry.mood_score || 0), 0) / totalMoodEntries
          : 0;
        setStats(prev => ({ ...prev, totalMoodEntries, averageMood }));
      }

      // Calculate finance stats
      const financeResponse = await fetch('/api/finance', { headers });
      if (financeResponse.ok) {
        const financeData = await financeResponse.json();
        const entries = financeData.entries || financeData || [];
        const totalFinanceEntries = Array.isArray(entries) ? entries.length : 0;
        const totalBalance = Array.isArray(entries) ? entries.reduce((sum: number, entry: any) => {
          return sum + (entry.type === 'income' ? (entry.amount || 0) : -(entry.amount || 0));
        }, 0) : 0;
        setStats(prev => ({ ...prev, totalFinanceEntries, totalBalance }));
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
      if (error instanceof Error && error.message.includes('auth')) {
        router.push('/auth');
      }
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add widget');
      }

      const data = await response.json();
      const newWidget = data.widget || data;
      
      if (!newWidget) {
        throw new Error('Invalid response from server');
      }

      // Close modal first, then refresh data
      setShowWidgetPicker(false);
      setModalLoading(false);
      
      // Brief delay to show the modal closing animation
      setTimeout(async () => {
        // Refresh all dashboard data to ensure consistency
        await refreshDashboardData();
      }, 300);
      
      addNotification({
        type: 'success',
        message: `${displayName} service activated successfully!`,
        title: 'Service Added'
      });
    } catch (err) {
      console.error('Error adding widget:', err);
      setModalLoading(false);
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to add service',
        title: 'Error'
      });
    } finally {
      setAddingWidget(null);
    }
  };

  const isWidgetTypeAdded = (widgetTypeId: string): boolean => {
    return widgets.some(widget => widget.widget_type_id === widgetTypeId);
  };

  const isTaskWidgetEnabled = () => {
    return serviceTiles.find(tile => tile.id === 'task_manager')?.isEnabled || false;
  };

  const isMoodWidgetEnabled = () => {
    return serviceTiles.find(tile => tile.id === 'mood_tracker')?.isEnabled || false;
  };

  const isFinanceWidgetEnabled = () => {
    return serviceTiles.find(tile => tile.id === 'finance_tracker')?.isEnabled || false;
  };

  const getEnabledWidgetStats = () => {
    const enabledStats = { ...stats };
    
    if (!isTaskWidgetEnabled()) {
      enabledStats.totalTasks = 0;
      enabledStats.completedTasks = 0;
    }

    if (!isMoodWidgetEnabled()) {
      enabledStats.totalMoodEntries = 0;
      enabledStats.averageMood = 0;
    }

    if (!isFinanceWidgetEnabled()) {
      enabledStats.totalFinanceEntries = 0;
      enabledStats.totalBalance = 0;
    }

    return enabledStats;
  };

  const renderWidget = (widget: UserWidget) => {
    const WidgetComponent = widgetComponents[widget.widget_types.name as keyof typeof widgetComponents];
    
    if (!WidgetComponent) {
      return (
        <div key={widget.id} className="bg-white rounded-lg shadow p-4">
          <p>Unknown widget type: {widget.widget_types.name}</p>
          </div>
      );
    }

    return (
      <WidgetWrapper
        key={widget.id}
        widget={widget}
        onDelete={() => handleDeleteWidget(widget.id)}
        onUpdate={(updates) => handleUpdateWidget(widget.id, updates)}
      >
        <WidgetComponent widget={widget} />
      </WidgetWrapper>
    );
  };

  const filteredWidgetTypes = () => {
    if (!availableWidgets || Object.keys(availableWidgets).length === 0) {
      return [];
    }
    
    let filtered = Object.values(availableWidgets).flat();
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(widget => widget.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(widget => 
            widget.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            widget.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const fetchProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', { headers });
      
      if (response.ok) {
      const data = await response.json();
        const profileData = data.profile || data || null;
        setProfile(profileData);
        
        // Show onboarding if no profile exists
        if (!profileData) {
          setShowOnboarding(true);
        }
      } else {
        console.error('Failed to fetch profile:', response.status);
      setProfile(null);
    }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      if (error instanceof Error && error.message.includes('auth')) {
        router.push('/auth');
      }
    }
  };

  const refreshTodaysData = async () => {
    await Promise.all([
      fetchTodaysData(),
      calculateStats()
    ]);
  };

  // Comprehensive refresh function for when services are added/removed
  const refreshDashboardData = async () => {
    try {
      console.log('Refreshing dashboard data...');
      // Set loading state for service tiles
      setServiceTiles(prev => prev.map(tile => ({ ...tile, loading: true })));
      
      await Promise.all([
        fetchUserWidgets(), // Refresh widgets
        fetchAvailableWidgets(), // Refresh available widget types
        fetchTodaysData(), // Refresh today's data
        calculateStats() // Refresh statistics
      ]);
      
      // Clear loading state
      setServiceTiles(prev => prev.map(tile => ({ ...tile, loading: false })));
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      // Clear loading state on error
      setServiceTiles(prev => prev.map(tile => ({ ...tile, loading: false })));
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    addNotification({
      type: 'success',
      message: 'Welcome to LifeHub! Your profile has been created successfully.',
      title: 'Profile Created'
    });
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
    const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete widget');
      }

      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      addNotification({
        type: 'success',
        message: 'Widget removed successfully',
        title: 'Widget Deleted'
      });
    } catch (err) {
      console.error('Error deleting widget:', err);
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete widget',
        title: 'Error'
      });
    }
  };

  const handleUpdateWidget = async (widgetId: string, updates: any) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update widget');
      }

      const data = await response.json();
      const updatedWidget = data.widget || data;
      
      if (!updatedWidget) {
        throw new Error('Invalid response from server');
      }
      
      setWidgets(prev => prev.map(w => w.id === widgetId ? updatedWidget : w));
    } catch (err) {
      console.error('Error updating widget:', err);
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update widget',
        title: 'Error'
      });
    }
  };

  const handleTileClick = (tile: ServiceTile) => {
    console.log('Tile clicked:', tile);
    
    if (tile.id === 'add-service') {
      // Show widget picker to enable services
      setShowWidgetPicker(true);
      setSelectedCategory('all');
      setSearchQuery('');
      return;
    }
    
    if (tile.id === 'analytics') {
      // Analytics tile - could redirect to analytics page or show insights
      addNotification({
        type: 'info',
        message: 'Analytics feature coming soon!',
        title: 'Coming Soon'
      });
      return;
    }
    
    // Check if the service is enabled
    if (!tile.isEnabled) {
      // Show widget picker to enable the service
      setShowWidgetPicker(true);
      setSelectedCategory('all');
      setSearchQuery('');
      addNotification({
        type: 'info',
        message: `Please subscribe to ${tile.displayName} to access this service.`,
        title: 'Service Not Active'
      });
      return;
    }
    
    // Handle different service types
    switch (tile.id) {
      case 'task_manager':
      case 'tasks':
        router.push('/dashboard/tasks');
        break;
        
      case 'mood_tracker':
      case 'mood':
        router.push('/dashboard/mood');
        break;
        
      case 'finance_tracker':
      case 'finance':
        router.push('/dashboard/finance');
        break;
        
      case 'profile':
        router.push('/dashboard/profile');
        break;
        
      default:
        // For other services, try to navigate to their specific route
        if (tile.route && tile.route !== '/dashboard/add-service') {
          router.push(tile.route);
        } else {
          // Fallback: show notification that service page is not available
          addNotification({
            type: 'info',
            message: `${tile.displayName} service page is not available yet.`,
            title: 'Coming Soon'
          });
        }
        break;
    }
  };

  const handleUnsubscribeService = async (tile: ServiceTile) => {
    try {
      // Find the widget to delete
      const widgetToDelete = widgets.find(widget => widget.widget_type_id === tile.name);
      
      if (!widgetToDelete) {
        addNotification({
          type: 'error',
          message: 'Service not found',
          title: 'Error'
        });
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to unsubscribe from service');
      }

      // Remove widget from state
      setWidgets(prev => prev.filter(w => w.id !== widgetToDelete.id));
      
      // Update service tile to disabled
      setServiceTiles(prev => prev.map(t => 
        t.id === tile.id ? { ...t, isEnabled: false } : t
      ));
      
      addNotification({
        type: 'success',
        message: `${tile.displayName} service unsubscribed successfully!`,
        title: 'Service Unsubscribed'
      });
    } catch (err) {
      console.error('Error unsubscribing from service:', err);
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to unsubscribe from service',
        title: 'Error'
      });
    }
  };

  const handleUnsubscribeFromModal = async (widgetTypeId: string, displayName: string) => {
    try {
      setModalLoading(true);
      // Find the widget to delete
      const widgetToDelete = widgets.find(widget => widget.widget_type_id === widgetTypeId);
      
      if (!widgetToDelete) {
        addNotification({
          type: 'error',
          message: 'Service not found',
          title: 'Error'
        });
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/widgets/${widgetToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to unsubscribe from service');
      }

      // Close modal first, then refresh data
      setShowWidgetPicker(false);
      setModalLoading(false);
      
      // Brief delay to show the modal closing animation
      setTimeout(async () => {
        // Refresh all dashboard data to ensure consistency
        await refreshDashboardData();
      }, 300);
      
      addNotification({
        type: 'success',
        message: `${displayName} service unsubscribed successfully!`,
        title: 'Service Unsubscribed'
      });
    } catch (err) {
      console.error('Error unsubscribing from service:', err);
      setModalLoading(false);
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to unsubscribe from service',
        title: 'Error'
      });
    }
  };

  const getTileIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Plus,
      Target,
      Heart,
      DollarSign,
      TrendingUp,
      Calendar,
      Clock,
      HelpCircle,
      Sparkles,
      Zap,
      Smile,
      FileText,
      CheckSquare,
      Cloud,
      Book
    };
    return iconMap[iconName] || Target;
  };

  const getTilePreviewData = (tile: ServiceTile) => {
    switch (tile.id) {
      case 'task_manager':
        return {
          count: todaysTasks.length,
          label: 'tasks today',
          status: todaysTasks.length > 0 ? 'active' : 'empty'
        };
      case 'mood_tracker':
        return {
          count: todaysMood ? 1 : 0,
          label: 'mood logged',
          status: todaysMood ? 'logged' : 'empty'
        };
      case 'finance_tracker':
        return {
          count: todaysFinance.length,
          label: 'transactions',
          status: todaysFinance.length > 0 ? 'active' : 'empty'
        };
      case 'analytics':
        return {
          count: null,
          label: 'insights',
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

  // Get available services for subscription
  const getAvailableServices = () => {
    console.log('getAvailableServices called');
    console.log('availableWidgets:', availableWidgets);
    console.log('serviceTiles:', serviceTiles);
    
    // First try to get from availableWidgets (API response)
    // The API returns widgetTypes grouped by category, so we need to flatten it
    const allWidgetTypes = Object.values(availableWidgets).flat();
    console.log('allWidgetTypes from API:', allWidgetTypes);
    
    // Get currently subscribed widget names
    const subscribedWidgetNames = new Set(serviceTiles.map(tile => tile.name));
    console.log('subscribedWidgetNames:', subscribedWidgetNames);
    
    // If availableWidgets is empty, create a fallback list based on common widget types
    if (allWidgetTypes.length === 0) {
      console.log('Using fallback widget types');
      const fallbackWidgetTypes = [
        {
          name: 'habit_tracker',
          display_name: 'Habit Tracker',
          description: 'Track your daily habits and build routines',
          icon: 'Target',
          category: 'health'
        },
        {
          name: 'notes',
          display_name: 'Quick Notes',
          description: 'Take quick notes and reminders',
          icon: 'FileText',
          category: 'productivity'
        },
        {
          name: 'weather',
          display_name: 'Weather',
          description: 'Current weather information',
          icon: 'Cloud',
          category: 'utility'
        },
        {
          name: 'goals',
          display_name: 'Goals',
          description: 'Set and track your personal goals',
          icon: 'Target',
          category: 'productivity'
        },
        {
          name: 'meditation',
          display_name: 'Meditation',
          description: 'Track your meditation sessions',
          icon: 'Heart',
          category: 'wellness'
        },
        {
          name: 'reading',
          display_name: 'Reading Tracker',
          description: 'Track your reading progress',
          icon: 'Book',
          category: 'productivity'
        }
      ];
      
      // Filter out already subscribed widgets and return available ones
      const availableFromFallback = fallbackWidgetTypes.filter((widgetType: any) => 
        widgetType.name !== 'add_service' && 
        widgetType.name !== 'analytics' && 
        !subscribedWidgetNames.has(widgetType.name)
      ).map((widgetType: any) => ({
        id: widgetType.name,
        name: widgetType.name,
        displayName: widgetType.display_name,
        description: widgetType.description,
        icon: widgetType.icon,
        category: widgetType.category,
        color: getColorForCategory(widgetType.category),
        gradient: getGradientForCategory(widgetType.category),
        isEnabled: false,
        route: `/dashboard/${widgetType.name}`
      }));
      
      console.log('Available services from fallback:', availableFromFallback);
      return availableFromFallback;
    }
    
    // Filter out already subscribed widgets and return available ones
    const availableFromAPI = allWidgetTypes.filter((widgetType: any) => 
      widgetType.name !== 'add_service' && 
      widgetType.name !== 'analytics' && 
      !subscribedWidgetNames.has(widgetType.name)
    ).map((widgetType: any) => ({
      id: widgetType.name,
      name: widgetType.name,
      displayName: widgetType.display_name,
      description: widgetType.description,
      icon: widgetType.icon,
      category: widgetType.category,
      color: getColorForCategory(widgetType.category),
      gradient: getGradientForCategory(widgetType.category),
      isEnabled: false,
      route: `/dashboard/${widgetType.name}`
    }));
    
    console.log('Available services from API:', availableFromAPI);
    return availableFromAPI;
  };

  // Helper function to get color for widget category
  const getColorForCategory = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      productivity: 'blue',
      health: 'pink',
      finance: 'green',
      utility: 'orange',
      insights: 'purple',
      wellness: 'pink',
      default: 'gray'
    };
    return colorMap[category] || colorMap.default;
  };

  // Helper function to get gradient for widget category
  const getGradientForCategory = (category: string): string => {
    const gradientMap: { [key: string]: string } = {
      productivity: 'from-blue-500 to-cyan-500',
      health: 'from-pink-500 to-rose-500',
      finance: 'from-green-500 to-emerald-500',
      utility: 'from-orange-500 to-amber-500',
      insights: 'from-purple-500 to-violet-500',
      wellness: 'from-pink-500 to-rose-500',
      default: 'from-gray-500 to-slate-500'
    };
    return gradientMap[category] || gradientMap.default;
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await checkUser();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (user && !dataLoadedRef.current) {
      const loadDashboardData = async () => {
        try {
          dataLoadedRef.current = true;
          await Promise.all([
            fetchProfile(),
            fetchUserWidgets(),
            fetchAvailableWidgets(),
            fetchTodaysData(),
            calculateStats()
          ]);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setError('Failed to load dashboard data');
        } finally {
          setLoading(false);
    }
  };
      
      loadDashboardData();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.refresh()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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

      <main className="pt-20 px-4 pb-8">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getTimeBasedGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Welcome to your personal command center
            </p>
          </motion.div>

          {/* Service Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {serviceTiles.map((tile, index) => {
              const IconComponent = getTileIcon(tile.icon);
              const previewData = getTilePreviewData(tile);
              
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative group cursor-pointer h-64 ${
                    tile.isEnabled ? 'opacity-100' : 'opacity-60'
                  }`}
                  onMouseEnter={() => setHoveredTile(tile.id)}
                  onMouseLeave={() => setHoveredTile(null)}
                  onClick={() => handleTileClick(tile)}
                >
                  <motion.div
                    className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 h-full ${
                      hoveredTile === tile.id ? 'scale-105' : 'scale-100'
                    }`}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    {/* Content */}
                    <div className="relative p-6 h-full flex flex-col">
                      {/* Loading Overlay */}
                      {tile.loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-600">Updating...</span>
                        </div>
                            </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                          </div>
                        <div className="flex items-center space-x-2">
                          {tile.isEnabled ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {tile.displayName}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 flex-1">
                        {tile.description}
                      </p>
                      
                      {/* Preview Data - Only show for enabled services that aren't the add service tile */}
                      {tile.id !== 'add-service' && (
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center space-x-2">
                            {previewData.count !== null ? (
                              <span className="text-2xl font-bold text-gray-900">
                                {previewData.count}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                            <span className="text-sm text-gray-500">
                              {previewData.label}
                            </span>
          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
                      )}
                      
                      {/* Add Service Tile - Simple call to action */}
                      {tile.id === 'add-service' && (
                        <div className="mt-auto">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {getAvailableServices().filter(s => !s.isEnabled).length} services available
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
                      )}
                      
                      {/* Status Indicator - Only show for non-add-service tiles */}
                      {tile.id !== 'add-service' && (
                        <div className="mt-4 flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            previewData.status === 'active' || previewData.status === 'logged' ? 'bg-green-500' :
                            previewData.status === 'empty' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-500 capitalize">
                            {previewData.status}
                                    </span>
                                  </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                                    </div>
                  </motion.div>
                </motion.div>
                            );
                          })}
                        </div>
                      </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
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
            isLoading={modalLoading}
          />
        )}
      </AnimatePresence>
      </div>
  );
} 