-- Check existing users in profiles table
-- Run this in your Supabase SQL Editor

SELECT id, email, full_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC; 