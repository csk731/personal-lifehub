'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Search,
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
import { 
  isDateToday, 
  isDateOverdue, 
  formatDateInUserTimezone, 
  getDateStringForInput, 
  convertDateInputToUtc,
  getUserTimezone,
  debugTimezone,
  formatDatabaseDateForDisplay 
} from '@/utils/timezone';
import Link from 'next/link';
import { TopBar } from '@/components/dashboard/TopBar';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    category: 'other',
    tags: [] as string[]
  });
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    search: '',
    category: '',
    dateFilter: 'today' as 'all' | 'today' | 'no_due_date' | 'overdue',
    customStartDate: '',
    customEndDate: ''
  });
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at' | 'title' | 'category'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

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
      
      // Fix timezone issue: convert local date to UTC using timezone utility
      let dueDate = newTask.due_date || null;
      if (dueDate) {
        dueDate = convertDateInputToUtc(dueDate);
      }
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          due_date: dueDate,
          category: newTask.category,
          tags: newTask.tags
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add task');
      }

      const data = await response.json();
      setTasks(prevTasks => [data.task, ...prevTasks]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'other',
        tags: []
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding task:', err);
      alert(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const editTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return;

    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      
      // Fix timezone issue: convert local date to UTC using timezone utility
      let dueDate = editingTask.due_date || null;
      if (dueDate) {
        dueDate = convertDateInputToUtc(dueDate);
      }
      
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: editingTask.title.trim(),
          description: editingTask.description?.trim() || null,
          priority: editingTask.priority,
          due_date: dueDate,
          category: editingTask.category,
          tags: editingTask.tags || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const data = await response.json();
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === editingTask.id ? data.task : task
        )
      );
      setEditingTask(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating task:', err);
      alert(err instanceof Error ? err.message : 'Failed to update task');
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
      // First, make the API call without starting animation
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Only start animation after successful API call
      setDeletingTasks(prev => new Set(prev).add(taskId));
      
      // Wait for animation to complete before removing from list
      setTimeout(() => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setDeletingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 300);

    } catch (err) {
      // Show error without any animation
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      
      // Show a brief visual feedback that the delete failed
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.classList.add('shake-animation');
        setTimeout(() => {
          taskElement.classList.remove('shake-animation');
        }, 500);
      }
    }
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

  const isTaskInDateRange = (task: Task): boolean => {
    // Debug logging for timezone issues
    if (task.due_date) {
      console.log(`Task: ${task.title}`);
      debugTimezone(task.due_date);
    }
    
    switch (filters.dateFilter) {
      case 'all':
        return true; // Show everything
      case 'today':
        // Show overdue + today tasks
        if (!task.due_date) return false;
        return isDateToday(task.due_date) || isDateOverdue(task.due_date);
      case 'overdue':
        // Show only overdue tasks
        if (!task.due_date) return false;
        return isDateOverdue(task.due_date);
      case 'no_due_date':
        // Show tasks with no due date
        return !task.due_date;
      default:
        return true;
    }
  };

  const filteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => task.status !== 'completed'); // Always exclude completed tasks

    // Date filtering
    if (filters.dateFilter !== 'all') {
      filtered = filtered.filter(task => isTaskInDateRange(task));
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
        task.category?.toLowerCase().includes(searchLower) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
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
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      // For string values (title, category), use localeCompare for proper sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // For numeric values (date, priority), use numeric comparison
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getCompletedTasks = () => {
    let completed = tasks.filter(task => task.status === 'completed');

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      completed = completed.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      completed = completed.filter(task => task.category === filters.category);
    }

    // Sort completed tasks by completion date (most recent first)
    completed.sort((a, b) => {
      const aValue = new Date(a.updated_at).getTime();
      const bValue = new Date(b.updated_at).getTime();
      return bValue - aValue; // Most recent first
    });

    return completed;
  };

  const getTaskStats = () => {
    if (tasks.length === 0) return null;

    // Get filtered tasks based on current filters
    const allFilteredTasks = tasks.filter(task => {
      // Apply date filter
      if (filters.dateFilter !== 'all' && !isTaskInDateRange(task)) {
        return false;
      }

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !task.description?.toLowerCase().includes(searchLower) &&
            !task.category?.toLowerCase().includes(searchLower) &&
            !task.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Apply category filter
      if (filters.category && task.category !== filters.category) {
        return false;
      }

      // Apply status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Apply priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      return true;
    });

    const total = allFilteredTasks.length;
    const completed = allFilteredTasks.filter(t => t.status === 'completed').length;
    const pending = allFilteredTasks.filter(t => t.status === 'pending').length;
    const inProgress = allFilteredTasks.filter(t => t.status === 'in_progress').length;
    const urgent = allFilteredTasks.filter(t => t.priority === 'urgent').length;
    const overdue = allFilteredTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return isDateOverdue(t.due_date);
    }).length;

    return { total, completed, pending, inProgress, urgent, overdue };
  };

  const getFilterLabel = () => {
    if (filters.search) {
      return "Search Results";
    }
    
    switch (filters.dateFilter) {
      case 'all':
        return "All";
      case 'today':
        return "Today & Overdue";
      case 'overdue':
        return "Overdue";
      case 'no_due_date':
        return "No Due Date";
      default:
        return "All";
    }
  };

  const stats = getTaskStats();
  const displayTasks = filteredAndSortedTasks();
  const completedTasks = getCompletedTasks();
  const filterLabel = getFilterLabel();

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
              <p className="text-xs text-gray-500 uppercase tracking-wide">{filterLabel} Total</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">{filterLabel} Completed</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">{filterLabel} Overdue</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">{filterLabel} Urgent</p>
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
        <AnimatePresence mode="popLayout">
          {displayTasks.map((task) => {
            const priorityColor = priorityColors[task.priority];
            const statusColor = statusColors[task.status];
            const categoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || categoryIcons.other;
            const isDeleting = deletingTasks.has(task.id);
            
            return (
              <motion.div 
                key={task.id} 
                className="relative overflow-hidden"
                initial={{ opacity: 1, height: "auto", scale: 1 }}
                animate={{ 
                  opacity: isDeleting ? 0 : 1, 
                  height: isDeleting ? 0 : "auto",
                  scale: isDeleting ? 0.95 : 1,
                  y: isDeleting ? -10 : 0
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0,
                  scale: 0.95,
                  y: -10
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeInOut",
                  height: { duration: 0.3 }
                }}
                layout
              >
                {/* Main Task Card */}
                <div 
                  data-task-id={task.id}
                  className={`bg-white rounded-lg p-3 shadow-sm border transition-all duration-200 group relative transform ${
                    task.due_date && isDateOverdue(task.due_date) && task.status !== 'completed' ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:shadow-md'
                  } ${isDeleting ? 'pointer-events-none' : ''}`}
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
                      disabled={isDeleting}
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
                                task.due_date && isDateOverdue(task.due_date) ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDatabaseDateForDisplay(task.due_date)}</span>
                                {task.due_date && isDateOverdue(task.due_date) && <span className="text-red-500">(Overdue)</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Quick Actions - Always visible */}
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit task"
                            disabled={isDeleting}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isDeleting 
                                ? 'text-red-400 bg-red-50 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete task"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg pointer-events-none transition-colors"></div>
                  
                  {/* Delete animation overlay */}
                  {isDeleting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      className="absolute inset-0 bg-red-500 rounded-lg pointer-events-none"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const renderCompletedTasks = () => {
    if (completedTasks.length === 0) return null;

    return (
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {completedTasks.map((task) => {
            const priorityColor = priorityColors[task.priority];
            const categoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || categoryIcons.other;
            const isDeleting = deletingTasks.has(task.id);
            
            return (
              <motion.div 
                key={task.id} 
                className="relative overflow-hidden"
                initial={{ opacity: 1, height: "auto", scale: 1 }}
                animate={{ 
                  opacity: isDeleting ? 0 : 1, 
                  height: isDeleting ? 0 : "auto",
                  scale: isDeleting ? 0.95 : 1,
                  y: isDeleting ? -10 : 0
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0,
                  scale: 0.95,
                  y: -10
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeInOut",
                  height: { duration: 0.3 }
                }}
                layout
              >
                <div 
                  data-task-id={task.id}
                  className={`bg-gray-50 rounded-lg p-3 border border-green-200 hover:border-green-300 transition-colors ${
                    isDeleting ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          </div>
                          <h4 className="text-sm font-medium truncate line-through text-gray-500">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-500 truncate mt-1 line-through">
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
                            
                            {/* Category */}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <span className="mr-1">{categoryIcon.emoji}</span>
                              {task.category}
                            </span>
                            
                            {/* Completion Date */}
                            <div className="flex items-center space-x-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Completed {formatDatabaseDateForDisplay(task.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id, 'pending');
                            }}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            title="Undo completion"
                            disabled={isDeleting}
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isDeleting 
                                ? 'text-red-400 bg-red-50 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete task"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete animation overlay */}
                  {isDeleting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      className="absolute inset-0 bg-red-500 rounded-lg pointer-events-none"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
    <>
      <TopBar isLoggedIn={true} />
      <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <p className="text-sm text-gray-700">Manage your tasks</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium relative group min-w-[80px]"
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

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[100px]"
                >
                  <option value="due_date">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="created_at">Created</option>
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <SortAsc className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Search and Filter Row */}
            <div className="space-y-3 mb-3">
              {/* Search Bar - Full width on all screens */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white min-w-[200px]"
                />
              </div>
              
              {/* Filters Row - Responsive layout */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[140px]"
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
                  value={filters.status.length > 0 ? filters.status[0] : ''}
                  onChange={(e) => setFilters(f => ({ 
                    ...f, 
                    status: e.target.value ? [e.target.value] : [] 
                  }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[120px]"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                </select>
                <select
                  value={filters.priority.length > 0 ? filters.priority[0] : ''}
                  onChange={(e) => setFilters(f => ({ 
                    ...f, 
                    priority: e.target.value ? [e.target.value] : [] 
                  }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[120px]"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={() => {
                    setFilters({
                      status: [],
                      priority: [],
                      search: '',
                      category: '',
                      dateFilter: 'today',
                      customStartDate: '',
                      customEndDate: ''
                    });
                    setSortBy('due_date');
                    setSortOrder('asc');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white min-w-[60px]"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Date Filter Buttons - Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[80px] ${filters.dateFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                onClick={() => setFilters(f => ({ ...f, dateFilter: 'today' }))}
              >
                Today
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${filters.dateFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                onClick={() => setFilters(f => ({ ...f, dateFilter: 'all' }))}
              >
                All Tasks
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[120px] ${filters.dateFilter === 'no_due_date' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                onClick={() => setFilters(f => ({ ...f, dateFilter: 'no_due_date' }))}
              >
                No Due Date
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${filters.dateFilter === 'overdue' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                onClick={() => setFilters(f => ({ ...f, dateFilter: 'overdue' }))}
              >
                Overdue
              </button>
            </div>
            
            {/* Results Count - Responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing {displayTasks.length} of {tasks.filter(t => t.status !== 'completed').length} active tasks
                {(filters.search || filters.category || filters.status.length > 0 || filters.priority.length > 0) && (
                  <span className="text-blue-600 ml-1">(filtered)</span>
                )}
              </div>
              <span className="text-sm text-gray-700 bg-white px-3 py-1 rounded-full self-start sm:self-auto">
                Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
              </span>
            </div>
          </div>
          
          <div className="p-4">
            {displayTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active tasks found</h3>
                <p className="text-gray-600 mb-6">
                    {tasks.filter(t => t.status !== 'completed').length === 0 ? 'Start organizing your tasks' : 'No tasks match your filters'}
                </p>
                  {tasks.filter(t => t.status !== 'completed').length === 0 && (
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

        {/* Completed Tasks Section */}
        {showCompletedSection && completedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Completed Tasks</h2>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    {completedTasks.length} completed
                  </div>
                  <button
                    onClick={() => setShowCompletedSection(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {renderCompletedTasks()}
            </div>
          </div>
        )}

        {/* Show Completed Tasks Button (when hidden) */}
        {!showCompletedSection && completedTasks.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={() => setShowCompletedSection(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Show {completedTasks.length} completed tasks</span>
            </button>
          </div>
        )}
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
                    className="text-left p-2 text-xs border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
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
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors text-gray-700 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-700 bg-white"
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
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
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

    {/* Edit Task Modal */}
    {showEditModal && editingTask && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); editTask(); }}>
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditingTask(prev => prev ? { ...prev, title } : null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-700 bg-white"
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
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
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
                    value={editingTask.category}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-700 bg-white"
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
                  value={editingTask.due_date}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, due_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingTask.title.trim() || saving}
                  className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                    !editingTask.title.trim() || saving
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
                      <Edit3 className="w-4 h-4" />
                      <span>Save Changes</span>
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
  </>
);
} 