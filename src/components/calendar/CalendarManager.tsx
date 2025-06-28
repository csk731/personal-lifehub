'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Calendar {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_default: boolean;
  is_visible: boolean;
}

interface CalendarManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCalendarsChange: () => void;
}

const CALENDAR_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5856D6', '#FF2D92', '#5AC8FA', '#FFCC02', '#FF6B35',
  '#4CD964', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6'
];

export default function CalendarManager({ isOpen, onClose, onCalendarsChange }: CalendarManagerProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007AFF'
  });

  useEffect(() => {
    if (isOpen) {
      fetchCalendars();
    }
  }, [isOpen]);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendars')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setCalendars(data || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCalendar = async () => {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          is_default: calendars.length === 0 // First calendar becomes default
        }])
        .select()
        .single();

      if (error) throw error;

      setFormData({ name: '', description: '', color: '#007AFF' });
      await fetchCalendars();
      onCalendarsChange();
    } catch (error) {
      console.error('Error creating calendar:', error);
    }
  };

  const updateCalendar = async () => {
    if (!editingCalendar) return;

    try {
      const { error } = await supabase
        .from('calendars')
        .update({
          name: formData.name,
          description: formData.description || null,
          color: formData.color
        })
        .eq('id', editingCalendar.id);

      if (error) throw error;

      setEditingCalendar(null);
      setFormData({ name: '', description: '', color: '#007AFF' });
      await fetchCalendars();
      onCalendarsChange();
    } catch (error) {
      console.error('Error updating calendar:', error);
    }
  };

  const deleteCalendar = async (calendarId: string) => {
    if (!confirm('Are you sure you want to delete this calendar? All events in this calendar will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('id', calendarId);

      if (error) throw error;

      await fetchCalendars();
      onCalendarsChange();
    } catch (error) {
      console.error('Error deleting calendar:', error);
    }
  };

  const toggleCalendarVisibility = async (calendarId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('calendars')
        .update({ is_visible: isVisible })
        .eq('id', calendarId);

      if (error) throw error;

      await fetchCalendars();
      onCalendarsChange();
    } catch (error) {
      console.error('Error toggling calendar visibility:', error);
    }
  };

  const setDefaultCalendar = async (calendarId: string) => {
    try {
      // First, remove default from all calendars
      await supabase
        .from('calendars')
        .update({ is_default: false });

      // Then set the selected calendar as default
      const { error } = await supabase
        .from('calendars')
        .update({ is_default: true })
        .eq('id', calendarId);

      if (error) throw error;

      await fetchCalendars();
      onCalendarsChange();
    } catch (error) {
      console.error('Error setting default calendar:', error);
    }
  };

  const startEditing = (calendar: Calendar) => {
    setEditingCalendar(calendar);
    setFormData({
      name: calendar.name,
      description: calendar.description || '',
      color: calendar.color
    });
  };

  const cancelEditing = () => {
    setEditingCalendar(null);
    setFormData({ name: '', description: '', color: '#007AFF' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCalendar) {
      updateCalendar();
    } else {
      createCalendar();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingCalendar ? 'Edit Calendar' : 'Manage Calendars'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* Calendar List */}
          <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Your Calendars</h3>
              {!editingCalendar && (
                <button
                  onClick={() => setFormData({ name: '', description: '', color: '#007AFF' })}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Calendar</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {calendars.map(calendar => (
                  <div
                    key={calendar.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{calendar.name}</span>
                          {calendar.is_default && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {calendar.description && (
                          <p className="text-sm text-gray-600">{calendar.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={calendar.is_visible}
                          onChange={(e) => toggleCalendarVisibility(calendar.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Show</span>
                      </label>
                      
                      {!calendar.is_default && (
                        <button
                          onClick={() => setDefaultCalendar(calendar.id)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Set Default
                        </button>
                      )}
                      
                      <button
                        onClick={() => startEditing(calendar)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {!calendar.is_default && (
                        <button
                          onClick={() => deleteCalendar(calendar.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="w-full lg:w-80 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCalendar ? 'Edit Calendar' : 'New Calendar'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Calendar name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Calendar description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer"
                    style={{ backgroundColor: formData.color }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Choose Color</span>
                  </button>
                </div>
                
                {showColorPicker && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-5 gap-2">
                      {CALENDAR_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setFormData({ ...formData, color });
                            setShowColorPicker(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                {editingCalendar && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCalendar ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 