'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Bell,
  ChevronDown,
  Check
} from 'lucide-react';
import { Calendar, EventFormData } from '@/types';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { getAuthHeaders } from '@/lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  onEventCreated?: (event: any) => void;
  onEventUpdated?: (event: any) => void;
  onEventDeleted?: (eventId: string) => void;
  calendars: Calendar[];
  event?: any; // For editing existing events
}

const reminderOptions = [
  { value: 0, label: 'None' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' }
];

export function EventModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  calendars,
  event
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_all_day: false,
    calendar_id: '',
    reminder_minutes: 15
  });

  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: format(startDate, 'yyyy-MM-dd'),
          start_time: format(startDate, 'HH:mm'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          end_time: format(endDate, 'HH:mm'),
          is_all_day: event.is_all_day || false,
          calendar_id: event.calendar_id || '',
          reminder_minutes: event.reminder_minutes || 15
        });
      } else if (selectedDate) {
        // Creating new event - reset form completely
        const startDate = format(selectedDate, 'yyyy-MM-dd');
        const startTime = format(selectedDate, 'HH:mm');
        const endTime = format(addHours(selectedDate, 1), 'HH:mm');
        
        setFormData({
          title: '',
          description: '',
          location: '',
          start_date: startDate,
          start_time: startTime,
          end_date: startDate,
          end_time: endTime,
          is_all_day: false,
          calendar_id: calendars.find(c => c.is_default)?.id || calendars[0]?.id || '',
          reminder_minutes: 15
        });
      }
      // Reset errors when modal opens
      setErrors({});
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen, selectedDate, calendars, event]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.calendar_id) {
      newErrors.calendar_id = 'Please select a calendar';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (!formData.is_all_day) {
      if (!formData.start_time) {
        newErrors.start_time = 'Start time is required';
      }
      if (!formData.end_time) {
        newErrors.end_time = 'End time is required';
      }
    }

    // Check if end time is after start time
    if (!formData.is_all_day && formData.start_time && formData.end_time) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const startDateTime = formData.is_all_day 
        ? `${formData.start_date}T00:00:00.000Z`
        : new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
      
      const endDateTime = formData.is_all_day
        ? `${formData.end_date}T23:59:59.999Z`
        : new Date(`${formData.end_date}T${formData.end_time}`).toISOString();

      const url = event ? `/api/calendar/events/${event.id}` : '/api/calendar/events';
      const method = event ? 'PUT' : 'POST';

      const headers = await getAuthHeaders();

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_time: startDateTime,
          end_time: endDateTime,
          is_all_day: formData.is_all_day,
          calendar_id: formData.calendar_id,
          reminder_minutes: formData.reminder_minutes
        }),
      });

      if (response.ok) {
        const { event: createdEvent } = await response.json();
        if (event) {
          onEventUpdated?.(createdEvent);
        } else {
          onEventCreated?.(createdEvent);
        }
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || `Failed to ${event ? 'update' : 'create'} event` });
      }
    } catch (error) {
      console.error(`Error ${event ? 'updating' : 'creating'} event:`, error);
      setErrors({ submit: `Failed to ${event ? 'update' : 'create'} event` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'DELETE',
        headers,
      });
      if (response.ok) {
        onEventDeleted?.(event.id);
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to delete event' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to delete event' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      is_all_day: false,
      calendar_id: '',
      reminder_minutes: 15
    });
    setErrors({});
  };

  const selectedCalendar = calendars.find(c => c.id === formData.calendar_id);
  const selectedReminder = reminderOptions.find(r => r.value === formData.reminder_minutes);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {event ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form - Scrollable */}
            <form id="event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Calendar Selection */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 ${
                    errors.calendar_id ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {selectedCalendar && (
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedCalendar.color }}
                      />
                    )}
                    <span className={`text-sm sm:text-base ${selectedCalendar ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedCalendar?.name || 'Select Calendar'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showCalendarDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {calendars.map((calendar) => (
                      <button
                        key={calendar.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, calendar_id: calendar.id }));
                          setShowCalendarDropdown(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-gray-900">{calendar.name}</span>
                        {formData.calendar_id === calendar.id && (
                          <Check className="w-4 h-4 text-blue-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {errors.calendar_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.calendar_id}</p>
                )}
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={formData.is_all_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_all_day: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="all-day" className="text-sm font-medium text-gray-700">
                  All day
                </label>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 ${
                      errors.start_date ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 ${
                      errors.end_date ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {!formData.is_all_day && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 ${
                        errors.start_time ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {errors.start_time && (
                      <p className="mt-1 text-xs text-red-600">{errors.start_time}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 ${
                        errors.end_time ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {errors.end_time && (
                      <p className="mt-1 text-xs text-red-600">{errors.end_time}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  placeholder="Notes"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Reminder */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowReminderDropdown(!showReminderDropdown)}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm sm:text-base text-gray-900">
                      {selectedReminder?.label || '15 minutes before'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showReminderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                    {reminderOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, reminder_minutes: option.value }));
                          setShowReminderDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900">{option.label}</span>
                        {formData.reminder_minutes === option.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <p className="text-sm text-red-600 text-center">{errors.submit}</p>
              )}
            </form>

            {/* Actions - Fixed at bottom */}
            <div className="flex space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {event && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button
                type="submit"
                form="event-form"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (event ? 'Updating...' : 'Creating...') 
                  : (event ? 'Update Event' : 'Add Event')
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default EventModal; 