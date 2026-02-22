-- Migration: Create user_settings table for gamification preferences
-- Run this migration against your Supabase database

-- Create the user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Gamification settings
  enable_sounds BOOLEAN DEFAULT true,
  enable_celebrations BOOLEAN DEFAULT true,
  show_streaks BOOLEAN DEFAULT true,
  show_badges BOOLEAN DEFAULT true,
  
  -- Notification settings
  enable_push_notifications BOOLEAN DEFAULT true,
  enable_event_reminders BOOLEAN DEFAULT true,
  enable_result_alerts BOOLEAN DEFAULT true,
  enable_leaderboard_updates BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
