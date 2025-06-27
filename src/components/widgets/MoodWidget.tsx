'use client'

import { useState, useEffect } from 'react'
import { 
  Smile, 
  Plus, 
  Calendar, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { getAuthHeaders } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface MoodEntry {
  id: string
  mood_score: number
  mood_emoji: string
  mood_label: string
  notes: string | null
  date: string
  created_at: string
}

interface MoodWidgetProps {
  widgetId: string
  title: string
  config: {
    maxEntries?: number
  }
  widget: {
    id: string
    width: number
    height: number
    name: string
  }
}

const moodEmojis = {
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
}

const moodLabels = {
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
}

const moodColors = {
  1: 'bg-red-500',
  2: 'bg-red-400',
  3: 'bg-orange-500',
  4: 'bg-orange-400',
  5: 'bg-yellow-500',
  6: 'bg-yellow-400',
  7: 'bg-green-400',
  8: 'bg-green-500',
  9: 'bg-blue-500',
  10: 'bg-purple-500'
}

export function MoodWidget({ widgetId, title, config, widget }: MoodWidgetProps) {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    mood_score: 5,
    mood_emoji: moodEmojis[5],
    mood_label: moodLabels[5],
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [maxEntries] = useState(config.maxEntries || 5)
  const router = useRouter()

  useEffect(() => {
    fetchMoodEntries()
  }, [])

  const fetchMoodEntries = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      // Get last 7 days of entries
      const response = await fetch('/api/mood?days=7', { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood entries')
      }
      
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mood entries')
    } finally {
      setLoading(false)
    }
  }

  const addMoodEntry = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mood_score: newEntry.mood_score,
          mood_emoji: newEntry.mood_emoji,
          mood_label: newEntry.mood_label,
          notes: newEntry.notes.trim() || null,
          date: newEntry.date
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add mood entry')
      }

      const data = await response.json()
      setEntries(prev => [data.entry, ...prev])
      setNewEntry({
        mood_score: 5,
        mood_emoji: moodEmojis[5],
        mood_label: moodLabels[5],
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mood entry')
    }
  }

  const getRecentEntries = () => {
    return entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxEntries)
  }

  const getTodayEntry = () => {
    const today = new Date().toISOString().split('T')[0]
    return entries.find(entry => entry.date === today)
  }

  const handleViewMore = () => {
    router.push('/dashboard/mood')
  }

  if (loading) {
    return (
      <WidgetWrapper widget={widget}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading mood data...</p>
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
  const todayEntry = getTodayEntry()

  return (
    <WidgetWrapper 
      widget={widget} 
      onViewMore={handleViewMore}
    >
      <div className="h-full flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Log Mood"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add Mood Form */}
        {showAddForm && (
          <div className="p-3 bg-green-50 border-b border-green-200 flex-shrink-0">
            <div className="space-y-3">
              {/* Mood Selection */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => setNewEntry(prev => ({
                      ...prev,
                      mood_score: score,
                      mood_emoji: moodEmojis[score as keyof typeof moodEmojis],
                      mood_label: moodLabels[score as keyof typeof moodLabels]
                    }))}
                    className={`p-2 rounded-lg text-center transition-all ${
                      newEntry.mood_score === score
                        ? 'bg-green-200 border-2 border-green-600'
                        : 'bg-white border border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{moodEmojis[score as keyof typeof moodEmojis]}</div>
                    <div className="text-xs text-gray-600">{moodLabels[score as keyof typeof moodLabels]}</div>
                  </button>
                ))}
              </div>
              
              {/* Notes */}
              <input
                type="text"
                placeholder="How are you feeling? (optional)"
                value={newEntry.notes}
                onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 text-gray-700 placeholder-gray-400 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && addMoodEntry()}
              />
              
              {/* Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500"
                />
                <button
                  onClick={addMoodEntry}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Log Mood
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Mood */}
        {todayEntry && (
          <div className="p-3 bg-green-50 border-b border-green-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{todayEntry.mood_emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{todayEntry.mood_label}</div>
                <div className="text-xs text-gray-600">Today's mood</div>
                {todayEntry.notes && (
                  <div className="text-xs text-gray-500 mt-1">"{todayEntry.notes}"</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {recentEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <Smile className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No mood entries</p>
                <p className="text-xs text-gray-500 mt-1">Start tracking your mood</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 rounded-lg border border-gray-200 hover:border-green-300 transition-all bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{entry.mood_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{entry.mood_label}</h4>
                          {entry.notes && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">"{entry.notes}"</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {new Date(entry.date).toLocaleDateString()}
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