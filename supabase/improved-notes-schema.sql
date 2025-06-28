-- Improved Notes and Folders Database Schema
-- This version includes proper foreign key relationships and data consistency

-- ============================================================================
-- FOLDERS TABLE SETUP (Create first since notes will reference it)
-- ============================================================================

-- Drop existing tables in correct order (folders first, then notes)
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;

-- Create folders table with proper constraints
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique folder names per user
    UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_is_default ON folders(is_default);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);

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

-- ============================================================================
-- NOTES TABLE SETUP (Now with proper foreign key to folders)
-- ============================================================================

-- Create notes table with proper foreign key relationships
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL, -- Allow notes to exist without folder
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON public.notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);
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

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp for folders
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp for notes
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate word and character counts
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

-- Function to create default folders for new users
CREATE OR REPLACE FUNCTION create_default_folders()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order) VALUES
    (NEW.id, 'Personal', 'blue', 'User', '📝', TRUE, 1),
    (NEW.id, 'Work', 'green', 'Briefcase', '💼', FALSE, 2),
    (NEW.id, 'Ideas', 'yellow', 'Lightbulb', '💡', FALSE, 3),
    (NEW.id, 'Todo', 'pink', 'CheckSquare', '✅', FALSE, 4),
    (NEW.id, 'Study', 'purple', 'BookOpen', '📚', FALSE, 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle folder deletion (set notes folder_id to NULL)
CREATE OR REPLACE FUNCTION handle_folder_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set folder_id to NULL for all notes in the deleted folder
    UPDATE public.notes 
    SET folder_id = NULL
    WHERE folder_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to validate folder ownership (replaces the CHECK constraint)
CREATE OR REPLACE FUNCTION validate_folder_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- If folder_id is provided, ensure the user owns that folder
    IF NEW.folder_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.folders f 
            WHERE f.id = NEW.folder_id AND f.user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'User does not own the specified folder';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folders_updated_at();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();

DROP TRIGGER IF EXISTS calculate_note_stats_trigger ON public.notes;
CREATE TRIGGER calculate_note_stats_trigger
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_note_stats();

DROP TRIGGER IF EXISTS create_default_folders_trigger ON profiles;
CREATE TRIGGER create_default_folders_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_folders();

DROP TRIGGER IF EXISTS handle_folder_deletion_trigger ON folders;
CREATE TRIGGER handle_folder_deletion_trigger
    BEFORE DELETE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION handle_folder_deletion();

DROP TRIGGER IF EXISTS validate_folder_ownership_trigger ON public.notes;
CREATE TRIGGER validate_folder_ownership_trigger
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION validate_folder_ownership();

-- ============================================================================
-- MIGRATION: Create default folders for existing users
-- ============================================================================

-- Create default folders for existing users who don't have any folders yet
INSERT INTO public.folders (user_id, name, color, icon, emoji, is_default, sort_order)
SELECT 
    p.id,
    'Personal',
    'blue',
    'User',
    '📝',
    TRUE,
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
-- HELPER FUNCTIONS FOR API USE
-- ============================================================================

-- Function to get notes with folder information
CREATE OR REPLACE FUNCTION get_notes_with_folders(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    folder_id UUID,
    folder_name TEXT,
    folder_color TEXT,
    folder_emoji TEXT,
    title TEXT,
    content TEXT,
    tags TEXT[],
    color TEXT,
    is_pinned BOOLEAN,
    is_starred BOOLEAN,
    is_archived BOOLEAN,
    word_count INTEGER,
    character_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.folder_id,
        f.name as folder_name,
        f.color as folder_color,
        f.emoji as folder_emoji,
        n.title,
        n.content,
        n.tags,
        n.color,
        n.is_pinned,
        n.is_starred,
        n.is_archived,
        n.word_count,
        n.character_count,
        n.created_at,
        n.updated_at
    FROM public.notes n
    LEFT JOIN public.folders f ON n.folder_id = f.id
    WHERE n.user_id = user_uuid
    ORDER BY n.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get folder statistics
CREATE OR REPLACE FUNCTION get_folder_stats(user_uuid UUID)
RETURNS TABLE (
    folder_id UUID,
    folder_name TEXT,
    folder_color TEXT,
    folder_emoji TEXT,
    note_count BIGINT,
    total_words BIGINT,
    total_characters BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as folder_id,
        f.name as folder_name,
        f.color as folder_color,
        f.emoji as folder_emoji,
        COUNT(n.id) as note_count,
        COALESCE(SUM(n.word_count), 0) as total_words,
        COALESCE(SUM(n.character_count), 0) as total_characters,
        MAX(n.updated_at) as last_updated
    FROM public.folders f
    LEFT JOIN public.notes n ON f.id = n.folder_id
    WHERE f.user_id = user_uuid
    GROUP BY f.id, f.name, f.color, f.emoji
    ORDER BY f.sort_order, f.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check that tables were created with proper relationships
-- SELECT 
--     tc.table_name, 
--     kcu.column_name, 
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name
--     AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
--     AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--     AND tc.table_schema = 'public'
--     AND tc.table_name IN ('notes', 'folders');

-- Check folder structure for a specific user (replace 'your-user-id' with actual user ID)
-- SELECT * FROM public.folders WHERE user_id = 'your-user-id' ORDER BY sort_order;

-- Check notes with folder information for a specific user
-- SELECT * FROM get_notes_with_folders('your-user-id') LIMIT 5;

-- Check folder statistics for a specific user
-- SELECT * FROM get_folder_stats('your-user-id'); 