-- Supabase Schema for scrolltosco
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/fnkoillotanvznkwxyil/sql)

-- User profiles table (preferences and settings)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_days_per_week INTEGER DEFAULT 4,
  exercise_minutes_per_session INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis data table (posture analysis results)
CREATE TABLE IF NOT EXISTS analysis_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL,
  risk_level TEXT NOT NULL,
  risk_factors TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification state table (streaks and progress)
CREATE TABLE IF NOT EXISTS gamification_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_data JSONB NOT NULL,
  current_week JSONB NOT NULL,
  notifications JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL, -- base64 encoded image
  notes TEXT,
  photo_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- X-ray analysis data table
CREATE TABLE IF NOT EXISTS xray_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  curve_location TEXT,
  curve_direction TEXT,
  schroth_type TEXT,
  severity TEXT,
  primary_cobb_angle DECIMAL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_data_user_id ON analysis_data(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_xray_analysis_user_id ON xray_analysis(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE xray_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- analysis_data policies
CREATE POLICY "Users can view own analysis" ON analysis_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON analysis_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis" ON analysis_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis" ON analysis_data
  FOR DELETE USING (auth.uid() = user_id);

-- gamification_state policies
CREATE POLICY "Users can view own gamification" ON gamification_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification" ON gamification_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification" ON gamification_state
  FOR UPDATE USING (auth.uid() = user_id);

-- progress_photos policies
CREATE POLICY "Users can view own photos" ON progress_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON progress_photos
  FOR DELETE USING (auth.uid() = user_id);

-- xray_analysis policies
CREATE POLICY "Users can view own xray" ON xray_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xray" ON xray_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xray" ON xray_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_state_updated_at
  BEFORE UPDATE ON gamification_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
