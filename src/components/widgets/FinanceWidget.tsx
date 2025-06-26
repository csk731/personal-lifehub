'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertCircle,
  Tag
} from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { getAuthHeaders } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface FinanceEntry {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: string
  category: string | null
  description: string | null
  account: string | null
  date: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface FinanceWidgetProps {
  widgetId: string
  title: string
  config: {
    currency?: string
    maxEntries?: number
  }
  widget: {
    id: string
    width: number
    height: number
    name: string
  }
}

const typeColors = {
  income: 'text-green-600 bg-green-100',
  expense: 'text-red-600 bg-red-100',
  transfer: 'text-blue-600 bg-blue-100'
}

const typeIcons = {
  income: '📈',
  expense: '📉',
  transfer: '🔄'
}

const categoryIcons = {
  food: '🍕',
  transport: '🚗',
  entertainment: '🎬',
  shopping: '🛍️',
  health: '🏥',
  education: '📚',
  housing: '🏠',
  utilities: '⚡',
  salary: '💼',
  freelance: '💻',
  investment: '📈',
  gift: '🎁',
  other: '📦'
}

export function FinanceWidget({ widgetId, title, config, widget }: FinanceWidgetProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    type: 'expense' as const,
    amount: '',
    currency: config.currency || 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [maxEntries] = useState(config.maxEntries || 5)
  const router = useRouter()

  useEffect(() => {
    fetchFinanceEntries()
  }, [])

  const fetchFinanceEntries = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      // Get last 30 days of entries
      const response = await fetch('/api/finance?days=30', { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch finance entries')
      }
      
      const data = await response.json()
      // Handle both possible response structures
      const entries = data.entries || data.finance_entries || []
      setEntries(entries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance entries')
    } finally {
      setLoading(false)
    }
  }

  const addFinanceEntry = async () => {
    try {
      if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) return

      const headers = await getAuthHeaders()
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: newEntry.type,
          amount: parseFloat(newEntry.amount),
          currency: newEntry.currency,
          category: newEntry.category.trim() || null,
          description: newEntry.description.trim() || null,
          date: newEntry.date
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add finance entry')
      }

      const data = await response.json()
      // Handle both possible response structures
      const newEntryData = data.entry || data.finance_entry
      setEntries(prev => [newEntryData, ...prev])
      setNewEntry({
        type: 'expense',
        amount: '',
        currency: config.currency || 'USD',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add finance entry')
    }
  }

  const getRecentEntries = () => {
    return entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxEntries)
  }

  const getQuickStats = () => {
    const recentEntries = entries.slice(0, 10) // Last 10 entries
    const income = recentEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = recentEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    return { income, expenses, balance: income - expenses }
  }

  const handleViewMore = () => {
    router.push('/dashboard/finance')
  }

  if (loading) {
    return (
      <WidgetWrapper widget={widget}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading transactions...</p>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (error) {
    return (
      <WidgetWrapper widget={widget}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  const recentEntries = getRecentEntries()
  const stats = getQuickStats()

  return (
    <WidgetWrapper 
      widget={widget} 
      onViewMore={handleViewMore}
    >
      <div className="h-full flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <DollarSign className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Add Transaction"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats */}
        {entries.length > 0 && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-green-600">📈 ${stats.income.toFixed(2)}</span>
                <span className="text-red-600">📉 ${stats.expenses.toFixed(2)}</span>
                <span className={`${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  💰 ${stats.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="p-3 bg-purple-50 border-b border-purple-200 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, type: e.target.value as any }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && addFinanceEntry()}
                />
                <select
                  value={newEntry.currency}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, currency: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={addFinanceEntry}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newEntry.description}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {recentEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No transactions</p>
                <p className="text-xs text-gray-400 mt-1">Add your first transaction</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-2 rounded-lg border transition-all ${
                    entry.type === 'income' 
                      ? 'bg-green-50 border-green-200' 
                      : entry.type === 'expense'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">{typeIcons[entry.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {entry.description || entry.category || entry.type}
                          </h4>
                          {entry.category && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                              <Tag className="w-3 h-3" />
                              <span>{entry.category}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className={`text-sm font-medium ${typeColors[entry.type]}`}>
                            {entry.type === 'expense' ? '-' : '+'}${entry.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  )
} 