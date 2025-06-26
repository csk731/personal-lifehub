'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Frown, 
  Meh, 
  Plus, 
  Search,
  Calendar,
  ArrowLeft,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  X,
  Heart,
  Zap,
  Moon,
  Activity,
  Clock,
  Target,
  Eye,
  EyeOff,
  Brain,
  Coffee,
  Bed,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp as LineChart,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import Link from 'next/link';

interface MoodEntry {
  id: string;
  mood_score: number;
  mood_emoji: string;
  mood_label: string;
  notes: string | null;
  date: string;
  created_at: string;
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
};

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
};

const moodColors = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#eab308',
  5: '#fbbf24',
  6: '#fde047',
  7: '#a3e635',
  8: '#22c55e',
  9: '#3b82f6',
  10: '#8b5cf6'
};

const moodZones = {
  low: { min: 1, max: 4, color: '#fef2f2', borderColor: '#fecaca' },
  okay: { min: 5, max: 5, color: '#fffbeb', borderColor: '#fed7aa' },
  good: { min: 6, max: 7, color: '#f0fdf4', borderColor: '#bbf7d0' },
  great: { min: 8, max: 10, color: '#faf5ff', borderColor: '#c4b5fd' }
};

// Add streak calculation utilities
function calculateStreaks(entries: MoodEntry[]) {
  // Sort entries by date descending
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  let bestStreak = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    if (!prevDate) {
      streak = 1;
    } else {
      const diff = (prevDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        streak = 1;
      }
    }
    if (streak > bestStreak) bestStreak = streak;
    prevDate = entryDate;
  }

  // Calculate current streak (ending today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let curStreak = 0;
  for (let i = 0; i < 1000; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    if (entries.some(e => e.date === dateString)) {
      curStreak++;
    } else {
      break;
    }
  }
  return { currentStreak: curStreak, bestStreak };
}

// Sparkline utility
function getSparklinePoints(entries: MoodEntry[], width = 80, height = 24) {
  if (!entries.length) return '';
  const maxScore = 10;
  const minScore = 1;
  const n = entries.length;
  return entries
    .map((entry, i) => {
      const x = (i / (n - 1)) * (width - 4) + 2;
      const y = height - 2 - ((entry.mood_score - minScore) / (maxScore - minScore)) * (height - 4);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function MoodPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    mood_score: 5,
    mood_emoji: moodEmojis[5],
    mood_label: moodLabels[5],
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    search: '',
    moodRange: ''
  });
  const [sortBy, setSortBy] = useState<'created_at' | 'mood_score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedView, setSelectedView] = useState<'all' | 'week' | 'month'>('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; entry: MoodEntry; day: string } | null>(null);
  const [quickActionTile, setQuickActionTile] = useState<{ index: number; x: number; y: number } | null>(null);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoPopup, setIsAutoPopup] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const moodGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  // Check if today's mood is logged and show popup if not
  useEffect(() => {
    if (!loading && moodEntries.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = moodEntries.find(entry => entry.date === today);
      
      if (!todayEntry) {
        // Small delay to ensure page is loaded
        const timer = setTimeout(() => {
          setIsAutoPopup(true);
          setShowAddModal(true);
          setNewEntry(prev => ({ ...prev, date: today }));
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loading, moodEntries]);

  // Keyboard shortcut: Spacebar to open modal (when not in modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAddModal) return;
      if (e.code === 'Space' && !showAddModal) {
        e.preventDefault();
        handleOpenAddModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Keyboard navigation for mood selection in modal
  useEffect(() => {
    if (!showAddModal) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if (!moodGridRef.current) return;
      const moods = Array.from(moodGridRef.current.querySelectorAll('button'));
      const currentIdx = moods.findIndex(btn => btn.getAttribute('aria-pressed') === 'true');
      let nextIdx = currentIdx;
      if (e.key === 'ArrowRight') nextIdx = Math.min(moods.length - 1, currentIdx + 1);
      if (e.key === 'ArrowLeft') nextIdx = Math.max(0, currentIdx - 1);
      if (e.key === 'ArrowUp') nextIdx = Math.max(0, currentIdx - 5);
      if (e.key === 'ArrowDown') nextIdx = Math.min(moods.length - 1, currentIdx + 5);
      if (nextIdx !== currentIdx) {
        e.preventDefault();
        (moods[nextIdx] as HTMLElement).focus();
        moods[nextIdx].click();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        addMoodEntry();
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [showAddModal, newEntry]);

  // Check if there's already an entry for today
  const getExistingEntryForDate = (date: string) => {
    return moodEntries.find(entry => entry.date === date);
  };

  // Check if date is in the future
  const isFutureDate = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate > today;
  };

  // Get mood zone for a score
  const getMoodZone = (score: number) => {
    return Object.entries(moodZones).find(([_, zone]) => 
      score >= zone.min && score <= zone.max
    )?.[0] || 'okay';
  };

  // Smart mood prediction based on time and patterns
  const getPredictedMood = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Simple prediction based on time of day
    if (hour < 12) return 6; // Morning - usually okay
    if (hour < 18) return 7; // Afternoon - usually good
    return 5; // Evening - neutral
  };

  const handleOpenAddModal = (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const existingEntry = getExistingEntryForDate(targetDate);
    
    if (existingEntry) {
      setNewEntry({
        mood_score: existingEntry.mood_score,
        mood_emoji: existingEntry.mood_emoji,
        mood_label: existingEntry.mood_label,
        notes: existingEntry.notes || '',
        date: targetDate
      });
    } else {
      const predictedMood = getPredictedMood();
      setNewEntry({
        mood_score: predictedMood,
        mood_emoji: moodEmojis[predictedMood as keyof typeof moodEmojis],
        mood_label: moodLabels[predictedMood as keyof typeof moodLabels],
        notes: '',
        date: targetDate
      });
    }
    setShowAddModal(true);
  };

  const fetchMoodEntries = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/mood', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood entries');
      }
      
      const data = await response.json();
      setMoodEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mood entries');
    } finally {
      setLoading(false);
    }
  };

  const addMoodEntry = async () => {
    if (isFutureDate(newEntry.date)) {
      setError('Cannot log mood for future dates');
      return;
    }

    try {
      setSaving(true);
      const headers = await getAuthHeaders();
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
      });

      if (!response.ok) {
        throw new Error('Failed to add mood entry');
      }

      const data = await response.json();
      
      const existingEntryIndex = moodEntries.findIndex(entry => entry.date === newEntry.date);
      
      if (existingEntryIndex !== -1) {
        setMoodEntries(prev => prev.map((entry, index) => 
          index === existingEntryIndex ? data.entry : entry
        ));
      } else {
        setMoodEntries(prev => [data.entry, ...prev]);
      }
      
      setShowAddModal(false);
      setIsAutoPopup(false);
      setNewEntry({
        mood_score: 5,
        mood_emoji: moodEmojis[5],
        mood_label: moodLabels[5],
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mood entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteMoodEntry = async (entryId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/mood/${entryId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete mood entry');
      }

      setMoodEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mood entry');
    }
  };

  const filteredAndSortedEntries = () => {
    let filtered = moodEntries;

    if (selectedView === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= weekAgo;
      });
    } else if (selectedView === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= monthAgo;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.notes?.toLowerCase().includes(searchLower) ||
        entry.mood_label.toLowerCase().includes(searchLower)
      );
    }

    if (filters.moodRange) {
      const [min, max] = filters.moodRange.split('-').map(Number);
      filtered = filtered.filter(entry => entry.mood_score >= min && entry.mood_score <= max);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'mood_score':
          aValue = a.mood_score;
          bValue = b.mood_score;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getMoodStats = () => {
    if (moodEntries.length === 0) return null;

    const total = moodEntries.length;
    const avgMood = moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / total;
    const highest = Math.max(...moodEntries.map(e => e.mood_score));
    const lowest = Math.min(...moodEntries.map(e => e.mood_score));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const recentEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= weekAgo;
    });
    const recentAvgMood = recentEntries.length > 0 
      ? recentEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / recentEntries.length 
      : 0;

    // Calculate trends
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const previousWeekEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= twoWeeksAgo && entryDate < weekAgo;
    });
    const previousWeekAvg = previousWeekEntries.length > 0 
      ? previousWeekEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / previousWeekEntries.length 
      : 0;

    const trend = recentAvgMood - previousWeekAvg;

    return { 
      total, 
      avgMood: Math.round(avgMood * 10) / 10, 
      highest,
      lowest,
      recentAvgMood: Math.round(recentAvgMood * 10) / 10,
      trend: Math.round(trend * 10) / 10
    };
  };

  const generateWeekData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const entry = getExistingEntryForDate(dateString);
      
      days.push({
        date,
        dateString,
        entry,
        isToday: i === 0,
        isFuture: isFutureDate(dateString)
      });
    }
    
    return days;
  };

  const renderMoodLineGraph = () => {
    const weekData = generateWeekData();
    const hasData = weekData.some(day => day.entry);
    
    if (!hasData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No mood data yet</h3>
            <p className="text-gray-600 mb-6">Log your first mood to see your emotional journey</p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Log Your First Mood
            </button>
          </div>
        </div>
      );
    }

    const maxScore = 10;
    const graphHeight = 200;
    const graphWidth = 600;
    const padding = 40;
    const chartWidth = graphWidth - (padding * 2);
    const chartHeight = graphHeight - (padding * 2);

    const points = weekData.map((day, index) => {
      const x = padding + (index * chartWidth / 6);
      const score = day.entry ? day.entry.mood_score : 0;
      const y = padding + chartHeight - (score / maxScore * chartHeight);
      return { x, y, day, score };
    });

    const pathData = points
      .filter(point => point.score > 0)
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Mood Trend</h2>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <Info className="w-4 h-4" />
            <span>Hover for details</span>
          </div>
        </div>

        <div className="relative">
          <svg width={graphWidth} height={graphHeight} className="w-full max-w-full">
            {/* Mood zone backgrounds */}
            {Object.entries(moodZones).map(([zone, config]) => {
              const y1 = padding + chartHeight - (config.max / maxScore * chartHeight);
              const y2 = padding + chartHeight - (config.min / maxScore * chartHeight);
              return (
                <rect
                  key={zone}
                  x={padding}
                  y={y1}
                  width={chartWidth}
                  height={y2 - y1}
                  fill={config.color}
                  opacity={0.3}
                />
              );
            })}

            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((score) => {
              const y = padding + chartHeight - (score / maxScore * chartHeight);
              return (
                <line
                  key={score}
                  x1={padding}
                  y1={y}
                  x2={graphWidth - padding}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              );
            })}

            {/* Mood line with gradient */}
            {pathData && (
              <>
                <defs>
                  <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`}
                  fill="url(#moodGradient)"
                />
                <path
                  d={pathData}
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  fill="none"
                  className="animate-draw"
                  style={{
                    strokeDasharray: pathData.split(' ').length * 10,
                    strokeDashoffset: pathData.split(' ').length * 10,
                    animation: 'draw 2s ease-in-out forwards'
                  }}
                />
              </>
            )}

            {/* Data points with hover effects */}
            {points.map((point, index) => (
              <g key={index}>
                {point.score > 0 && (
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      fill="white"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      className="cursor-pointer transition-all duration-200 hover:r-10 hover:stroke-4"
                      onMouseEnter={() => {
                        setHoveredPoint(index);
                        setTooltipData({
                          x: point.x,
                          y: point.y,
                          entry: point.day.entry!,
                          day: point.day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                        });
                        setShowTooltip(true);
                      }}
                      onMouseLeave={() => {
                        setHoveredPoint(null);
                        setShowTooltip(false);
                      }}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#8b5cf6"
                      className={hoveredPoint === index ? 'animate-pulse' : ''}
                    />
                  </>
                )}
              </g>
            ))}

            {/* X-axis labels */}
            {weekData.map((day, index) => {
              const x = padding + (index * chartWidth / 6);
              return (
                <text
                  key={index}
                  x={x}
                  y={graphHeight - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </text>
              );
            })}

            {/* Y-axis labels */}
            {[0, 5, 10].map((score) => {
              const y = padding + chartHeight - (score / maxScore * chartHeight);
              return (
                <text
                  key={score}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {score}
                </text>
              );
            })}
          </svg>

          {/* Interactive Tooltip */}
          {showTooltip && tooltipData && (
            <div
              className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 pointer-events-none"
              style={{
                left: `${tooltipData.x - 60}px`,
                top: `${tooltipData.y - 80}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{tooltipData.entry.mood_emoji}</div>
                <div className="font-medium text-gray-900">{tooltipData.entry.mood_label}</div>
                <div className="text-sm text-gray-500">{tooltipData.day}</div>
                <div className="text-sm font-medium text-purple-600">{tooltipData.entry.mood_score}/10</div>
                {tooltipData.entry.notes && (
                  <div className="text-xs text-gray-600 mt-1 max-w-32 truncate">
                    "{tooltipData.entry.notes}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMoodTiles = () => {
    const weekData = generateWeekData();
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Daily Mood</h2>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <Info className="w-4 h-4" />
            <span>Click to log or edit</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {weekData.map((day, index) => {
            const isLogged = !!day.entry;
            const isToday = day.isToday;
            const isFuture = day.isFuture;
            
            return (
              <div key={index} className="text-center relative">
                <div className="text-xs text-gray-500 mb-2">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                
                <button
                  onClick={() => !isFuture && handleOpenAddModal(day.dateString)}
                  disabled={isFuture}
                  className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                    isFuture
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                      : isLogged
                      ? 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 shadow-sm'
                      : isToday
                      ? 'border-purple-500 bg-purple-100 hover:border-purple-600 hover:bg-purple-200 shadow-md'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 shadow-sm'
                  }`}
                  aria-label={isLogged ? `Edit mood for ${day.date.toLocaleDateString()}` : isToday ? 'Log mood for today' : `Log mood for ${day.date.toLocaleDateString()}`}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!isFuture) handleOpenAddModal(day.dateString);
                    }
                  }}
                  onContextMenu={e => handleTileContextMenu(e, index)}
                  onTouchStart={e => handleTileLongPress(index, e)}
                  onTouchEnd={handleTileTouchEnd}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {isLogged ? (
                      <>
                        <span className="text-2xl mb-1 transition-transform duration-200 group-hover:scale-110">{day.entry!.mood_emoji}</span>
                        <span className="text-xs font-medium text-gray-700">
                          {day.entry!.mood_score}/10
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1 animate-pulse"></div>
                      </>
                    ) : isToday ? (
                      <>
                        <Plus className="w-6 h-6 text-purple-600 mb-1 animate-bounce" />
                        <span className="text-xs text-purple-600 font-medium">Log Today</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Log</span>
                      </>
                    )}
                  </div>
                </button>
                
                {/* Quick actions menu */}
                {quickActionTile && quickActionTile.index === index && (
                  <div
                    className="absolute z-50 bg-white border border-gray-200 rounded shadow-lg p-2 flex flex-col min-w-[100px]"
                    style={{ left: quickActionTile.x, top: quickActionTile.y }}
                    onMouseLeave={() => setQuickActionTile(null)}
                  >
                    <button className="text-left px-2 py-1 hover:bg-gray-100" onClick={() => handleQuickAction('edit', day)}>Edit</button>
                    {isLogged && <button className="text-left px-2 py-1 hover:bg-gray-100 text-red-600" onClick={() => handleQuickAction('delete', day)}>Delete</button>}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const streaks = calculateStreaks(moodEntries);
  const weekData = generateWeekData();
  const daysLoggedThisWeek = weekData.filter(day => !!day.entry).length;

  const stats = getMoodStats();
  const displayEntries = filteredAndSortedEntries();

  const weekEntries = filteredAndSortedEntries().slice(-7);
  const sparklinePoints = getSparklinePoints(weekEntries);

  // Mood distribution for insights
  const moodDist = Array(10).fill(0);
  moodEntries.forEach(e => { moodDist[e.mood_score - 1]++; });
  const bestDay = moodEntries.length ? moodEntries.reduce((a, b) => a.mood_score > b.mood_score ? a : b) : null;
  const worstDay = moodEntries.length ? moodEntries.reduce((a, b) => a.mood_score < b.mood_score ? a : b) : null;

  const renderQuickStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
              <div className="flex items-center space-x-1">
                <p className="text-xl font-bold text-purple-600">{stats.recentAvgMood}/10</p>
                {stats.trend !== 0 && (
                  <span className={`text-xs ${stats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trend > 0 ? '↗' : '↘'} {Math.abs(stats.trend)}
                  </span>
                )}
                {/* Sparkline */}
                {weekEntries.length > 1 && (
                  <svg width="80" height="24" className="ml-2">
                    <polyline
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                      points={sparklinePoints}
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">All Time Avg</p>
              <p className="text-xl font-bold text-green-600">{stats.avgMood}/10</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Entries</p>
              <p className="text-xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <LineChart className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
              <p className="text-xl font-bold text-orange-600">
                {displayEntries.length} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Streak</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-yellow-600">{streaks.currentStreak}🔥</span>
                <span className="text-xs text-gray-500">Best: {streaks.bestStreak}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Weekly Progress</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-600">{daysLoggedThisWeek}/7</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(daysLoggedThisWeek / 7) * 100}%` }}
                    aria-valuenow={daysLoggedThisWeek}
                    aria-valuemax={7}
                    aria-label="Days logged this week"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Quick actions for mood tiles
  const handleTileContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setQuickActionTile({ index, x: e.clientX, y: e.clientY });
  };
  const handleTileLongPress = (index: number, e: React.TouchEvent) => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
    const timeout = setTimeout(() => {
      setQuickActionTile({ index, x: e.touches[0].clientX, y: e.touches[0].clientY });
    }, 500);
    setLongPressTimeout(timeout);
  };
  const handleTileTouchEnd = () => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
  };
  const handleQuickAction = (action: 'edit' | 'delete', day: any) => {
    setQuickActionTile(null);
    if (action === 'edit') handleOpenAddModal(day.dateString);
    if (action === 'delete' && day.entry) deleteMoodEntry(day.entry.id);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="w-full h-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
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
              <h1 className="text-2xl font-bold text-gray-900">Mood Tracker</h1>
              <p className="text-sm text-gray-600">Track your daily well-being</p>
            </div>
          </div>
        </div>

        {/* Mood Insights Panel - Prominent Position */}
        {moodEntries.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Mood Insights</span>
              </h3>
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                {moodEntries.length} entries
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Best Day */}
              {bestDay && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{bestDay.mood_emoji}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Best Day</p>
                      <p className="font-medium text-gray-900">{bestDay.mood_label}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(bestDay.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-green-600">{bestDay.mood_score}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Worst Day */}
              {worstDay && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{worstDay.mood_emoji}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest Day</p>
                      <p className="font-medium text-gray-900">{worstDay.mood_label}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(worstDay.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-red-600">{worstDay.mood_score}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mood Distribution */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Mood Distribution</p>
                <div className="flex items-end space-x-1 h-12 mb-2">
                  {moodDist.map((count, i) => (
                    <div 
                      key={i} 
                      className="w-3 bg-purple-300 rounded-t transition-all hover:bg-purple-400" 
                      style={{ height: `${Math.max(count * 8, 2)}px` }} 
                      title={`Score ${i+1}: ${count} days`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            {/* Quick Tip */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> {stats.trend > 0 
                    ? `Great job! Your mood has improved by ${Math.abs(stats.trend)} points this week. Keep it up!`
                    : stats.trend < 0 
                    ? `Your mood has dipped by ${Math.abs(stats.trend)} points this week. Consider what might help you feel better.`
                    : 'Your mood has been stable this week. Consistency is key to understanding your patterns!'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedView('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedView === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSelectedView('week')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedView === 'week' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedView('month')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedView === 'month' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-red-600" />
              </div>
              <p className="text-sm text-red-800 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedView === 'week' ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {renderMoodLineGraph()}
            {renderMoodTiles()}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline View</h3>
              <p className="text-gray-600 mb-6">
                {displayEntries.length === 0 ? 'No entries found' : `${displayEntries.length} entries`}
              </p>
              {displayEntries.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {displayEntries.map((entry, index) => (
                    <div key={entry.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-2xl">{entry.mood_emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{entry.mood_label}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {entry.mood_score}/10
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Mood Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 id="mood-modal-title" className="text-lg font-semibold text-gray-900">
                  {isAutoPopup ? "Welcome back! How are you feeling today?" : "How are you feeling?"}
                </h2>
                {isAutoPopup && (
                  <p className="text-sm text-purple-600 mt-1">Let's start your day with a mood check! 🌟</p>
                )}
                {getExistingEntryForDate(newEntry.date) && (
                  <p className="text-sm text-gray-500 mt-1">Updating mood entry</p>
                )}
                {isFutureDate(newEntry.date) && (
                  <p className="text-sm text-red-500 mt-1">Cannot log mood for future dates</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsAutoPopup(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Mood</label>
                <div ref={moodGridRef} className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map((score) => (
                    <button
                      key={score}
                      aria-pressed={newEntry.mood_score === score}
                      onClick={() => setNewEntry(prev => ({ 
                        ...prev, 
                        mood_score: score,
                        mood_emoji: moodEmojis[score as keyof typeof moodEmojis],
                        mood_label: moodLabels[score as keyof typeof moodLabels]
                      }))}
                      className={`flex flex-col items-center space-y-1 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        newEntry.mood_score === score
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{moodEmojis[score as keyof typeof moodEmojis]}</span>
                      <span className="text-xs font-medium text-gray-700">{score}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {moodLabels[newEntry.mood_score as keyof typeof moodLabels]}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea
                  placeholder="Add notes about your mood..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={addMoodEntry}
                  disabled={isFutureDate(newEntry.date) || saving}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2 ${
                    isFutureDate(newEntry.date) || saving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{getExistingEntryForDate(newEntry.date) ? 'Update Mood' : 'Save Mood'}</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsAutoPopup(false);
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

      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
} 