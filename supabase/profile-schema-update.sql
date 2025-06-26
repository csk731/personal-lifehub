-- Update profiles table with additional fields for comprehensive profile management

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visible": true, "show_email": false, "show_phone": false}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add constraints for new fields
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_website_url CHECK (website IS NULL OR website ~ '^https?://.*'),
ADD CONSTRAINT valid_phone_number CHECK (phone IS NULL OR phone ~ '^[\+]?[1-9][\d]{0,15}$'),
ADD CONSTRAINT valid_date_of_birth CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '13 years'),
ADD CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'auto')),
ADD CONSTRAINT valid_language CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko')),
ADD CONSTRAINT valid_profile_completion CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 10;
BEGIN
  -- Basic info (email is always present)
  completion_score := completion_score + 1;
  
  -- Full name
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Avatar
  IF NEW.avatar_url IS NOT NULL AND length(trim(NEW.avatar_url)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Bio
  IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Location
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Website
  IF NEW.website IS NOT NULL AND length(trim(NEW.website)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Phone
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Date of birth
  IF NEW.date_of_birth IS NOT NULL THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Occupation
  IF NEW.occupation IS NOT NULL AND length(trim(NEW.occupation)) > 0 THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Skills or interests
  IF (NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0) OR 
     (NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0) THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Calculate percentage
  NEW.profile_completion_percentage := (completion_score * 100) / total_fields;
  
  -- Update last_active
  NEW.last_active := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate profile completion
DROP TRIGGER IF EXISTS update_profile_completion ON public.profiles;
CREATE TRIGGER update_profile_completion
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active on any profile update
DROP TRIGGER IF EXISTS update_profile_last_active ON public.profiles;
CREATE TRIGGER update_profile_last_active
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Create a view for profile statistics
CREATE OR REPLACE VIEW profile_statistics AS
SELECT 
  COUNT(*) as total_users,
  AVG(profile_completion_percentage) as avg_completion,
  COUNT(*) FILTER (WHERE profile_completion_percentage = 100) as completed_profiles,
  COUNT(*) FILTER (WHERE profile_completion_percentage < 50) as incomplete_profiles,
  COUNT(*) FILTER (WHERE last_active > NOW() - INTERVAL '7 days') as active_users_7d,
  COUNT(*) FILTER (WHERE last_active > NOW() - INTERVAL '30 days') as active_users_30d
FROM public.profiles;

-- Add RLS policy for the statistics view
-- CREATE POLICY "Public profile statistics" ON profile_statistics
--   FOR SELECT USING (true);

-- Function to get user's profile with completion status
CREATE OR REPLACE FUNCTION get_user_profile_with_completion(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  date_of_birth DATE,
  preferences JSONB,
  timezone TEXT,
  language TEXT,
  theme TEXT,
  notification_preferences JSONB,
  privacy_settings JSONB,
  social_links JSONB,
  skills TEXT[],
  interests TEXT[],
  occupation TEXT,
  company TEXT,
  education TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  profile_completion_percentage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.location,
    p.website,
    p.phone,
    p.date_of_birth,
    p.preferences,
    p.timezone,
    p.language,
    p.theme,
    p.notification_preferences,
    p.privacy_settings,
    p.social_links,
    p.skills,
    p.interests,
    p.occupation,
    p.company,
    p.education,
    p.last_active,
    p.profile_completion_percentage,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_profile_with_completion(UUID) TO authenticated;
GRANT SELECT ON profile_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User biography or description';
COMMENT ON COLUMN public.profiles.location IS 'User location or city';
COMMENT ON COLUMN public.profiles.website IS 'User website URL';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth (must be 13+ years old)';
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSON';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone';
COMMENT ON COLUMN public.profiles.language IS 'User preferred language';
COMMENT ON COLUMN public.profiles.theme IS 'User theme preference (light/dark/auto)';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preferences';
COMMENT ON COLUMN public.profiles.privacy_settings IS 'User privacy settings';
COMMENT ON COLUMN public.profiles.social_links IS 'User social media links';
COMMENT ON COLUMN public.profiles.skills IS 'User skills array';
COMMENT ON COLUMN public.profiles.interests IS 'User interests array';
COMMENT ON COLUMN public.profiles.occupation IS 'User occupation or job title';
COMMENT ON COLUMN public.profiles.company IS 'User company or organization';
COMMENT ON COLUMN public.profiles.education IS 'User education information';
COMMENT ON COLUMN public.profiles.last_active IS 'Last time user was active';
COMMENT ON COLUMN public.profiles.profile_completion_percentage IS 'Profile completion percentage (0-100)';

-- RLS policies for profiles table
CREATE POLICY "Allow user to select own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow user to insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow user to update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow user to delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id); 