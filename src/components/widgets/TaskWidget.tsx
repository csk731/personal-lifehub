'use client'

import { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  Flag,
  AlertCircle
} from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { getAuthHeaders } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  category: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface TaskWidgetProps {
  widgetId: string
  title: string
  config: {
    maxItems?: number
  }
  widget: {
    id: string
    width: number
    height: number
    name: string
  }
}

const priorityColors = {
  low: 'text-gray-500 bg-gray-100',
  medium: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  urgent: 'text-red-600 bg-red-100'
}

const priorityIcons = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴'
}

export function TaskWidget({ widgetId, title, config, widget }: TaskWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as const,
    due_date: ''
  })
  const [maxItems] = useState(config.maxItems || 5)
  const router = useRouter()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/tasks', { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    try {
      if (!newTask.title.trim()) return

      const headers = await getAuthHeaders()
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTask.title.trim(),
          priority: newTask.priority,
          due_date: newTask.due_date || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add task')
      }

      const data = await response.json()
      setTasks(prev => [data.task, ...prev])
      setNewTask({
        title: '',
        priority: 'medium',
        due_date: ''
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

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

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    // Compare only the UTC date parts
    if (
      due.getUTCFullYear() < now.getUTCFullYear() ||
      (due.getUTCFullYear() === now.getUTCFullYear() && due.getUTCMonth() < now.getUTCMonth()) ||
      (due.getUTCFullYear() === now.getUTCFullYear() && due.getUTCMonth() === now.getUTCMonth() && due.getUTCDate() < now.getUTCDate())
    ) {
      return true;
    }
    return false;
  }

  const getImportantTasks = () => {
    const today = new Date().toISOString().split('T')[0]
    
    return tasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => {
        // First: urgent tasks
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
        
        // Second: high priority tasks
        if (a.priority === 'high' && b.priority !== 'high') return -1
        if (b.priority === 'high' && a.priority !== 'high') return 1
        
        // Third: due today
        if (isDueToday(a.due_date) && !isDueToday(b.due_date)) return -1
        if (isDueToday(b.due_date) && !isDueToday(a.due_date)) return 1
        
        // Fourth: due soon
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        
        return 0
      })
      .slice(0, maxItems)
  }

  const handleViewMore = () => {
    router.push('/dashboard/tasks')
  }

  if (loading) {
    return (
      <WidgetWrapper widget={widget}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading tasks...</p>
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

  const importantTasks = getImportantTasks()

  return (
    <WidgetWrapper 
      widget={widget} 
      onViewMore={handleViewMore}
    >
      <div className="h-full flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="p-3 bg-green-50 border-b border-green-200 flex-shrink-0">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 text-gray-700 placeholder-gray-400 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <div className="flex items-center space-x-2">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 text-gray-700 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 text-gray-700 bg-white"
                />
                <button
                  onClick={addTask}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {importantTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No pending tasks</p>
                <p className="text-xs text-gray-500 mt-1">Great job! All caught up</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {importantTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border transition-all ${
                    task.priority === 'urgent' 
                      ? 'bg-red-50 border-red-200' 
                      : task.priority === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="flex-shrink-0 mt-0.5"
                    >
                      <Square className="w-4 h-4 text-gray-400 hover:text-green-600" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                            {priorityIcons[task.priority]} {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {task.due_date && (
                            <div className={`flex items-center space-x-1 ${
                              isOverdue(task.due_date) ? 'text-red-600' : ''
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>
                                {isOverdue(task.due_date) ? 'Overdue' : 'Due'} {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {task.category && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3" />
                              <span>{task.category}</span>
                            </div>
                          )}
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