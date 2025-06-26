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
  | 'weather'
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