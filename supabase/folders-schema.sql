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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folders_updated_at();

-- Insert default folders for new users
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