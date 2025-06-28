import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Widget, WidgetComponent, WidgetStore } from '@/types';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const widgetTypes = [
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Manage your daily tasks',
    icon: '✅',
    component: 'TaskWidget',
    defaultConfig: {
      maxTasks: 5,
      showCompleted: false,
      sortBy: 'priority'
    }
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Track your expenses and income',
    icon: '💰',
    component: 'FinanceWidget',
    defaultConfig: {
      currency: 'USD',
      showChart: true,
      period: 'month'
    }
  },
  {
    id: 'mood',
    name: 'Mood Tracker',
    description: 'Track your daily mood',
    icon: '😊',
    component: 'MoodWidget',
    defaultConfig: {
      showHistory: true,
      reminderTime: '20:00'
    }
  },
  {
    id: 'notes',
    name: 'Quick Notes',
    description: 'Capture your thoughts and ideas',
    icon: '📝',
    component: 'NotesWidget',
    defaultConfig: {
      maxNotes: 5,
      showSearch: true,
      showCategories: true,
      showStats: true,
      compactMode: false
    }
  }
];

export const useWidgetStore = create<WidgetStore>()(
  devtools(
    persist(
      (set, get) => ({
        widgets: [],
        availableWidgets: [],
        isLoading: false,
        error: null,

        addWidget: async (widgetData) => {
          set({ isLoading: true, error: null });
          try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) throw new Error('User not authenticated');

            const newWidget: Widget = {
              ...widgetData,
              id: uuidv4(),
              user_id: user.data.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
              .from('widgets')
              .insert(newWidget)
              .select()
              .single();

            if (error) throw error;

            set((state) => ({
              widgets: [...state.widgets, data],
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error adding widget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add widget',
              isLoading: false 
            });
          }
        },

        updateWidget: async (widgetId, updates) => {
          set({ isLoading: true, error: null });
          try {
            const updatedData = {
              ...updates,
              updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
              .from('widgets')
              .update(updatedData)
              .eq('id', widgetId)
              .select()
              .single();

            if (error) throw error;

            set((state) => ({
              widgets: state.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, ...data } : widget
              ),
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error updating widget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update widget',
              isLoading: false 
            });
          }
        },

        deleteWidget: async (widgetId) => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase
              .from('widgets')
              .delete()
              .eq('id', widgetId);

            if (error) throw error;

            set((state) => ({
              widgets: state.widgets.filter((widget) => widget.id !== widgetId),
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error deleting widget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete widget',
              isLoading: false 
            });
          }
        },

        loadWidgets: async () => {
          set({ isLoading: true, error: null });
          try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) throw new Error('User not authenticated');

            const { data, error } = await supabase
              .from('widgets')
              .select('*')
              .eq('user_id', user.data.user.id)
              .eq('active', true)
              .order('created_at', { ascending: true });

            if (error) throw error;

            set({ widgets: data || [], isLoading: false });
          } catch (error) {
            console.error('Error loading widgets:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load widgets',
              isLoading: false 
            });
          }
        },

        loadAvailableWidgets: () => {
          // This will be populated with actual widget components
          // For now, we'll set up the basic structure
          const availableWidgets: WidgetComponent[] = [
            {
              id: 'task-manager',
              name: 'Task Manager',
              type: 'task-manager',
              description: 'Manage your daily tasks and to-dos',
              icon: 'CheckSquare',
              defaultSize: { width: 4, height: 6 },
              defaultSettings: {},
              component: () => null, // Will be replaced with actual components
              category: 'productivity',
              version: '1.0.0',
              isActive: true,
            },
            {
              id: 'mood-tracker',
              name: 'Mood Tracker',
              type: 'mood-tracker',
              description: 'Track your daily mood and emotions',
              icon: 'Smile',
              defaultSize: { width: 3, height: 4 },
              defaultSettings: {},
              component: () => null,
              category: 'health',
              version: '1.0.0',
              isActive: true,
            },
            {
              id: 'finance-tracker',
              name: 'Finance Tracker',
              type: 'finance-tracker',
              description: 'Monitor your expenses and budget',
              icon: 'DollarSign',
              defaultSize: { width: 6, height: 8 },
              defaultSettings: {},
              component: () => null,
              category: 'finance',
              version: '1.0.0',
              isActive: true,
            },
          ];

          set({ availableWidgets });
        },
      }),
      {
        name: 'widget-store',
        partialize: (state) => ({
          availableWidgets: state.availableWidgets,
        }),
      }
    ),
    { name: 'widget-store' }
  )
); 