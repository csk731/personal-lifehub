'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search,
  Calendar,
  ArrowLeft,
  Trash2,
  BarChart3,
  Wallet,
  CreditCard,
  X,
  Filter,
  PieChart,
  LineChart,
  Target,
  Eye,
  EyeOff,
  Download,
  Settings,
  Clock,
  TrendingUp as TrendingUpIcon,
  PiggyBank,
  Edit3
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import { 
  formatDateInUserTimezone, 
  getDateStringForInput, 
  convertDateInputToUtc,
  getUserTimezone,
  formatDatabaseDateForDisplay 
} from '@/utils/timezone';
import Link from 'next/link';
import { TopBar } from '@/components/dashboard/TopBar';
import { motion, AnimatePresence } from 'framer-motion';

interface FinanceEntry {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

const categoryIcons = {
  'salary': { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', emoji: '💰' },
  'freelance': { icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '💻' },
  'investment': { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100', emoji: '📈' },
  'food': { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🍕' },
  'transport': { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '🚗' },
  'entertainment': { icon: CreditCard, color: 'text-pink-600', bg: 'bg-pink-100', emoji: '🎬' },
  'shopping': { icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-100', emoji: '🛍️' },
  'bills': { icon: CreditCard, color: 'text-red-600', bg: 'bg-red-100', emoji: '📄' },
  'health': { icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-100', emoji: '🏥' },
  'other': { icon: CreditCard, color: 'text-gray-600', bg: 'bg-gray-100', emoji: '📦' }
};

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function FinancePage() {
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedView, setSelectedView] = useState<'list' | 'charts'>('list');
  const [showBalance, setShowBalance] = useState(true);
  const [quickActionEntry, setQuickActionEntry] = useState<{ id: string; x: number; y: number } | null>(null);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newEntry, setNewEntry] = useState({
    amount: '',
    type: 'expense' as const,
    category: 'other',
    description: '',
    date: getDateStringForInput()
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '' as string,
    category: '' as string,
    dateFilter: 'today' as DateFilter,
    customStartDate: '',
    customEndDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingEntries, setDeletingEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFinanceEntries();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.type, filters.category, filters.dateFilter, filters.customStartDate, filters.customEndDate, sortBy, sortOrder]);

  const fetchFinanceEntries = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      let url = '/api/finance';
      const params = new URLSearchParams();
      
      if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
        params.append('start_date', filters.customStartDate);
        params.append('end_date', filters.customEndDate);
      } else {
        const days = getDaysForFilter(filters.dateFilter);
        params.append('days', days.toString());
        params.append('timezone', getUserTimezone());
      }
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch finance entries');
      }
      
      const data = await response.json();
      setFinanceEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance entries');
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const headers = await getAuthHeaders();
      
      let url = '/api/finance';
      const params = new URLSearchParams();
      
      if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
        params.append('start_date', filters.customStartDate);
        params.append('end_date', filters.customEndDate);
      } else {
        const days = getDaysForFilter(filters.dateFilter);
        params.append('days', days.toString());
        params.append('timezone', getUserTimezone());
      }
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch finance entries');
      }
      
      const data = await response.json();
      setFinanceEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance entries');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const getDaysForFilter = (filter: DateFilter): number => {
    const today = new Date();
    
    switch (filter) {
      case 'today': 
        return 1;
      case 'week': 
        return 7;
      case 'month': {
        // This month (from 1st to today)
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysDiff = Math.ceil((today.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff + 1;
      }
      case 'quarter': {
        // Last 3 calendar months
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        const daysDiff = Math.ceil((today.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff;
      }
      case 'year': {
        // This year (from Jan 1st to today)
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const daysDiff = Math.ceil((today.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff + 1;
      }
      default: 
        return 30;
    }
  };

  const addFinanceEntry = async () => {
    try {
      if (!newEntry.amount || !newEntry.category || !newEntry.date) {
        setError('Please fill in all required fields');
        return;
      }

      setSaving(true);
      setError(null);
      const headers = await getAuthHeaders();
      
      // Convert date to UTC for API
      const dateForApi = convertDateInputToUtc(newEntry.date);

      const response = await fetch('/api/finance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parseFloat(newEntry.amount),
          type: newEntry.type,
          category: newEntry.category,
          description: newEntry.description.trim() || null,
          date: dateForApi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add entry');
      }

      const data = await response.json();
      setFinanceEntries(prev => [data.entry, ...prev]);
      
      // Reset form
      setNewEntry({
        amount: '',
        type: 'expense',
        category: 'other',
        description: '',
        date: getDateStringForInput()
      });
      setShowAddModal(false);
      setShowSuggestions(false);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteFinanceEntry = async (entryId: string) => {
    try {
      // First, make the API call without starting animation
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/finance/${entryId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete finance entry');
      }

      // Only start animation after successful API call
      setDeletingEntries(prev => new Set(prev).add(entryId));
      
      // Wait for animation to complete before removing from list
      setTimeout(() => {
        setFinanceEntries(prev => prev.filter(entry => entry.id !== entryId));
        setDeletingEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
      }, 300);

    } catch (err) {
      // Show error without any animation
      setError(err instanceof Error ? err.message : 'Failed to delete finance entry');
      
      // Show a brief visual feedback that the delete failed
      const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
      if (entryElement) {
        entryElement.classList.add('shake-animation');
        setTimeout(() => {
          entryElement.classList.remove('shake-animation');
        }, 500);
      }
    }
  };

  const editFinanceEntry = async () => {
    if (!editingEntry) return;

    try {
      setSaving(true);
      setError(null);
      const headers = await getAuthHeaders();
      
      // Convert date to UTC for API
      const dateForApi = convertDateInputToUtc(editingEntry.date);

      const response = await fetch(`/api/finance/${editingEntry.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          amount: editingEntry.amount,
          type: editingEntry.type,
          category: editingEntry.category,
          description: editingEntry.description?.trim() || null,
          date: dateForApi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }

      const data = await response.json();
      setFinanceEntries(prev => 
        prev.map(entry => 
          entry.id === editingEntry.id ? data.entry : entry
        )
      );
      setEditingEntry(null);
      setShowEditModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (entry: FinanceEntry) => {
    setEditingEntry({
      ...entry,
      date: getDateStringForInput(entry.date)
    });
    setShowEditModal(true);
  };

  const filteredAndSortedEntries = () => {
    let filtered = financeEntries;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.category?.toLowerCase().includes(searchLower) ||
        entry.amount.toString().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          return 0;
      }

      // For string values (type, category), use localeCompare for proper sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // For numeric values (date, amount), use numeric comparison
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getAllFilteredEntries = () => {
    return filteredAndSortedEntries();
  };

  const getPaginatedEntries = () => {
    const allEntries = filteredAndSortedEntries();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allEntries.slice(startIndex, endIndex);
  };

  const getFinanceStats = () => {
    if (financeEntries.length === 0) return null;

    // Get filtered entries based on current date filter
    const filteredEntries = filteredAndSortedEntries();
    
    const total = filteredEntries.length;
    const income = filteredEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = filteredEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const balance = income - expenses;

    const categoryBreakdown = filteredEntries.reduce((acc, entry) => {
      const category = entry.category || 'other';
      if (!acc[category]) {
        acc[category] = { income: 0, expense: 0, count: 0 };
      }
      if (entry.type === 'income') {
        acc[category].income += entry.amount;
      } else {
        acc[category].expense += entry.amount;
      }
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { income: number; expense: number; count: number }>);

    const dailyTrend = filteredEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 };
      }
      if (entry.type === 'income') {
        acc[date].income += entry.amount;
      } else {
        acc[date].expense += entry.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return { 
      total, 
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      categoryBreakdown,
      dailyTrend
    };
  };

  const getDateFilterLabel = () => {
    switch (filters.dateFilter) {
      case 'today':
        return "Today's";
      case 'week':
        return "This Week's";
      case 'month':
        return "This Month's";
      case 'quarter':
        return "Past 3 Months'";
      case 'year':
        return "This Year's";
      case 'custom':
        return "Selected Period's";
      default:
        return "Today's";
    }
  };

  const stats = getFinanceStats();
  const displayEntries = getPaginatedEntries();
  const dateFilterLabel = getDateFilterLabel();

  const renderQuickStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">{dateFilterLabel} Balance</p>
              <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalance ? `$${stats.balance.toLocaleString()}` : '••••••'}
              </p>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">{dateFilterLabel} Income</p>
              <p className="text-xl font-bold text-green-600">${stats.income.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">{dateFilterLabel} Expenses</p>
              <p className="text-xl font-bold text-red-600">${stats.expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">{dateFilterLabel} Transactions</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompactTransactions = () => {
    return (
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayEntries.map((entry) => {
            const { emoji } = categoryIcons[entry.category as keyof typeof categoryIcons] || categoryIcons.other;
            const isDeleting = deletingEntries.has(entry.id);
            
            return (
              <motion.div 
                key={entry.id} 
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
                {/* Main Transaction Card */}
                <div 
                  data-entry-id={entry.id}
                  className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group relative ${
                    isDeleting ? 'pointer-events-none' : ''
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setQuickActionEntry({ id: entry.id, x: e.clientX, y: e.clientY });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-xl">{emoji}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">{entry.category}</h4>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === 'income' 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-red-600 bg-red-100'
                          }`}>
                            {entry.type}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-xs text-gray-600 truncate max-w-xs">{entry.description}</p>
                        )}
                        <div className="flex items-center space-x-1 text-xs text-gray-600 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDatabaseDateForDisplay(entry.date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-base font-bold ${
                        entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.type === 'income' ? '+' : '-'}${entry.amount.toLocaleString()}
                      </span>
                      {/* Quick Actions - Always visible */}
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit transaction"
                          disabled={isDeleting}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteFinanceEntry(entry.id)}
                          className={`p-1 rounded transition-colors ${
                            isDeleting 
                              ? 'text-red-400 bg-red-50 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Delete transaction"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Hover indicator */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-200 rounded-lg pointer-events-none transition-colors"></div>
                  
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

  const handleQuickAction = (action: 'edit' | 'delete', day: any) => {
    setQuickActionEntry(null);
    if (action === 'edit') handleOpenAddModal(day.dateString);
    if (action === 'delete' && day.entry) deleteFinanceEntry(day.entry.id);
  };

  // Smart category suggestions based on description
  const getCategorySuggestions = (description: string) => {
    const desc = description.toLowerCase();
    const suggestions: string[] = [];
    
    // Food-related keywords
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('meal') || desc.includes('lunch') || desc.includes('dinner') || desc.includes('breakfast') || desc.includes('coffee') || desc.includes('pizza') || desc.includes('burger')) {
      suggestions.push('food');
    }
    
    // Transport-related keywords
    if (desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi') || desc.includes('gas') || desc.includes('fuel') || desc.includes('parking') || desc.includes('bus') || desc.includes('train') || desc.includes('subway')) {
      suggestions.push('transport');
    }
    
    // Entertainment-related keywords
    if (desc.includes('movie') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('concert') || desc.includes('game') || desc.includes('entertainment') || desc.includes('fun')) {
      suggestions.push('entertainment');
    }
    
    // Shopping-related keywords
    if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('store') || desc.includes('clothes') || desc.includes('shirt') || desc.includes('shoes') || desc.includes('buy')) {
      suggestions.push('shopping');
    }
    
    // Bills-related keywords
    if (desc.includes('bill') || desc.includes('electricity') || desc.includes('water') || desc.includes('internet') || desc.includes('phone') || desc.includes('rent') || desc.includes('mortgage')) {
      suggestions.push('bills');
    }
    
    // Health-related keywords
    if (desc.includes('doctor') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('medicine') || desc.includes('health') || desc.includes('gym') || desc.includes('fitness')) {
      suggestions.push('health');
    }
    
    // Income-related keywords
    if (desc.includes('salary') || desc.includes('paycheck') || desc.includes('income') || desc.includes('payment') || desc.includes('freelance') || desc.includes('consulting')) {
      suggestions.push('salary');
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  };

  // Common amount templates
  const amountTemplates = [
    { label: 'Coffee', amount: '5.00', type: 'expense', category: 'food' },
    { label: 'Lunch', amount: '15.00', type: 'expense', category: 'food' },
    { label: 'Dinner', amount: '25.00', type: 'expense', category: 'food' },
    { label: 'Uber', amount: '12.00', type: 'expense', category: 'transport' },
    { label: 'Gas', amount: '45.00', type: 'expense', category: 'transport' },
    { label: 'Movie', amount: '18.00', type: 'expense', category: 'entertainment' },
    { label: 'Salary', amount: '2500.00', type: 'income', category: 'salary' },
    { label: 'Freelance', amount: '500.00', type: 'income', category: 'freelance' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Insights Panel Skeleton */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
                      </div>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Transactions Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="p-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div>
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
                <p className="text-sm text-gray-700">Track your money</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium relative group min-w-[80px]"
                title="Add transaction (Spacebar)"
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

          {/* Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Transactions</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white min-w-[80px]"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="type">Type</option>
                    <option value="category">Category</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <TrendingUpIcon className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Search and Filter Row */}
              <div className="space-y-3 mb-3">
                {/* Search Bar - Full width on all screens */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white min-w-[200px]"
                  />
                </div>
                
                {/* Filters Row - Responsive layout */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[120px]"
                  >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[140px]"
                  >
                    <option value="">All Categories</option>
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="bills">Bills</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        type: '',
                        category: '',
                        dateFilter: 'today',
                        customStartDate: '',
                        customEndDate: ''
                      });
                      setSortBy('date');
                      setSortOrder('desc');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white min-w-[60px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Date Filter Buttons - Responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[80px] ${filters.dateFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                  onClick={async () => {
                    setFilters(f => ({ ...f, dateFilter: 'today', customStartDate: '', customEndDate: '' }));
                    await refreshTransactions();
                  }}
                >
                  Today
                </button>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${filters.dateFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                  onClick={async () => {
                    setFilters(f => ({ ...f, dateFilter: 'month', customStartDate: '', customEndDate: '' }));
                    await refreshTransactions();
                  }}
                >
                  This Month
                </button>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[120px] ${filters.dateFilter === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                  onClick={async () => {
                    setFilters(f => ({ ...f, dateFilter: 'quarter', customStartDate: '', customEndDate: '' }));
                    await refreshTransactions();
                  }}
                >
                  Past 3 Months
                </button>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${filters.dateFilter === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                  onClick={async () => {
                    setFilters(f => ({ ...f, dateFilter: 'year', customStartDate: '', customEndDate: '' }));
                    await refreshTransactions();
                  }}
                >
                  This Year
                </button>
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[80px] ${filters.dateFilter === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'}`}
                  onClick={() => setFilters(f => ({ ...f, dateFilter: 'custom' }))}
                >
                  Custom
                </button>
              </div>
              
              {/* Custom Date Inputs - Responsive layout */}
              {filters.dateFilter === 'custom' && (
                <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
                      <input
                        type="date"
                        value={filters.customStartDate}
                        onChange={(e) => setFilters(f => ({ ...f, customStartDate: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[140px]"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
                      <input
                        type="date"
                        value={filters.customEndDate}
                        onChange={(e) => setFilters(f => ({ ...f, customEndDate: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white min-w-[140px]"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <button
                        onClick={async () => {
                          if (filters.customStartDate && filters.customEndDate) {
                            await refreshTransactions();
                          }
                        }}
                        disabled={!filters.customStartDate || !filters.customEndDate}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[80px]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Results Count - Responsive layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  Showing {displayEntries.length} of {getAllFilteredEntries().length} transactions
                  {(filters.search || filters.type || filters.category) && (
                    <span className="text-blue-600 ml-1">(filtered)</span>
                  )}
                </div>
                <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full self-start sm:self-auto">
                  {displayEntries.length} transactions
                </span>
              </div>
            </div>
            
            <div className="p-3">
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3">💰</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {financeEntries.length === 0 ? 'Start tracking your finances' : 'No transactions match your filters'}
                  </p>
                  {financeEntries.length === 0 && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Your First Transaction
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto min-w-full">
                  {renderCompactTransactions()}
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {getAllFilteredEntries().length > 0 && (
              <div className="px-3 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  {/* Items per page selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when changing items per page
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[60px] text-gray-700 bg-white"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">per page</span>
                  </div>
                  
                  {/* Pagination controls */}
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    {/* Navigation buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-w-[80px] text-gray-700 bg-white"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const totalPages = Math.ceil(getAllFilteredEntries().length / itemsPerPage);
                          const pages = [];
                          
                          // Always show first page
                          if (currentPage > 3) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors min-w-[32px] text-gray-700 bg-white"
                              >
                                1
                              </button>
                            );
                            if (currentPage > 4) {
                              pages.push(
                                <span key="ellipsis1" className="px-2 py-1 text-sm text-gray-500">
                                  ...
                                </span>
                              );
                            }
                          }
                          
                          // Show pages around current page
                          for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`px-2 py-1 text-sm border rounded transition-colors min-w-[32px] ${
                                  i === currentPage
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-white text-gray-700 bg-white'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          // Always show last page
                          if (currentPage < totalPages - 2) {
                            if (currentPage < totalPages - 3) {
                              pages.push(
                                <span key="ellipsis2" className="px-2 py-1 text-sm text-gray-500">
                                  ...
                                </span>
                              );
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors min-w-[32px] text-gray-700 bg-white"
                              >
                                {totalPages}
                              </button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getAllFilteredEntries().length / itemsPerPage), prev + 1))}
                        disabled={currentPage >= Math.ceil(getAllFilteredEntries().length / itemsPerPage)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-w-[80px] text-gray-700 bg-white"
                      >
                        Next
                      </button>
                    </div>
                    
                    {/* Page info */}
                    <div className="text-sm text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-200">
                      Page {currentPage} of {Math.ceil(getAllFilteredEntries().length / itemsPerPage)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Quick Add Transaction</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Amount Templates */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Quick Templates</label>
                  <div className="grid grid-cols-2 gap-2">
                    {amountTemplates
                      .filter(template => template.type === newEntry.type)
                      .slice(0, 4)
                      .map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setNewEntry(prev => ({
                            ...prev,
                            amount: template.amount,
                            category: template.category,
                            description: template.label
                          }))}
                          className="p-2 text-xs border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                        >
                          <div className="font-medium text-gray-900">{template.label}</div>
                          <div className="text-gray-600">${template.amount}</div>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newEntry.amount}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newEntry.type}
                      onChange={(e) => setNewEntry(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'income' | 'expense',
                        category: 'other' // Reset category when type changes
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white"
                    >
                      {newEntry.type === 'income' ? (
                        <>
                          <option value="salary">Salary</option>
                          <option value="freelance">Freelance</option>
                          <option value="investment">Investment</option>
                          <option value="other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="food">Food</option>
                          <option value="transport">Transport</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="shopping">Shopping</option>
                          <option value="bills">Bills</option>
                          <option value="health">Health</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </select>
                    
                    {/* Category Suggestions */}
                    {categorySuggestions.length > 0 && showSuggestions && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                        {categorySuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setNewEntry(prev => ({ ...prev, category: suggestion }));
                              setShowSuggestions(false);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <span className="text-lg">{categoryIcons[suggestion as keyof typeof categoryIcons]?.emoji || '📦'}</span>
                            <span className="capitalize">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={newEntry.description}
                    onChange={(e) => {
                      const description = e.target.value;
                      setNewEntry(prev => ({ ...prev, description }));
                      
                      // Auto-suggest category based on description
                      if (description.length > 2) {
                        const suggestions = getCategorySuggestions(description);
                        setCategorySuggestions(suggestions);
                        setShowSuggestions(suggestions.length > 0);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (categorySuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={addFinanceEntry}
                    disabled={!newEntry.amount || parseFloat(newEntry.amount) <= 0 || saving}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Add Transaction</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditModal && editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Edit Transaction</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEntry(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={editingEntry.amount}
                        onChange={(e) => setEditingEntry(prev => prev ? { ...prev, amount: e.target.value } : null)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={editingEntry.type}
                      onChange={(e) => setEditingEntry(prev => prev ? { 
                        ...prev, 
                        type: e.target.value as 'income' | 'expense',
                        category: 'other' // Reset category when type changes
                      } : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editingEntry.category}
                      onChange={(e) => setEditingEntry(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
                    >
                      {editingEntry.type === 'income' ? (
                        <>
                          <option value="salary">Salary</option>
                          <option value="freelance">Freelance</option>
                          <option value="investment">Investment</option>
                          <option value="other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="food">Food</option>
                          <option value="transport">Transport</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="shopping">Shopping</option>
                          <option value="bills">Bills</option>
                          <option value="health">Health</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editingEntry.date}
                      onChange={(e) => setEditingEntry(prev => prev ? { ...prev, date: e.target.value } : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={editingEntry.description || ''}
                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={editFinanceEntry}
                    disabled={!editingEntry.amount || parseFloat(editingEntry.amount.toString()) <= 0 || saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Update Transaction</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEntry(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Context Menu */}
        {quickActionEntry && (
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
            style={{ 
              left: quickActionEntry.x, 
              top: quickActionEntry.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <button
              onClick={() => {
                openEditModal(quickActionEntry);
                setQuickActionEntry(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                deleteFinanceEntry(quickActionEntry.id);
                setQuickActionEntry(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Click outside to close context menu */}
        {quickActionEntry && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setQuickActionEntry(null)}
          />
        )}

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-in slide-in-from-right duration-300">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="font-medium">Transaction added successfully!</span>
          </div>
        )}
      </div>
    </>
  );
} 