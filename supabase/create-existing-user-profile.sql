-- Create profile for existing users
-- Run this in your Supabase SQL Editor

-- First, let's see what users exist in auth.users
SELECT id, email, created_at FROM auth.users;

-- Then create profiles for any users that don't have them
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING; 