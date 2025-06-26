-- Test setup script for LifeHub
-- Run this in your Supabase SQL Editor to create a test user

-- Insert a test user profile
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@lifehub.com',
  'Test User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Temporarily disable RLS for testing (optional)
-- ALTER TABLE public.user_widgets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mood_entries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.finance_entries DISABLE ROW LEVEL SECURITY; 