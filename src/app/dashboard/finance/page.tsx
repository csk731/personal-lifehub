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
import Link from 'next/link';

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
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newEntry, setNewEntry] = useState({
    amount: '',
    type: 'expense' as const,
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '' as string,
    category: '' as string,
    dateFilter: 'today' as DateFilter,
    customStartDate: '',
    customEndDate: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedView, setSelectedView] = useState<'list' | 'charts'>('list');
  const [showBalance, setShowBalance] = useState(true);
  const [quickActionEntry, setQuickActionEntry] = useState<{ id: string; x: number; y: number } | null>(null);
  const [swipeStates, setSwipeStates] = useState<Record<string, { x: number; isSwiping: boolean }>>({});
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchFinanceEntries();
  }, [filters.dateFilter, filters.customStartDate, filters.customEndDate]);

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

  const getDaysForFilter = (filter: DateFilter): number => {
    switch (filter) {
      case 'today': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  };

  const addFinanceEntry = async () => {
    try {
      if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) return;

      setSaving(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parseFloat(newEntry.amount),
          type: newEntry.type,
          category: newEntry.category,
          description: newEntry.description.trim() || null,
          date: newEntry.date
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add finance entry');
      }

      const data = await response.json();
      setFinanceEntries(prev => [data.entry, ...prev]);
      setNewEntry({
        amount: '',
        type: 'expense',
        category: 'other',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add finance entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteFinanceEntry = async (entryId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/finance/${entryId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete finance entry');
      }

      setFinanceEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete finance entry');
    }
  };

  const filteredAndSortedEntries = () => {
    let filtered = financeEntries;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.category?.toLowerCase().includes(searchLower)
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
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getFinanceStats = () => {
    if (financeEntries.length === 0) return null;

    const total = financeEntries.length;
    const income = financeEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = financeEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const balance = income - expenses;

    const categoryBreakdown = financeEntries.reduce((acc, entry) => {
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

    const dailyTrend = financeEntries.reduce((acc, entry) => {
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

  const stats = getFinanceStats();
  const displayEntries = filteredAndSortedEntries();

  const renderQuickStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">Income</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expenses</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide">Transactions</p>
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
        {displayEntries.map((entry) => {
          const { emoji } = categoryIcons[entry.category as keyof typeof categoryIcons] || categoryIcons.other;
          const swipeState = swipeStates[entry.id] || { x: 0, isSwiping: false };
          
          return (
            <div 
              key={entry.id} 
              className="relative overflow-hidden"
              onTouchStart={(e) => handleTouchStart(e, entry.id)}
              onTouchMove={(e) => handleTouchMove(e, entry.id)}
              onTouchEnd={(e) => handleTouchEnd(e, entry.id)}
            >
              {/* Swipe Action Indicators */}
              <div className="absolute inset-y-0 left-0 w-16 bg-blue-500 flex items-center justify-center transform -translate-x-full transition-transform duration-200"
                   style={{ transform: `translateX(${Math.max(swipeState.x - 50, -64)}px)` }}>
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              
              <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transform translate-x-full transition-transform duration-200"
                   style={{ transform: `translateX(${Math.min(swipeState.x + 50, 64)}px)` }}>
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              
              {/* Main Transaction Card */}
              <div 
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group relative transform"
                style={{ 
                  transform: `translateX(${swipeState.x}px)`,
                  transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out'
                }}
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
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-base font-bold ${
                      entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.type === 'income' ? '+' : '-'}${entry.amount.toLocaleString()}
                    </span>
                    
                    {/* Quick Actions - Hidden on mobile, shown on desktop */}
                    <div className="hidden md:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          console.log('Edit entry:', entry.id);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit transaction"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteFinanceEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-200 rounded-lg pointer-events-none transition-colors"></div>
              </div>
              
              {/* Mobile Swipe Hint */}
              <div className="md:hidden absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs text-gray-400">← Swipe to edit</div>
                <div className="text-xs text-gray-400">Swipe to delete →</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleQuickAction = (action: 'edit' | 'delete', day: any) => {
    setQuickActionEntry(null);
    if (action === 'edit') handleOpenAddModal(day.dateString);
    if (action === 'delete' && day.entry) deleteFinanceEntry(day.entry.id);
  };

  // Swipe gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, entryId: string) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setSwipeStates(prev => ({
      ...prev,
      [entryId]: { x: 0, isSwiping: false }
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, entryId: string) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      e.preventDefault();
      setSwipeStates(prev => ({
        ...prev,
        [entryId]: { x: deltaX, isSwiping: true }
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, entryId: string) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    
    // Swipe left to delete (deltaX < -50)
    if (deltaX < -50) {
      deleteFinanceEntry(entryId);
    }
    // Swipe right to edit (deltaX > 50)
    else if (deltaX > 50) {
      // TODO: Implement edit functionality
      console.log('Edit entry:', entryId);
    }
    
    // Reset swipe state
    setSwipeStates(prev => ({
      ...prev,
      [entryId]: { x: 0, isSwiping: false }
    }));
    setTouchStart(null);
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
      <div className="min-h-screen bg-gray-50">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
              <p className="text-sm text-gray-600">Track your money</p>
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
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium relative group"
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

        {/* Financial Insights Panel - Prominent Position */}
        {financeEntries.length > 0 && stats && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Financial Insights</span>
              </h3>
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                {financeEntries.length} transactions
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Financial Health Score */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Health Score</p>
                    <p className="font-medium text-gray-900">
                      {stats.balance >= 0 ? 'Excellent' : stats.balance > -1000 ? 'Good' : 'Needs Attention'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.balance >= 0 ? 'Positive cash flow' : 'Negative balance'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-lg font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.balance >= 0 ? 'A+' : 'C'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Spending Category */}
              {(() => {
                const topExpenseCategory = Object.entries(stats.categoryBreakdown)
                  .filter(([_, data]) => data.expense > 0)
                  .sort(([_, a], [__, b]) => b.expense - a.expense)[0];
                
                return topExpenseCategory ? (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{categoryIcons[topExpenseCategory[0] as keyof typeof categoryIcons]?.emoji || '📦'}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Top Expense</p>
                        <p className="font-medium text-gray-900 capitalize">{topExpenseCategory[0]}</p>
                        <p className="text-sm text-gray-600">
                          ${topExpenseCategory[1].expense.toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-lg font-bold text-orange-600">
                          {Math.round((topExpenseCategory[1].expense / stats.expenses) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Savings Rate */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Savings Rate</p>
                    <p className="font-medium text-gray-900">
                      {stats.income > 0 ? Math.round((stats.balance / stats.income) * 100) : 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.income > 0 ? 'of income saved' : 'No income data'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-12 h-12 relative">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray={`${Math.min(stats.income > 0 ? (stats.balance / stats.income) * 100 : 0, 100)} 100`}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium mb-1">Smart Recommendations:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {stats.balance < 0 && (
                      <li>• Consider reducing expenses in your top spending category</li>
                    )}
                    {stats.income > 0 && (stats.balance / stats.income) < 0.2 && (
                      <li>• Aim to save at least 20% of your income for better financial health</li>
                    )}
                    {stats.expenses > stats.income * 0.8 && (
                      <li>• Your expenses are high relative to income - review your budget</li>
                    )}
                    {stats.balance >= 0 && stats.income > 0 && (
                      <li>• Great job! You're maintaining positive cash flow</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Enhanced Charts Section */}
        {financeEntries.length > 0 && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Category Breakdown Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span>Spending by Category</span>
                </h3>
                <span className="text-xs text-gray-500">${stats.expenses.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(stats.categoryBreakdown)
                  .filter(([_, data]) => data.expense > 0)
                  .sort(([_, a], [__, b]) => b.expense - a.expense)
                  .slice(0, 5)
                  .map(([category, data]) => {
                    const percentage = Math.round((data.expense / stats.expenses) * 100);
                    const { emoji } = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.other;
                    
                    return (
                      <div key={category} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-base">{emoji}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize truncate">{category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 min-w-[50px] text-right">
                            ${data.expense.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 min-w-[25px] text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Income vs Expenses Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                  <LineChart className="w-4 h-4 text-blue-600" />
                  <span>Income vs Expenses</span>
                </h3>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded"></div>
                    <span>Income</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded"></div>
                    <span>Expenses</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Monthly Trend Bars */}
                {(() => {
                  const monthlyData = Object.entries(stats.dailyTrend)
                    .reduce((acc, [date, data]) => {
                      const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
                      if (!acc[month]) {
                        acc[month] = { income: 0, expense: 0 };
                      }
                      acc[month].income += data.income;
                      acc[month].expense += data.expense;
                      return acc;
                    }, {} as Record<string, { income: number; expense: number }>);
                  
                  const maxValue = Math.max(
                    ...Object.values(monthlyData).map(d => Math.max(d.income, d.expense))
                  );
                  
                  return Object.entries(monthlyData)
                    .slice(-4) // Last 4 months for more compact view
                    .map(([month, data]) => (
                      <div key={month} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{month}</span>
                          <span>${(data.income - data.expense).toLocaleString()}</span>
                        </div>
                        <div className="flex items-end space-x-1 h-6">
                          <div 
                            className="bg-green-500 rounded-t transition-all hover:bg-green-600"
                            style={{ 
                              height: `${Math.max((data.income / maxValue) * 100, 4)}%`,
                              minHeight: '2px'
                            }}
                            title={`Income: $${data.income.toLocaleString()}`}
                          ></div>
                          <div 
                            className="bg-red-500 rounded-t transition-all hover:bg-red-600"
                            style={{ 
                              height: `${Math.max((data.expense / maxValue) * 100, 4)}%`,
                              minHeight: '2px'
                            }}
                            title={`Expense: $${data.expense.toLocaleString()}`}
                          ></div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Compact Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.dateFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFilter: e.target.value as DateFilter }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom</option>
              </select>
              
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="investment">Investment</option>
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="bills">Bills</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {filters.dateFilter === 'custom' && (
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="date"
                  value={filters.customStartDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.customEndDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Transactions</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <TrendingUpIcon className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            {displayEntries.length === 0 ? (
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
              renderCompactTransactions()
            )}
          </div>
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
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              // TODO: Implement edit functionality
              console.log('Edit entry:', quickActionEntry.id);
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
  );
} 