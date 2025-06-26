-- Add constraints to prevent duplicate widgets and ensure data consistency

-- 1. Add unique constraint to prevent multiple widgets of the same type per user
-- This prevents users from adding the same widget type multiple times
ALTER TABLE public.user_widgets 
ADD CONSTRAINT unique_user_widget_type 
UNIQUE (user_id, widget_type_id);

-- 2. Add check constraint to ensure widget dimensions are reasonable
ALTER TABLE public.user_widgets 
ADD CONSTRAINT valid_widget_dimensions 
CHECK (width >= 1 AND width <= 4 AND height >= 1 AND height <= 4);

-- 3. Add check constraint to ensure position values are non-negative
ALTER TABLE public.user_widgets 
ADD CONSTRAINT valid_widget_position 
CHECK (position_x >= 0 AND position_y >= 0);

-- 4. Add check constraint to ensure title is not empty
ALTER TABLE public.user_widgets 
ADD CONSTRAINT valid_widget_title 
CHECK (title IS NOT NULL AND length(trim(title)) > 0);

-- 5. Add index for better performance on widget queries
CREATE INDEX IF NOT EXISTS idx_user_widgets_user_id ON public.user_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widgets_type_id ON public.user_widgets(widget_type_id);
CREATE INDEX IF NOT EXISTS idx_user_widgets_position ON public.user_widgets(user_id, position_y, position_x);

-- 6. Add function to check for widget type limits
CREATE OR REPLACE FUNCTION check_widget_type_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has this widget type
  IF EXISTS (
    SELECT 1 FROM public.user_widgets 
    WHERE user_id = NEW.user_id 
    AND widget_type_id = NEW.widget_type_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'Widget type already exists for this user';
  END IF;
  
  -- Check total widget count per user (optional limit)
  IF (
    SELECT COUNT(*) FROM public.user_widgets 
    WHERE user_id = NEW.user_id 
    AND is_visible = true
  ) >= 20 THEN
    RAISE EXCEPTION 'Maximum number of widgets (20) reached for this user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to enforce widget type limits
DROP TRIGGER IF EXISTS enforce_widget_limits ON public.user_widgets;
CREATE TRIGGER enforce_widget_limits
  BEFORE INSERT OR UPDATE ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION check_widget_type_limit();

-- 8. Add function to auto-position widgets to avoid conflicts
CREATE OR REPLACE FUNCTION auto_position_widget()
RETURNS TRIGGER AS $$
DECLARE
  max_position_y INTEGER;
  max_position_x INTEGER;
BEGIN
  -- If position is not specified, auto-position
  IF NEW.position_x IS NULL OR NEW.position_y IS NULL THEN
    -- Find the maximum position_y for this user
    SELECT COALESCE(MAX(position_y), -1) INTO max_position_y
    FROM public.user_widgets 
    WHERE user_id = NEW.user_id AND is_visible = true;
    
    -- Find the maximum position_x for the current row
    SELECT COALESCE(MAX(position_x), -1) INTO max_position_x
    FROM public.user_widgets 
    WHERE user_id = NEW.user_id AND position_y = max_position_y AND is_visible = true;
    
    -- Position the new widget
    IF max_position_x >= 3 THEN
      -- Move to next row
      NEW.position_y := max_position_y + 1;
      NEW.position_x := 0;
    ELSE
      -- Add to current row
      NEW.position_y := max_position_y + 1;
      NEW.position_x := max_position_x + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for auto-positioning
DROP TRIGGER IF EXISTS auto_position_widget_trigger ON public.user_widgets;
CREATE TRIGGER auto_position_widget_trigger
  BEFORE INSERT ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION auto_position_widget();

-- 10. Add function to validate widget configuration
CREATE OR REPLACE FUNCTION validate_widget_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure config is a valid JSON object
  IF NEW.config IS NOT NULL AND jsonb_typeof(NEW.config) != 'object' THEN
    RAISE EXCEPTION 'Widget config must be a valid JSON object';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for config validation
DROP TRIGGER IF EXISTS validate_widget_config_trigger ON public.user_widgets;
CREATE TRIGGER validate_widget_config_trigger
  BEFORE INSERT OR UPDATE ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION validate_widget_config();

-- 12. Add comments for documentation
COMMENT ON CONSTRAINT unique_user_widget_type ON public.user_widgets IS 'Prevents users from adding duplicate widget types';
COMMENT ON CONSTRAINT valid_widget_dimensions ON public.user_widgets IS 'Ensures widget dimensions are within reasonable bounds (1-4)';
COMMENT ON CONSTRAINT valid_widget_position ON public.user_widgets IS 'Ensures widget positions are non-negative';
COMMENT ON CONSTRAINT valid_widget_title ON public.user_widgets IS 'Ensures widget titles are not empty';

-- 13. Create a view for widget statistics
CREATE OR REPLACE VIEW widget_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_widgets,
  COUNT(DISTINCT widget_type_id) as unique_widget_types,
  jsonb_object_agg(wt.name, widget_count) as widget_type_counts
FROM public.user_widgets uw
JOIN public.widget_types wt ON uw.widget_type_id = wt.id
WHERE uw.is_visible = true
GROUP BY user_id, (
  SELECT jsonb_object_agg(wt2.name, COUNT(*))
  FROM public.user_widgets uw2
  JOIN public.widget_types wt2 ON uw2.widget_type_id = wt2.id
  WHERE uw2.user_id = uw.user_id AND uw2.is_visible = true
  GROUP BY wt2.name
);

-- 14. Add RLS policy for the statistics view
CREATE POLICY "Users can view own widget statistics" ON widget_statistics
  FOR SELECT USING (auth.uid() = user_id); 