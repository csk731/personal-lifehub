-- Complete Notes and Folders Database Setup Script
-- Run this in your Supabase SQL editor to set up both notes and folders properly

-- ============================================================================
-- NOTES TABLE SETUP (Your existing setup - safe to run again)
-- ============================================================================

-- Drop existing table if it exists (for development)
DROP TABLE IF EXISTS public.notes CASCADE;

-- Create notes table with all required fields
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'ideas', 'todo', 'study', 'other')),
    color TEXT DEFAULT 'default' CHECK (color IN ('default', 'blue', 'green', 'yellow', 'pink', 'purple')),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_color ON public.notes(color);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_is_starred ON public.notes(is_starred);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON public.notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_word_count ON public.notes(word_count);
CREATE INDEX IF NOT EXISTS idx_notes_character_count ON public.notes(character_count);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();

-- Create function to calculate word and character counts
CREATE OR REPLACE FUNCTION calculate_note_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate word count (words separated by whitespace)
    IF NEW.content IS NULL OR trim(NEW.content) = '' THEN
        NEW.word_count := 0;
    ELSE
        NEW.word_count := array_length(
            string_to_array(
                trim(regexp_replace(NEW.content, '\s+', ' ', 'g')), 
                ' '
            ), 
            1
        );
    END IF;
    
    -- Calculate character count
    NEW.character_count := COALESCE(length(NEW.content), 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate stats
DROP TRIGGER IF EXISTS calculate_note_stats_trigger ON public.notes;
CREATE TRIGGER calculate_note_stats_trigger
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_note_stats();

-- ============================================================================
-- FOLDERS TABLE SETUP (New functionality)
-- ============================================================================

-- Folders table for notes organization
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'yellow', 'pink', 'purple', 'gray')),
    icon TEXT DEFAULT '📁',
    emoji TEXT DEFAULT '📁',
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_is_default ON folders(is_default);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own folders" ON folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp for folders
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for folders
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folders_updated_at();

-- Create function to create default folders for new users
CREATE OR REPLACE FUNCTION create_default_folders()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order) VALUES
    (NEW.id, 'All Notes', 'blue', 'Folder', '📁', TRUE, 0),
    (NEW.id, 'Personal', 'blue', 'User', '📝', FALSE, 1),
    (NEW.id, 'Work', 'green', 'Briefcase', '💼', FALSE, 2),
    (NEW.id, 'Ideas', 'yellow', 'Lightbulb', '💡', FALSE, 3),
    (NEW.id, 'Todo', 'pink', 'CheckSquare', '✅', FALSE, 4),
    (NEW.id, 'Study', 'purple', 'BookOpen', '📚', FALSE, 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default folders for new users
DROP TRIGGER IF EXISTS create_default_folders_trigger ON profiles;
CREATE TRIGGER create_default_folders_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_folders();

-- ============================================================================
-- MIGRATION: Create default folders for existing users
-- ============================================================================

-- Create default folders for existing users who don't have any folders yet
INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'All Notes',
    'blue',
    'Folder',
    '📁',
    TRUE,
    0
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id
);

INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Personal',
    'blue',
    'User',
    '📝',
    FALSE,
    1
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id AND f.name = 'Personal'
);

INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Work',
    'green',
    'Briefcase',
    '💼',
    FALSE,
    2
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id AND f.name = 'Work'
);

INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Ideas',
    'yellow',
    'Lightbulb',
    '💡',
    FALSE,
    3
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id AND f.name = 'Ideas'
);

INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Todo',
    'pink',
    'CheckSquare',
    '✅',
    FALSE,
    4
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id AND f.name = 'Todo'
);

INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Study',
    'purple',
    'BookOpen',
    '📚',
    FALSE,
    5
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.folders f WHERE f.user_id = p.id AND f.name = 'Study'
);

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check that tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notes', 'folders');

-- Check that policies were created
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('notes', 'folders');

-- Check that triggers were created
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table IN ('notes', 'folders');

-- Check folders for a specific user (replace 'your-user-id' with actual user ID)
-- SELECT * FROM public.folders WHERE user_id = 'your-user-id' ORDER BY sort_order;

-- Check notes for a specific user (replace 'your-user-id' with actual user ID)
-- SELECT id, title, category, created_at FROM public.notes WHERE user_id = 'your-user-id' ORDER BY updated_at DESC LIMIT 5; 