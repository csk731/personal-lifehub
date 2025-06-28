-- Final fix for folder colors - completely recreate the constraint
-- This will ensure all colors work properly

-- Step 1: Drop any existing constraint (if it exists)
ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS folders_color_check;

-- Step 2: Update any existing folders with invalid colors to 'blue'
UPDATE public.folders 
SET color = 'blue' 
WHERE color NOT IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime');

-- Step 3: Create the new constraint with ALL colors
ALTER TABLE public.folders ADD CONSTRAINT folders_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'));

-- Step 4: Verify the constraint was created correctly
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- Step 5: Show all current colors in the database
SELECT DISTINCT color FROM public.folders ORDER BY color;

-- Step 6: Test that all colors can be inserted (this will show any errors)
DO $$
DECLARE
    test_colors TEXT[] := ARRAY['blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'];
    test_color TEXT;
BEGIN
    FOREACH test_color IN ARRAY test_colors
    LOOP
        BEGIN
            INSERT INTO public.folders (user_id, name, color, emoji, sort_order) 
            VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_' || test_color, test_color, '🧪', 9999);
            DELETE FROM public.folders WHERE name = 'TEST_' || test_color;
            RAISE NOTICE 'Color % works correctly', test_color;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Color % failed: %', test_color, SQLERRM;
        END;
    END LOOP;
END $$; 