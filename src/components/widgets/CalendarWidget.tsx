'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { CalendarEvent, Calendar } from '@/types';
import { getAuthHeaders } from '@/lib/utils';
import { format, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';
import Link from 'next/link';

interface CalendarWidgetProps {
  widgetId: string;
  title: string;
  config: Record<string, any>;
  widget: any;
}

export function CalendarWidget({ widgetId, title, config, widget }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxEvents] = useState(config.maxEvents || 5);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      // Fetch calendars
      const calendarsResponse = await fetch('/api/calendars', { headers });
      if (calendarsResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        setCalendars(calendarsData.calendars || []);
      }

      // Fetch upcoming events (next 7 days)
      const startDate = new Date().toISOString();
      const endDate = addDays(new Date(), 7).toISOString();
      
      const eventsResponse = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`, { headers });
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getEventTime = (event: CalendarEvent) => {
    if (event.is_all_day) return 'All day';
    
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    
    const startFormatted = format(startTime, 'h:mm a');
    const endFormatted = format(endTime, 'h:mm a');
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars.find(c => c.id === calendarId);
    return calendar?.color || '#007AFF';
  };

  const upcomingEvents = events
    .filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, maxEvents);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
        </div>
        <Link 
          href="/dashboard/calendar"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">No upcoming events</p>
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </Link>
          </div>
        ) : (
          upcomingEvents.map((event) => {
            const eventDate = new Date(event.start_time);
            const calendarColor = getCalendarColor(event.calendar_id);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer"
              >
                <Link href="/dashboard/calendar">
                  <div className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start space-x-3">
                      {/* Color indicator */}
                      <div 
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: calendarColor }}
                      />
                      
                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {getEventDateLabel(eventDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{getEventTime(event)}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {upcomingEvents.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <Link
            href="/dashboard/calendar"
            className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>View all events</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
} 