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

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast?: DailyForecast[];
  lastUpdated: string;
}

export interface WeatherLocation {
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  localtime: string;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  condition: WeatherCondition;
  humidity: number;
  wind_kph: number;
  wind_mph: number;
  wind_dir: string;
  pressure_mb: number;
  feelslike_c: number;
  feelslike_f: number;
  uv: number;
  visibility_km: number;
  cloud: number;
  is_day: boolean;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface DailyForecast {
  date: string;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_kph: number;
    maxwind_mph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    daily_chance_of_snow: number;
    condition: WeatherCondition;
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
    moon_illumination: string;
  };
  hour: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temp_c: number;
  temp_f: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_mph: number;
  wind_dir: string;
  pressure_mb: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  windchill_c: number;
  windchill_f: number;
  heatindex_c: number;
  heatindex_f: number;
  dewpoint_c: number;
  dewpoint_f: number;
  will_it_rain: number;
  chance_of_rain: number;
  will_it_snow: number;
  chance_of_snow: number;
  vis_km: number;
  vis_miles: number;
  gust_kph: number;
  gust_mph: number;
  uv: number;
  is_day: boolean;
}

export interface WeatherSettings {
  location: string;
  unit: 'celsius' | 'fahrenheit';
  showForecast: boolean;
  showHourly: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
} 