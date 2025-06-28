-- Complete Notes Database Setup Script
-- Run this in your Supabase SQL editor to set up the notes table properly

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

-- Insert some sample notes for testing (optional)
-- INSERT INTO public.notes (user_id, title, content, category, tags) VALUES
-- ('your-user-id-here', 'Welcome to Notes', 'This is your first note. Start writing!', 'personal', ARRAY['welcome', 'first']); 