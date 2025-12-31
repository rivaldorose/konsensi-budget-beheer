-- Gamification Tables Migration
-- This migration adds tables for user levels, badges, achievements, daily motivations, and week goals

-- User Levels Table
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Daily Motivations Table
CREATE TABLE IF NOT EXISTS daily_motivations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  author TEXT,
  language TEXT NOT NULL DEFAULT 'nl',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Week Goals Table
CREATE TABLE IF NOT EXISTS week_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  goal_type TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_progress NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_motivations_language ON daily_motivations(language, active);
CREATE INDEX IF NOT EXISTS idx_week_goals_user_id ON week_goals(user_id, week_start);

-- Enable Row Level Security
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_levels
CREATE POLICY "Users can view their own levels" ON user_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own levels" ON user_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own levels" ON user_levels
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for week_goals
CREATE POLICY "Users can view their own week goals" ON week_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own week goals" ON week_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own week goals" ON week_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily motivations are public (no RLS needed, but we can add if needed)
-- ALTER TABLE daily_motivations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can view active daily motivations" ON daily_motivations
--   FOR SELECT USING (active = true);

-- Insert some default daily motivations
INSERT INTO daily_motivations (quote, author, language, active) VALUES
  ('Kleine stappen leiden tot grote resultaten.', NULL, 'nl', true),
  ('Elke euro telt op weg naar financiële vrijheid.', NULL, 'nl', true),
  ('Je bent sterker dan je denkt.', NULL, 'nl', true),
  ('Consistentie is de sleutel tot succes.', NULL, 'nl', true),
  ('Vandaag is een nieuwe kans om vooruit te komen.', NULL, 'nl', true)
ON CONFLICT DO NOTHING;

