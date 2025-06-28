-- Force update folder colors - aggressive approach
-- This will definitely fix the color constraint issue

-- Step 1: Show current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- Step 2: Drop ALL constraints on the color column
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.folders'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%color%'
    LOOP
        EXECUTE 'ALTER TABLE public.folders DROP CONSTRAINT ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Step 3: Verify all constraints are dropped
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- Step 4: Create the new constraint with ALL colors
ALTER TABLE public.folders ADD CONSTRAINT folders_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'));

-- Step 5: Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- Step 6: Test inserting each color
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
            RAISE NOTICE '✅ Color % works correctly', test_color;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Color % failed: %', test_color, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 7: Show final state
SELECT DISTINCT color FROM public.folders ORDER BY color; 