'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Search,
  Filter,
  SortAsc,
  Calendar,
  Tag,
  ArrowLeft,
  Edit3,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  X,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  CalendarDays,
  Zap,
  ListTodo,
  Circle,
  MinusCircle
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const priorityColors = {
  low: { text: 'text-gray-500', bg: 'bg-gray-100', icon: MinusCircle, emoji: '🟢' },
  medium: { text: 'text-blue-600', bg: 'bg-blue-100', icon: Circle, emoji: '🟡' },
  high: { text: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle, emoji: '🟠' },
  urgent: { text: 'text-red-600', bg: 'bg-red-100', icon: Zap, emoji: '🔴' }
}

const statusColors = {
  pending: { text: 'text-gray-600', bg: 'bg-gray-100', icon: Clock, emoji: '⏳' },
  in_progress: { text: 'text-blue-600', bg: 'bg-blue-100', icon: Play, emoji: '▶️' },
  completed: { text: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, emoji: '✅' },
  cancelled: { text: 'text-red-600', bg: 'bg-red-100', icon: X, emoji: '❌' }
}

const categoryIcons = {
  'work': { emoji: '💼', color: 'text-blue-600' },
  'personal': { emoji: '👤', color: 'text-purple-600' },
  'health': { emoji: '🏥', color: 'text-green-600' },
  'finance': { emoji: '💰', color: 'text-yellow-600' },
  'shopping': { emoji: '🛍️', color: 'text-pink-600' },
  'home': { emoji: '🏠', color: 'text-indigo-600' },
  'study': { emoji: '📚', color: 'text-teal-600' },
  'other': { emoji: '📋', color: 'text-gray-600' }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    category: 'other',
    tags: [] as string[]
  });
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    search: '',
    category: ''
  });
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedView, setSelectedView] = useState<'all' | 'today' | 'overdue'>('today');
  const [swipeStates, setSwipeStates] = useState<Record<string, { x: number; isSwiping: boolean }>>({});
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAddModal) return;
      
      if (e.code === 'Space' && !showAddModal) {
        e.preventDefault();
        setShowAddModal(true);
      }
      
      if (e.code === 'KeyF' && e.ctrlKey) {
        e.preventDefault();
        setShowFilters(!showFilters);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, showFilters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/tasks', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    try {
      if (!newTask.title.trim()) return;

      setSaving(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          category: newTask.category,
          tags: newTask.tags.filter(tag => tag.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const data = await response.json();
      setTasks(prev => [data.task, ...prev]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'other',
        tags: []
      });
      setShowAddModal(false);
      setShowSuggestions(false);
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Swipe gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setSwipeStates(prev => ({
      ...prev,
      [taskId]: { x: 0, isSwiping: false }
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      e.preventDefault();
      setSwipeStates(prev => ({
        ...prev,
        [taskId]: { x: deltaX, isSwiping: true }
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, taskId: string) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    
    // Swipe left to delete (deltaX < -50)
    if (deltaX < -50) {
      deleteTask(taskId);
    }
    // Swipe right to complete (deltaX > 50)
    else if (deltaX > 50) {
      updateTaskStatus(taskId, 'completed');
    }
    
    // Reset swipe state
    setSwipeStates(prev => ({
      ...prev,
      [taskId]: { x: 0, isSwiping: false }
    }));
    setTouchStart(null);
  };

  // Smart category suggestions based on title
  const getCategorySuggestions = (title: string) => {
    const titleLower = title.toLowerCase();
    const suggestions: string[] = [];
    
    // Work-related keywords
    if (titleLower.includes('meeting') || titleLower.includes('call') || titleLower.includes('email') || titleLower.includes('report') || titleLower.includes('presentation') || titleLower.includes('deadline') || titleLower.includes('project')) {
      suggestions.push('work');
    }
    
    // Personal-related keywords
    if (titleLower.includes('gym') || titleLower.includes('exercise') || titleLower.includes('workout') || titleLower.includes('meditation') || titleLower.includes('hobby') || titleLower.includes('personal')) {
      suggestions.push('personal');
    }
    
    // Health-related keywords
    if (titleLower.includes('doctor') || titleLower.includes('appointment') || titleLower.includes('medicine') || titleLower.includes('checkup') || titleLower.includes('health') || titleLower.includes('medical')) {
      suggestions.push('health');
    }
    
    // Finance-related keywords
    if (titleLower.includes('bill') || titleLower.includes('payment') || titleLower.includes('budget') || titleLower.includes('expense') || titleLower.includes('finance') || titleLower.includes('money')) {
      suggestions.push('finance');
    }
    
    // Shopping-related keywords
    if (titleLower.includes('buy') || titleLower.includes('purchase') || titleLower.includes('shopping') || titleLower.includes('store') || titleLower.includes('order') || titleLower.includes('shop')) {
      suggestions.push('shopping');
    }
    
    // Home-related keywords
    if (titleLower.includes('clean') || titleLower.includes('laundry') || titleLower.includes('cook') || titleLower.includes('home') || titleLower.includes('house') || titleLower.includes('maintenance')) {
      suggestions.push('home');
    }
    
    // Study-related keywords
    if (titleLower.includes('study') || titleLower.includes('read') || titleLower.includes('learn') || titleLower.includes('course') || titleLower.includes('assignment') || titleLower.includes('homework')) {
      suggestions.push('study');
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  };

  // Common task templates
  const taskTemplates = [
    { label: 'Quick Task', title: 'Quick task', priority: 'medium', category: 'other', due_date: '' },
    { label: 'Important Meeting', title: 'Important meeting', priority: 'high', category: 'work', due_date: '' },
    { label: 'Gym Workout', title: 'Gym workout', priority: 'medium', category: 'personal', due_date: '' },
    { label: 'Doctor Appointment', title: 'Doctor appointment', priority: 'high', category: 'health', due_date: '' },
    { label: 'Pay Bills', title: 'Pay bills', priority: 'urgent', category: 'finance', due_date: '' },
    { label: 'Grocery Shopping', title: 'Grocery shopping', priority: 'medium', category: 'shopping', due_date: '' },
    { label: 'Study Session', title: 'Study session', priority: 'medium', category: 'study', due_date: '' },
    { label: 'Home Cleaning', title: 'Home cleaning', priority: 'low', category: 'home', due_date: '' }
  ];

  const filteredAndSortedTasks = () => {
    let filtered = tasks;

    // View filtering
    if (selectedView === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(task => task.due_date === today);
    } else if (selectedView === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(task => 
        task.due_date && task.due_date < today && task.status !== 'completed'
      );
    }

    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }

    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getTaskStats = () => {
    if (tasks.length === 0) return null;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const urgent = tasks.filter(t => t.priority === 'urgent').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const today = tasks.filter(t => {
      if (!t.due_date) return false;
      return t.due_date === new Date().toISOString().split('T')[0];
    }).length;

    return { total, completed, pending, inProgress, urgent, overdue, today };
  };

  const stats = getTaskStats();
  const displayTasks = filteredAndSortedTasks();

  const renderQuickStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Overdue</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Urgent</p>
              <p className="text-xl font-bold text-orange-600">{stats.urgent}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompactTasks = () => {
    return (
      <div className="space-y-2">
        {displayTasks.map((task) => {
          const priorityColor = priorityColors[task.priority];
          const statusColor = statusColors[task.status];
          const categoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || categoryIcons.other;
          const swipeState = swipeStates[task.id] || { x: 0, isSwiping: false };
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
          
          return (
            <div 
              key={task.id} 
              className="relative overflow-hidden"
              onTouchStart={(e) => handleTouchStart(e, task.id)}
              onTouchMove={(e) => handleTouchMove(e, task.id)}
              onTouchEnd={(e) => handleTouchEnd(e, task.id)}
            >
              {/* Swipe Action Indicators */}
              <div className="absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center transform -translate-x-full transition-transform duration-200"
                   style={{ transform: `translateX(${Math.max(swipeState.x - 50, -64)}px)` }}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              
              <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transform translate-x-full transition-transform duration-200"
                   style={{ transform: `translateX(${Math.min(swipeState.x + 50, 64)}px)` }}>
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              
              {/* Main Task Card */}
              <div 
                className={`bg-white rounded-lg p-3 shadow-sm border transition-all duration-200 group relative transform ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:shadow-md'
                }`}
                style={{ 
                  transform: `translateX(${swipeState.x}px)`,
                  transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                <div className="flex items-start space-x-3">
                  {/* Status Checkbox */}
                  <button
                    onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`mt-0.5 p-1 rounded transition-colors ${
                      task.status === 'completed' 
                        ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={`text-xs text-gray-600 truncate mt-1 ${
                            task.status === 'completed' ? 'line-through' : ''
                          }`}>
                            {task.description}
                          </p>
                        )}
                        
                        {/* Task Meta */}
                        <div className="flex items-center space-x-2 mt-2">
                          {/* Priority */}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
                            <span className="mr-1">{priorityColor.emoji}</span>
                            {task.priority}
                          </span>
                          
                          {/* Status */}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                            <span className="mr-1">{statusColor.emoji}</span>
                            {task.status.replace('_', ' ')}
                          </span>
                          
                          {/* Category */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            <span className="mr-1">{categoryIcon.emoji}</span>
                            {task.category}
                          </span>
                          
                          {/* Due Date */}
                          {task.due_date && (
                            <div className={`flex items-center space-x-1 text-xs ${
                              isOverdue ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              {isOverdue && <span className="text-red-500">(Overdue)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Actions - Hidden on mobile, shown on desktop */}
                      <div className="hidden md:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log('Edit task:', task.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit task"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg pointer-events-none transition-colors"></div>
              </div>
              
              {/* Mobile Swipe Hint */}
              <div className="md:hidden absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs text-gray-400">← Swipe to complete</div>
                <div className="text-xs text-gray-400">Swipe to delete →</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <p className="text-sm text-gray-600">Manage your tasks</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors relative group"
              title="Toggle filters (Ctrl+F)"
            >
              <Filter className="w-5 h-5" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Ctrl+F
              </span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium relative group"
              title="Add task (Spacebar)"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Spacebar
              </span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* View Toggle */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setSelectedView('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedView === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setSelectedView('today')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedView === 'today' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            Today ({stats?.today || 0})
          </button>
          <button
            onClick={() => setSelectedView('overdue')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedView === 'overdue' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            Overdue ({stats?.overdue || 0})
          </button>
        </div>

        {/* Compact Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="finance">Finance</option>
                <option value="shopping">Shopping</option>
                <option value="home">Home</option>
                <option value="study">Study</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created_at">Created</option>
              </select>
              
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show completed tasks</span>
              </label>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <div className="text-sm text-gray-500">
                {displayTasks.length} of {tasks.length} tasks
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {displayTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-6">
                  {tasks.length === 0 ? 'Start organizing your tasks' : 'No tasks match your filters'}
                </p>
                {tasks.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Task
                  </button>
                )}
              </div>
            ) : (
              renderCompactTasks()
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Task Templates */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                <div className="grid grid-cols-2 gap-2">
                  {taskTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewTask({
                          title: template.title,
                          description: '',
                          priority: template.priority,
                          due_date: template.due_date,
                          category: template.category,
                          tags: []
                        });
                        // Auto-focus title input
                        setTimeout(() => {
                          const titleInput = document.getElementById('task-title') as HTMLInputElement;
                          if (titleInput) {
                            titleInput.focus();
                            titleInput.select();
                          }
                        }, 100);
                      }}
                      className="text-left p-2 text-xs border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{template.label}</div>
                      <div className="text-gray-500 capitalize">{template.category}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); addTask(); }}>
                {/* Title */}
                <div className="mb-4">
                  <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={newTask.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setNewTask(prev => ({ ...prev, title }));
                      
                      // Auto-suggest category based on title
                      if (title.length > 3) {
                        const suggestions = getCategorySuggestions(title);
                        setCategorySuggestions(suggestions);
                        setShowSuggestions(suggestions.length > 0);
                        
                        // Auto-select category if only one suggestion
                        if (suggestions.length === 1) {
                          setNewTask(prev => ({ ...prev, category: suggestions[0] }));
                        }
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                
                {/* Category Suggestions */}
                {showSuggestions && categorySuggestions.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categorySuggestions.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setNewTask(prev => ({ ...prev, category }));
                            setShowSuggestions(false);
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          <span className="mr-1">{categoryIcons[category as keyof typeof categoryIcons]?.emoji}</span>
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Add details about this task..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Priority */}
                  <div>
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="task-category"
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {Object.entries(categoryIcons).map(([key, icon]) => (
                        <option key={key} value={key}>
                          {icon.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Due Date */}
                <div className="mb-6">
                  <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTask.title.trim() || saving}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      !newTask.title.trim() || saving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Task added successfully!</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 hover:bg-red-600 rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-14"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 