export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Widget {
  id: string;
  user_id: string;
  name: string;
  type: WidgetType;
  settings: Record<string, any>;
  position: WidgetPosition;
  size: WidgetSize;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  order: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export type WidgetType = 
  | 'task-manager'
  | 'fitness-tracker'
  | 'finance-tracker'
  | 'mood-tracker'
  | 'journal'
  | 'grocery-list'
  | 'calendar'
  | 'notes'
  | 'habit-tracker';

export interface WidgetComponent {
  id: string;
  name: string;
  type: WidgetType;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  defaultSettings: Record<string, any>;
  component: React.ComponentType<WidgetProps>;
  category: WidgetCategory;
  version: string;
  isActive: boolean;
}

export type WidgetCategory = 
  | 'productivity'
  | 'health'
  | 'finance'
  | 'social'
  | 'entertainment'
  | 'utilities';

export interface WidgetProps {
  widget: Widget;
  onUpdate: (widgetId: string, updates: Partial<Widget>) => void;
  onDelete: (widgetId: string) => void;
  isEditing?: boolean;
}

export interface DashboardLayout {
  id: string;
  user_id: string;
  name: string;
  widgets: Widget[];
  layout_data: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetStore {
  widgets: Widget[];
  availableWidgets: WidgetComponent[];
  isLoading: boolean;
  error: string | null;
  addWidget: (widget: Omit<Widget, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => Promise<void>;
  deleteWidget: (widgetId: string) => Promise<void>;
  loadWidgets: () => Promise<void>;
  loadAvailableWidgets: () => void;
}

export interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  daily_summary: boolean;
  task_reminders: boolean;
  mood_prompts: boolean;
  fitness_goals: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
  notifications: NotificationSettings;
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      widgets: {
        Row: Widget;
        Insert: Omit<Widget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Widget, 'id' | 'created_at' | 'updated_at'>>;
      };
      dashboard_layouts: {
        Row: DashboardLayout;
        Insert: Omit<DashboardLayout, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DashboardLayout, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  color: string;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  created_at: string;
  updated_at: string;
  wordCount: number;
  characterCount: number;
}

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface NoteColor {
  name: string;
  bg: string;
  border: string;
  text: string;
}

export interface Calendar {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description?: string;
  is_default: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  calendar_id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule?: string; // RRULE format
  reminder_minutes?: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  calendar_id: string;
  reminder_minutes?: number;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
}

export interface CalendarSettings {
  default_view: CalendarView['type'];
  week_starts_on: 0 | 1; // 0 = Sunday, 1 = Monday
  show_week_numbers: boolean;
  show_today_indicator: boolean;
  default_reminder_minutes: number;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date?: string;
  end_occurrences?: number;
  by_day?: string[]; // ['MO', 'WE', 'FR']
  by_month_day?: number[];
  by_month?: number[];
} 