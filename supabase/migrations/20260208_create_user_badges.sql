-- Migration: Create user_badges table for gamification
-- Run this migration against your Supabase database

-- Create the user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- unique identifier for the badge (e.g., 'win_streak_3')
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb, -- store extra info like streak count, date, etc.
  
  -- Prevent duplicate badges of the same type for the same user
  UNIQUE(user_id, badge_type)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own badges
CREATE POLICY "Users can read own badges"
  ON user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own badges (for client-side calculated achievements)
-- Note: In a stricter system, this would be server-side only.
CREATE POLICY "Users can insert own badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON user_badges TO authenticated;
