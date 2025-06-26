-- Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data DISABLE ROW LEVEL SECURITY;

-- Note: Remember to re-enable RLS when you implement authentication:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;
-- (and so on for all tables) 