-- Brix Recruiting Metrics Portal - Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  manager_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default teams
INSERT INTO teams (name) VALUES 
  ('Team HI'),
  ('Team Roofing'),
  ('Team BMC')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'recruiter')),
  team_id UUID REFERENCES teams(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ============================================
-- DAILY METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rp DECIMAL(10,2) DEFAULT 0,
  mp DECIMAL(10,2) DEFAULT 0,
  subs INTEGER DEFAULT 0,
  jo INTEGER DEFAULT 0,
  fti INTEGER DEFAULT 0,
  placement_amount DECIMAL(12,2) DEFAULT 0,
  placement_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('sales', 'fti', 'jo', 'rp', 'mp', 'subs')),
  target_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FTI SCHEDULE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fti_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  interview_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'scheduled', 'completed')) DEFAULT 'submitted',
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLACEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  placement_date DATE NOT NULL,
  fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PIPELINE DEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  invoice_number TEXT,
  invoice_date DATE,
  payment_due_date DATE,
  classification TEXT NOT NULL CHECK (classification IN ('Candidate Sourced 25%', 'Candidate Submission 25%', 'Client MP 25%', 'Client JO 25%')),
  is_retainer BOOLEAN DEFAULT false,
  candidate_source TEXT NOT NULL CHECK (candidate_source IN ('ATS', 'LinkedIn Email', 'LinkedIn CR Msg', 'Zoominfo Cold Call', 'Reply from Talent Bulletin', 'Referral', 'Applied via Website')),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fti_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TEAMS RLS POLICIES
-- ============================================
CREATE POLICY "Teams are viewable by all authenticated users"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their team"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- DAILY METRICS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own metrics"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view team metrics"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE team_id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and managers can view all metrics"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own metrics"
  ON daily_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own metrics"
  ON daily_metrics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can update team metrics"
  ON daily_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
      AND profiles.team_id IN (
        SELECT team_id FROM profiles WHERE id = daily_metrics.user_id
      )
    )
  );

CREATE POLICY "Users can delete their own metrics"
  ON daily_metrics FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- GOALS RLS POLICIES
-- ============================================
CREATE POLICY "Goals are viewable by all authenticated users"
  ON goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify goals"
  ON goals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FTI SCHEDULE RLS POLICIES
-- ============================================
CREATE POLICY "Users can view FTI entries"
  ON fti_schedule FOR SELECT
  TO authenticated
  USING (
    recruiter_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own FTI entries"
  ON fti_schedule FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Users can update their own FTI entries"
  ON fti_schedule FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Managers can update team FTI entries"
  ON fti_schedule FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
      AND profiles.team_id = fti_schedule.team_id
    )
  );

CREATE POLICY "Users can delete their own FTI entries"
  ON fti_schedule FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- ============================================
-- PLACEMENTS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view placements"
  ON placements FOR SELECT
  TO authenticated
  USING (
    recruiter_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins can modify placements"
  ON placements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- PIPELINE DEALS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view pipeline deals"
  ON pipeline_deals FOR SELECT
  TO authenticated
  USING (
    recruiter_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own pipeline deals"
  ON pipeline_deals FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Users can update their own pipeline deals"
  ON pipeline_deals FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Managers can update team pipeline deals"
  ON pipeline_deals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
      AND profiles.team_id = pipeline_deals.team_id
    )
  );

CREATE POLICY "Users can delete their own pipeline deals"
  ON pipeline_deals FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fti_schedule_updated_at
  BEFORE UPDATE ON fti_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_deals_updated_at
  BEFORE UPDATE ON pipeline_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HANDLE NEW USER SIGNUP (ROBUST VERSION)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'recruiter'),
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
