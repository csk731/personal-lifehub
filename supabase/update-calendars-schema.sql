-- Update calendars schema - only add missing pieces
-- This file should be run after the main calendar-schema.sql

-- Add calendar_id column to calendar_events if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'calendar_id'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update calendar_events RLS policies to include calendar_id if they don't exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can insert their own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
    
    -- Create updated policies that include calendar_id
    CREATE POLICY "Users can view their own calendar events" ON calendar_events
      FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM calendars 
          WHERE calendars.id = calendar_events.calendar_id 
          AND calendars.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can insert their own calendar events" ON calendar_events
      FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM calendars 
          WHERE calendars.id = calendar_events.calendar_id 
          AND calendars.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can update their own calendar events" ON calendar_events
      FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM calendars 
          WHERE calendars.id = calendar_events.calendar_id 
          AND calendars.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can delete their own calendar events" ON calendar_events
      FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM calendars 
          WHERE calendars.id = calendar_events.calendar_id 
          AND calendars.user_id = auth.uid()
        )
      );
END $$;

-- Ensure calendar_id is NOT NULL for new events
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'calendar_id'
        AND is_nullable = 'YES'
    ) THEN
        -- First, set calendar_id for existing events to the user's default calendar
        UPDATE calendar_events 
        SET calendar_id = (
            SELECT c.id 
            FROM calendars c 
            WHERE c.user_id = calendar_events.user_id 
            AND c.is_default = true 
            LIMIT 1
        )
        WHERE calendar_id IS NULL;
        
        -- Then make the column NOT NULL
        ALTER TABLE calendar_events ALTER COLUMN calendar_id SET NOT NULL;
    END IF;
END $$; 