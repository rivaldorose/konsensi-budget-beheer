-- Migration: Add user_login_history and user_summary_views tables
-- These tables track daily login and summary views for XP awards

-- User Login History Table
CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

-- User Summary Views Table (for Cent voor Cent XP tracking)
CREATE TABLE IF NOT EXISTS user_summary_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, view_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_date ON user_login_history(login_date);
CREATE INDEX IF NOT EXISTS idx_user_summary_views_user_id ON user_summary_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_summary_views_date ON user_summary_views(view_date);

-- Enable Row Level Security
ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_summary_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_login_history
CREATE POLICY "Users can view their own login history" ON user_login_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login history" ON user_login_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_summary_views
CREATE POLICY "Users can view their own summary views" ON user_summary_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summary views" ON user_summary_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON user_login_history TO authenticated;
GRANT ALL ON user_summary_views TO authenticated;
