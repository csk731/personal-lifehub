-- Simple step-by-step color fix
-- Run each section separately

-- STEP 1: Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- STEP 2: Drop the constraint (run this after step 1)
-- ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS folders_color_check;

-- STEP 3: Create new constraint (run this after step 2)
-- ALTER TABLE public.folders ADD CONSTRAINT folders_color_check 
-- CHECK (color IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'));

-- STEP 4: Test a problematic color (run this after step 3)
-- INSERT INTO public.folders (user_id, name, color, emoji, sort_order) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_RED', 'red', '🧪', 9999);
-- DELETE FROM public.folders WHERE name = 'TEST_RED'; 