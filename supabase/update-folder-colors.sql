-- Migration to update folder colors to support all frontend colors
-- This script updates the existing folders table to allow all colors offered by the frontend

-- Step 1: First, update any existing folders that might have invalid colors to 'blue'
-- This prevents the constraint violation error
UPDATE public.folders 
SET color = 'blue' 
WHERE color NOT IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime');

-- Step 2: Drop the existing CHECK constraint
ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS folders_color_check;

-- Step 3: Add the new CHECK constraint with all supported colors
ALTER TABLE public.folders ADD CONSTRAINT folders_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'));

-- Step 4: Verify the constraint is working and show current colors
SELECT DISTINCT color FROM public.folders ORDER BY color; 