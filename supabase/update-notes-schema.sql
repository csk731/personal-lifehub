-- Migration script to update notes table with missing fields

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'color') THEN
        ALTER TABLE public.notes ADD COLUMN color TEXT DEFAULT 'default' CHECK (color IN ('default', 'blue', 'green', 'yellow', 'pink', 'purple'));
    END IF;

    -- Add is_starred column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_starred') THEN
        ALTER TABLE public.notes ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_archived column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_archived') THEN
        ALTER TABLE public.notes ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add word_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'word_count') THEN
        ALTER TABLE public.notes ADD COLUMN word_count INTEGER DEFAULT 0;
    END IF;

    -- Add character_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'character_count') THEN
        ALTER TABLE public.notes ADD COLUMN character_count INTEGER DEFAULT 0;
    END IF;

    -- Update category constraint to include 'other'
    ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_category_check;
    ALTER TABLE public.notes ADD CONSTRAINT notes_category_check CHECK (category IN ('personal', 'work', 'ideas', 'todo', 'study', 'other'));

    -- Update existing records to have default values
    UPDATE public.notes SET 
        title = COALESCE(title, ''),
        content = COALESCE(content, ''),
        tags = COALESCE(tags, '{}'),
        category = COALESCE(category, 'personal'),
        color = COALESCE(color, 'default'),
        is_pinned = COALESCE(is_pinned, FALSE),
        is_starred = COALESCE(is_starred, FALSE),
        is_archived = COALESCE(is_archived, FALSE),
        word_count = COALESCE(word_count, 0),
        character_count = COALESCE(character_count, 0)
    WHERE title IS NULL OR content IS NULL OR tags IS NULL OR category IS NULL OR color IS NULL OR is_pinned IS NULL OR is_starred IS NULL OR is_archived IS NULL OR word_count IS NULL OR character_count IS NULL;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_color ON notes(color);
CREATE INDEX IF NOT EXISTS idx_notes_is_starred ON notes(is_starred);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_word_count ON notes(word_count);
CREATE INDEX IF NOT EXISTS idx_notes_character_count ON notes(character_count); 