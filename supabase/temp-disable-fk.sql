-- Temporarily disable foreign key constraints for testing
-- Run this in your Supabase SQL Editor

-- Disable foreign key constraint on user_widgets
ALTER TABLE public.user_widgets DROP CONSTRAINT IF EXISTS user_widgets_user_id_fkey;

-- Note: Remember to re-add the constraint when you implement authentication:
-- ALTER TABLE public.user_widgets ADD CONSTRAINT user_widgets_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE; 