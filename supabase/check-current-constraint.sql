-- Check current folder color constraint
-- This will show us what colors are actually allowed in the database

-- Check the current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.folders'::regclass 
AND contype = 'c';

-- Check what colors currently exist in the database
SELECT DISTINCT color FROM public.folders ORDER BY color;

-- Try to insert a test folder with each color to see which ones fail
-- (We'll delete it immediately after testing)

-- Test colors that are not working:
-- lime, cyan, teal, orange, gray, indigo, red

-- Test lime
INSERT INTO public.folders (user_id, name, color, emoji, sort_order) 
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_LIME', 'lime', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_LIME';

-- Test cyan  
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_CYAN', 'cyan', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_CYAN';

-- Test teal
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_TEAL', 'teal', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_TEAL';

-- Test orange
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_ORANGE', 'orange', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_ORANGE';

-- Test gray
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_GRAY', 'gray', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_GRAY';

-- Test indigo
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_INDIGO', 'indigo', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_INDIGO';

-- Test red
INSERT INTO public.folders (user_id, name, color, emoji, sort_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'TEST_RED', 'red', '🧪', 9999)
ON CONFLICT DO NOTHING;
DELETE FROM public.folders WHERE name = 'TEST_RED'; 