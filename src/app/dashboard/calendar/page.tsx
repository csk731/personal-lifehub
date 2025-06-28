'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Settings } from 'lucide-react';
import { EventModal } from '@/components/calendar/EventModal';
import CalendarManager from '@/components/calendar/CalendarManager';
import { Calendar as CalendarType, Event } from '@/types';
import { supabase } from '@/lib/supabase';
import { TopBar } from '@/components/dashboard/TopBar';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarManager, setShowCalendarManager] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendars();
    fetchEvents();
  }, [currentDate, view]);

  const createDefaultCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendars')
        .insert({
          user_id: user.id,
          name: 'My Calendar',
          color: '#007AFF',
          description: 'Default calendar',
          is_default: true,
          is_visible: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default calendar:', error);
    }
  };

  const fetchCalendars = async () => {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCalendars(data);
      } else {
        // Create default calendar if none exists
        const defaultCalendar = await createDefaultCalendar();
        if (defaultCalendar) {
          setCalendars([defaultCalendar]);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      // Try to create default calendar on error
      const defaultCalendar = await createDefaultCalendar();
      if (defaultCalendar) {
        setCalendars([defaultCalendar]);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      switch (view) {
        case 'month':
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() + 1, 0);
          break;
        case 'week':
          const dayOfWeek = startDate.getDay();
          startDate.setDate(startDate.getDate() - dayOfWeek);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'day':
          // For day view, fetch a wider range to ensure we get all events
          startDate.setDate(startDate.getDate() - 1);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'agenda':
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() + 3, 0);
          break;
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar:calendars(*)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');

      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarsChange = async () => {
    await fetchCalendars();
    await fetchEvents();
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventCreated = async (event: Event) => {
    await fetchEvents();
    setShowEventModal(false);
  };

  const handleEventUpdated = async (event: Event) => {
    await fetchEvents();
    setShowEventModal(false);
  };

  const handleEventDeleted = (eventId: string) => {
    fetchEvents(); // refresh events list
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'agenda':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getViewTitle = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: view === 'month' || view === 'agenda' ? 'long' : undefined,
      day: view === 'day' ? 'numeric' : undefined
    };
    
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const eventDateStart = eventStart.toISOString().split('T')[0];
      const eventDateEnd = eventEnd.toISOString().split('T')[0];
      
      // Event is on this date if:
      // 1. Event starts on this date, OR
      // 2. Event ends on this date, OR
      // 3. Event spans across this date (starts before and ends after)
      return eventDateStart === dateStr || 
             eventDateEnd === dateStr || 
             (eventStart < new Date(dateStr + 'T00:00:00') && eventEnd > new Date(dateStr + 'T23:59:59'));
    });
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-white p-2 sm:p-3 text-center">
            <span className="text-xs sm:text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}
        
        {days.map(({ date, isCurrentMonth }, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[80px] sm:min-h-[120px] bg-white p-1 sm:p-2 ${
                !isCurrentMonth ? 'text-gray-400' : ''
              }`}
            >
              <div className={`text-xs sm:text-sm font-medium mb-1 ${
                isToday 
                  ? 'bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mx-auto' 
                  : isCurrentMonth 
                    ? 'text-gray-900' 
                    : 'text-gray-400'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-0.5 sm:space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:bg-gray-100"
                    style={{ backgroundColor: `${event.calendar?.color}20`, color: event.calendar?.color }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    
    // Helper function to calculate event position and dimensions
    const getEventPosition = (event: Event, day: Date) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Check if event overlaps with this day (starts, ends, or spans across this day)
      const eventDateStart = eventStart.toISOString().split('T')[0];
      const eventDateEnd = eventEnd.toISOString().split('T')[0];
      const dayDate = day.toISOString().split('T')[0];
      
      // Event is on this day if:
      // 1. Event starts on this day, OR
      // 2. Event ends on this day, OR  
      // 3. Event spans across this day (starts before and ends after)
      const isEventOnThisDay = eventDateStart === dayDate || 
                              eventDateEnd === dayDate || 
                              (eventStart < dayStart && eventEnd > dayEnd);
      
      if (!isEventOnThisDay) return null;
      
      // Calculate position based on when the event intersects with this day
      let startMinutes, endMinutes;
      
      if (eventDateStart === dayDate) {
        // Event starts on this day
        startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
      } else {
        // Event started before this day, start from beginning of day
        startMinutes = 0;
      }
      
      if (eventDateEnd === dayDate) {
        // Event ends on this day
        endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
      } else {
        // Event ends after this day, end at end of day
        endMinutes = 23 * 60 + 59; // 23:59
      }
      
      const duration = endMinutes - startMinutes;
      
      return {
        top: (startMinutes / 60) * 48, // 48px per hour (12px * 4)
        height: Math.max((duration / 60) * 48, 24), // Minimum 24px height
        startMinutes,
        endMinutes,
        duration,
        isMultiDay: eventDateStart !== eventDateEnd,
        isStartOfMultiDay: eventDateStart === dayDate && eventDateStart !== eventDateEnd,
        isEndOfMultiDay: eventDateEnd === dayDate && eventDateStart !== eventDateEnd
      };
    };
    
    // Helper function to find overlapping events and calculate their positions
    const getOverlappingEvents = (day: Date) => {
      const dayEvents = getEventsForDate(day).filter(event => !event.is_all_day);
      const overlappingGroups: Event[][] = [];
      
      dayEvents.forEach(event => {
        const pos = getEventPosition(event, day);
        if (!pos) return;
        
        let addedToGroup = false;
        for (const group of overlappingGroups) {
          const groupHasOverlap = group.some(groupEvent => {
            const groupPos = getEventPosition(groupEvent, day);
            if (!groupPos) return false;
            
            return !(pos.endMinutes <= groupPos.startMinutes || pos.startMinutes >= groupPos.endMinutes);
          });
          
          if (groupHasOverlap) {
            group.push(event);
            addedToGroup = true;
            break;
          }
        }
        
        if (!addedToGroup) {
          overlappingGroups.push([event]);
        }
      });
      
      return overlappingGroups;
    };
    
    // Helper function to calculate optimal layout for overlapping events
    const calculateEventLayout = (group: Event[], day: Date) => {
      // Calculate minimum readable width (about 60px minimum for readable text)
      const minColumnWidth = 60; // pixels - reduced for better fit
      const containerWidth = 180; // approximate column width in pixels
      const maxColumns = Math.min(group.length, Math.max(1, Math.floor(containerWidth / minColumnWidth)));
      
      const columns: Event[][] = [];
      
      // Sort events by start time
      const sortedEvents = [...group].sort((a, b) => {
        const posA = getEventPosition(a, day);
        const posB = getEventPosition(b, day);
        if (!posA || !posB) return 0;
        return posA.startMinutes - posB.startMinutes;
      });
      
      // Distribute events across columns
      for (let i = 0; i < maxColumns; i++) {
        columns[i] = [];
      }
      
      sortedEvents.forEach((event, index) => {
        const columnIndex = index % maxColumns;
        columns[columnIndex].push(event);
      });
      
      return {
        columns,
        totalEvents: group.length,
        maxColumns,
        hasOverflow: group.length > maxColumns * 2, // Reduced threshold for better readability
        columnWidth: 100 / maxColumns
      };
    };
    
    return (
      <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {/* Time column */}
        <div className="bg-white p-3">
          <div className="h-12"></div>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="h-12 text-xs text-gray-500 flex items-center justify-end pr-2">
              {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        {days.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const overlappingGroups = getOverlappingEvents(day);
          
          return (
            <div key={dayIndex} className="bg-white">
              {/* Day header */}
              <div className={`p-3 text-center border-b ${
                isToday ? 'bg-blue-50' : ''
              }`}>
                <div className="text-sm font-medium text-gray-900">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
              </div>
              
              {/* Events container */}
              <div className="relative" style={{ height: '1152px' }}> {/* 24 hours * 48px */}
                {/* Hour grid lines */}
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-b border-gray-100" style={{ top: `${i * 48}px` }} />
                ))}
                
                {/* All-day events at the top */}
                {dayEvents.filter(event => event.is_all_day).map((event, index) => (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 top-1 rounded text-xs p-1 cursor-pointer hover:bg-opacity-80"
                    style={{ 
                      backgroundColor: event.calendar?.color,
                      color: 'white',
                      top: `${index * 24}px`,
                      height: '20px',
                      zIndex: 10
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                
                {/* Time-based events */}
                {overlappingGroups.map((group, groupIndex) => {
                  const { columns, totalEvents, maxColumns, hasOverflow, columnWidth } = calculateEventLayout(group, day);
                  
                  return (
                    <div key={groupIndex}>
                      {columns.map((column, columnIndex) => (
                        <div key={`${groupIndex}-${columnIndex}`} className="absolute top-0 left-0 right-0" style={{ left: `${columnIndex * columnWidth}%`, width: `${columnWidth}%` }}>
                          {column.map((event, eventIndex) => {
                            const pos = getEventPosition(event, day);
                            if (!pos) return null;
                            
                            // Show overflow indicator for the last event in the last column if there's overflow
                            const showOverflow = hasOverflow && columnIndex === columns.length - 1 && eventIndex === column.length - 1;
                            
                            // Determine text size based on column width
                            const isNarrowColumn = columnWidth < 30; // Less than 30% width
                            const textSize = isNarrowColumn ? 'text-[10px]' : 'text-xs';
                            const padding = isNarrowColumn ? 'p-0.5' : 'p-1';
                            
                            return (
                              <div
                                key={event.id}
                                className={`absolute rounded ${textSize} ${padding} cursor-pointer hover:bg-opacity-80 overflow-hidden border border-white/20`}
                                style={{ 
                                  backgroundColor: event.calendar?.color,
                                  color: 'white',
                                  top: `${pos.top}px`,
                                  height: `${pos.height}px`,
                                  left: '1px',
                                  right: '1px',
                                  zIndex: 5,
                                  // Add visual indicators for multi-day events
                                  borderLeft: pos.isStartOfMultiDay ? '3px solid white' : '1px solid rgba(255,255,255,0.2)',
                                  borderRight: pos.isEndOfMultiDay ? '3px solid white' : '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: pos.isMultiDay ? 
                                    (pos.isStartOfMultiDay ? '6px 0 0 6px' : pos.isEndOfMultiDay ? '0 6px 6px 0' : '0') : 
                                    '6px'
                                }}
                                title={`${event.title}${event.description ? ` - ${event.description}` : ''}${pos.isMultiDay ? ' (Multi-day event)' : ''}`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventModal(true);
                                }}
                              >
                                <div className={`font-medium truncate ${textSize}`}>
                                  {isNarrowColumn ? event.title.substring(0, 10) + (event.title.length > 10 ? '...' : '') : event.title}
                                  {pos.isMultiDay && !isNarrowColumn && (
                                    <span className="ml-1 opacity-75">→</span>
                                  )}
                                </div>
                                {pos.height > 32 && !isNarrowColumn && (
                                  <div className={`${textSize} opacity-90 truncate mt-0.5`}>
                                    {pos.isStartOfMultiDay ? 
                                      new Date(event.start_time).toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit',
                                        hour12: true 
                                      }) :
                                      pos.isEndOfMultiDay ?
                                      new Date(event.end_time).toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit',
                                        hour12: true 
                                      }) :
                                      'All day'
                                    }
                                  </div>
                                )}
                                {pos.height > 48 && event.description && !showOverflow && !isNarrowColumn && (
                                  <div className={`${textSize} opacity-75 truncate mt-0.5 line-clamp-1`}>
                                    {event.description}
                                  </div>
                                )}
                                {showOverflow && (
                                  <div className={`${textSize} opacity-90 mt-0.5 font-medium`}>
                                    +{totalEvents - (maxColumns * 2)} more
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    // Helper function to determine event display info
    const getEventDisplayInfo = (event: Event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const eventDateStart = eventStart.toISOString().split('T')[0];
      const eventDateEnd = eventEnd.toISOString().split('T')[0];
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      const isMultiDay = eventDateStart !== eventDateEnd;
      const isStartOfMultiDay = eventDateStart === currentDateStr && eventDateStart !== eventDateEnd;
      const isEndOfMultiDay = eventDateEnd === currentDateStr && eventDateStart !== eventDateEnd;
      const isMiddleOfMultiDay = !isStartOfMultiDay && !isEndOfMultiDay && isMultiDay;
      
      let timeDisplay = '';
      if (event.is_all_day) {
        timeDisplay = 'All day';
      } else if (isStartOfMultiDay) {
        timeDisplay = `${formatTime(event.start_time)} - End of day`;
      } else if (isEndOfMultiDay) {
        timeDisplay = `Start of day - ${formatTime(event.end_time)}`;
      } else if (isMiddleOfMultiDay) {
        timeDisplay = 'All day';
      } else {
        timeDisplay = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
      }
      
      return {
        isMultiDay,
        isStartOfMultiDay,
        isEndOfMultiDay,
        isMiddleOfMultiDay,
        timeDisplay
      };
    };
    
    return (
      <div className="space-y-6">
        {/* Day header */}
        <div className={`text-center p-6 rounded-xl ${
          isToday ? 'bg-blue-50' : 'bg-gray-50'
        }`}>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
        </div>
        
        {/* Events */}
        <div className="space-y-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No events scheduled for this day</p>
            </div>
          ) : (
            dayEvents.map(event => {
              const eventInfo = getEventDisplayInfo(event);
              
              return (
                <div
                  key={event.id}
                  className={`p-4 border rounded-xl hover:border-gray-300 cursor-pointer transition-colors ${
                    eventInfo.isMultiDay ? 'border-l-4' : 'border-gray-200'
                  }`}
                  style={{
                    borderLeftColor: eventInfo.isMultiDay ? event.calendar?.color : undefined,
                    borderLeftWidth: eventInfo.isMultiDay ? '4px' : undefined
                  }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: event.calendar?.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        {eventInfo.isMultiDay && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Multi-day
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{eventInfo.timeDisplay}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    // Group events by date, including multi-day events on all relevant dates
    const groupedEvents = sortedEvents.reduce((groups, event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const eventDateStart = eventStart.toISOString().split('T')[0];
      const eventDateEnd = eventEnd.toISOString().split('T')[0];
      
      // For multi-day events, add them to all relevant dates
      if (eventDateStart === eventDateEnd) {
        // Single day event
        if (!groups[eventDateStart]) {
          groups[eventDateStart] = [];
        }
        groups[eventDateStart].push(event);
      } else {
        // Multi-day event - add to all dates it spans
        const currentDate = new Date(eventDateStart);
        const endDate = new Date(eventDateEnd);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (!groups[dateStr]) {
            groups[dateStr] = [];
          }
          groups[dateStr].push(event);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return groups;
    }, {} as Record<string, Event[]>);

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    // Helper function to determine event display info for agenda
    const getEventDisplayInfo = (event: Event, dateStr: string) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const eventDateStart = eventStart.toISOString().split('T')[0];
      const eventDateEnd = eventEnd.toISOString().split('T')[0];
      
      const isMultiDay = eventDateStart !== eventDateEnd;
      const isStartOfMultiDay = eventDateStart === dateStr && eventDateStart !== eventDateEnd;
      const isEndOfMultiDay = eventDateEnd === dateStr && eventDateStart !== eventDateEnd;
      const isMiddleOfMultiDay = !isStartOfMultiDay && !isEndOfMultiDay && isMultiDay;
      
      let timeDisplay = '';
      if (event.is_all_day) {
        timeDisplay = 'All day';
      } else if (isStartOfMultiDay) {
        timeDisplay = `${formatTime(event.start_time)} - End of day`;
      } else if (isEndOfMultiDay) {
        timeDisplay = `Start of day - ${formatTime(event.end_time)}`;
      } else if (isMiddleOfMultiDay) {
        timeDisplay = 'All day';
      } else {
        timeDisplay = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
      }
      
      return {
        isMultiDay,
        isStartOfMultiDay,
        isEndOfMultiDay,
        isMiddleOfMultiDay,
        timeDisplay
      };
    };

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => {
          const eventDate = new Date(date);
          const isToday = date === new Date().toISOString().split('T')[0];
          
          return (
            <div key={date} className="space-y-3">
              {/* Date header */}
              <div className={`sticky top-0 z-10 ${
                isToday ? 'bg-blue-50' : 'bg-gray-50'
              } p-3 rounded-lg`}>
                <h3 className={`font-semibold ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {eventDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>
              
              {/* Events for this date */}
              <div className="space-y-2">
                {dayEvents.map(event => {
                  const eventInfo = getEventDisplayInfo(event, date);
                  
                  return (
                    <div
                      key={event.id}
                      className={`p-4 border rounded-xl hover:border-gray-300 cursor-pointer transition-colors ${
                        eventInfo.isMultiDay ? 'border-l-4' : 'border-gray-200'
                      }`}
                      style={{
                        borderLeftColor: eventInfo.isMultiDay ? event.calendar?.color : undefined,
                        borderLeftWidth: eventInfo.isMultiDay ? '4px' : undefined
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: event.calendar?.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{event.title}</h4>
                              {eventInfo.isMultiDay && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  Multi-day
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">
                              {eventInfo.timeDisplay}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {sortedEvents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No events in the selected time range</p>
          </div>
        )}
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar isLoggedIn={true} />
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 pt-24 sm:pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your schedule and events</p>
          </div>
          
          <button
            onClick={handleNewEvent}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* View Selector */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto w-full sm:w-auto">
              {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto whitespace-nowrap ${
                    view === viewType
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-800 hover:text-blue-600"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-[120px] sm:min-w-[200px] text-center truncate">
                {getViewTitle()}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-800 hover:text-blue-600"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : (
            <div className="p-3 sm:p-6">
              {renderView()}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedEvent ? new Date(selectedEvent.start_time) : currentDate}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        calendars={calendars}
        event={selectedEvent}
      />
    </div>
  );
} 