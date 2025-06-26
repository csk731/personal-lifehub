import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';

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

function getCategorySuggestions(title: string) {
  const titleLower = title.toLowerCase();
  const suggestions: string[] = [];
  if (titleLower.includes('meeting') || titleLower.includes('call') || titleLower.includes('email') || titleLower.includes('report') || titleLower.includes('presentation') || titleLower.includes('deadline') || titleLower.includes('project')) suggestions.push('work');
  if (titleLower.includes('gym') || titleLower.includes('exercise') || titleLower.includes('workout') || titleLower.includes('meditation') || titleLower.includes('hobby') || titleLower.includes('personal')) suggestions.push('personal');
  if (titleLower.includes('doctor') || titleLower.includes('appointment') || titleLower.includes('medicine') || titleLower.includes('checkup') || titleLower.includes('health') || titleLower.includes('medical')) suggestions.push('health');
  if (titleLower.includes('bill') || titleLower.includes('payment') || titleLower.includes('budget') || titleLower.includes('expense') || titleLower.includes('finance') || titleLower.includes('money')) suggestions.push('finance');
  if (titleLower.includes('buy') || titleLower.includes('purchase') || titleLower.includes('shopping') || titleLower.includes('store') || titleLower.includes('order') || titleLower.includes('shop')) suggestions.push('shopping');
  if (titleLower.includes('clean') || titleLower.includes('laundry') || titleLower.includes('cook') || titleLower.includes('home') || titleLower.includes('house') || titleLower.includes('maintenance')) suggestions.push('home');
  if (titleLower.includes('study') || titleLower.includes('read') || titleLower.includes('learn') || titleLower.includes('course') || titleLower.includes('assignment') || titleLower.includes('homework')) suggestions.push('study');
  return suggestions.slice(0, 3);
}

// Props: open (boolean), onClose (function), onSuccess (function)
export function AddTaskModal({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess?: () => void }) {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category: 'other',
    tags: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  const addTask = async () => {
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
        tags: newTask.tags.filter(tag => tag.trim()),
      }),
    });
    setSaving(false);
    if (response.ok) {
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', category: 'other', tags: [] });
      setShowSuggestions(false);
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  if (title.length > 3) {
                    const suggestions = getCategorySuggestions(title);
                    setCategorySuggestions(suggestions);
                    setShowSuggestions(suggestions.length > 0);
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
                onClick={onClose}
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
  );
} 