-- mySync Database Schema
-- Version: 1.0.0
-- Description: Initial database schema for mySync talent matching platform
-- This script is idempotent and can be run multiple times safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CLEANUP SECTION - Remove existing objects
-- ========================================

-- Drop policies with error handling
DO $$ 
BEGIN
    -- Drop policies only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP POLICY IF EXISTS profiles_admin ON profiles;
        DROP POLICY IF EXISTS profiles_self_select ON profiles;
        DROP POLICY IF EXISTS profiles_self_insert ON profiles;
        DROP POLICY IF EXISTS profiles_self_update ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        DROP POLICY IF EXISTS companies_admin ON companies;
        DROP POLICY IF EXISTS companies_self_select ON companies;
        DROP POLICY IF EXISTS companies_self_insert ON companies;
        DROP POLICY IF EXISTS companies_self_update ON companies;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidates') THEN
        DROP POLICY IF EXISTS candidates_admin ON candidates;
        DROP POLICY IF EXISTS candidates_self_select ON candidates;
        DROP POLICY IF EXISTS candidates_public_select ON candidates;
        DROP POLICY IF EXISTS candidates_self_insert ON candidates;
        DROP POLICY IF EXISTS candidates_self_update ON candidates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        DROP POLICY IF EXISTS job_postings_admin ON job_postings;
        DROP POLICY IF EXISTS job_postings_company_select ON job_postings;
        DROP POLICY IF EXISTS job_postings_company_insert ON job_postings;
        DROP POLICY IF EXISTS job_postings_company_update ON job_postings;
        DROP POLICY IF EXISTS job_postings_company_delete ON job_postings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skills') THEN
        DROP POLICY IF EXISTS skills_public_select ON skills;
        DROP POLICY IF EXISTS skills_admin ON skills;
        DROP POLICY IF EXISTS skills_insert_authenticated ON skills;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidate_skills') THEN
        DROP POLICY IF EXISTS candidate_skills_admin ON candidate_skills;
        DROP POLICY IF EXISTS candidate_skills_self_select ON candidate_skills;
        DROP POLICY IF EXISTS candidate_skills_self_insert ON candidate_skills;
        DROP POLICY IF EXISTS candidate_skills_self_update ON candidate_skills;
        DROP POLICY IF EXISTS candidate_skills_self_delete ON candidate_skills;
        DROP POLICY IF EXISTS candidate_skills_company_select ON candidate_skills;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidate_matches') THEN
        DROP POLICY IF EXISTS candidate_matches_admin ON candidate_matches;
        DROP POLICY IF EXISTS candidate_matches_company_select ON candidate_matches;
        DROP POLICY IF EXISTS candidate_matches_candidate_select ON candidate_matches;
        DROP POLICY IF EXISTS candidate_matches_company_update ON candidate_matches;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
        DROP POLICY IF EXISTS invitations_admin ON invitations;
        DROP POLICY IF EXISTS invitations_company_select ON invitations;
        DROP POLICY IF EXISTS invitations_company_insert ON invitations;
        DROP POLICY IF EXISTS invitations_company_update ON invitations;
        DROP POLICY IF EXISTS invitations_company_delete ON invitations;
        DROP POLICY IF EXISTS invitations_candidate_select ON invitations;
        DROP POLICY IF EXISTS invitations_candidate_update ON invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP POLICY IF EXISTS notifications_admin ON notifications;
        DROP POLICY IF EXISTS notifications_self_select ON notifications;
        DROP POLICY IF EXISTS notifications_self_update ON notifications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        DROP POLICY IF EXISTS audit_logs_admin ON audit_logs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_integrations') THEN
        DROP POLICY IF EXISTS calendar_integrations_admin ON calendar_integrations;
        DROP POLICY IF EXISTS calendar_integrations_select ON calendar_integrations;
        DROP POLICY IF EXISTS calendar_integrations_insert ON calendar_integrations;
        DROP POLICY IF EXISTS calendar_integrations_update ON calendar_integrations;
        DROP POLICY IF EXISTS calendar_integrations_delete ON calendar_integrations;
    END IF;
EXCEPTION
    WHEN undefined_object THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

-- Drop triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
DROP TRIGGER IF EXISTS update_candidate_matches_updated_at ON candidate_matches;
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_companies_name;
DROP INDEX IF EXISTS idx_candidates_email;
DROP INDEX IF EXISTS idx_candidates_status;
DROP INDEX IF EXISTS idx_job_postings_company_id;
DROP INDEX IF EXISTS idx_job_postings_status;
DROP INDEX IF EXISTS idx_candidate_matches_candidate_id;
DROP INDEX IF EXISTS idx_candidate_matches_job_posting_id;
DROP INDEX IF EXISTS idx_candidate_matches_status;
DROP INDEX IF EXISTS idx_invitations_candidate_id;
DROP INDEX IF EXISTS idx_invitations_company_id;
DROP INDEX IF EXISTS idx_invitations_status;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS calendar_integrations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS candidate_matches CASCADE;
DROP TABLE IF EXISTS candidate_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- CREATE TABLES SECTION
-- ========================================

-- 1. profiles: Core user profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','company','candidate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. companies: Additional data for role = 'company'
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo TEXT,
  onboarding_status TEXT DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started','in_progress','completed')),
  onboarding_steps JSONB DEFAULT '{}',
  onboarding_progress INTEGER DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. candidates: Additional data for role = 'candidate'
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  resume_url TEXT,
  profile_photo_url TEXT,
  skills JSONB,
  availability TEXT,
  location TEXT,
  experience INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. job_postings: Job listings from companies
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB,
  location TEXT,
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. skills: Master list of skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- 6. candidate_skills: Many-to-many relationship for candidate skills
CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level INTEGER CHECK (level >= 1 AND level <= 5),
  PRIMARY KEY (candidate_id, skill_id)
);

-- 7. candidate_matches: Matching results between candidates and job postings
CREATE TABLE IF NOT EXISTS candidate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, job_posting_id)
);

-- 8. invitations: Interview invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  proposed_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. notifications: In-app and email notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. audit_logs: CRUD actions for compliance & debugging
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. calendar_integrations: OAuth data for Google/Outlook
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google','outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- CREATE INDEXES SECTION
-- ========================================

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_candidate_id ON candidate_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_job_posting_id ON candidate_matches(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_status ON candidate_matches(status);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate_id ON invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ========================================
-- CREATE TRIGGERS SECTION
-- ========================================

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers to ensure clean state
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_matches_updated_at ON candidate_matches;
CREATE TRIGGER update_candidate_matches_updated_at BEFORE UPDATE ON candidate_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations;
CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY SECTION
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES SECTION
-- ========================================

-- Drop and recreate policies to ensure clean state

-- Profiles policies
DROP POLICY IF EXISTS profiles_admin ON profiles;
CREATE POLICY profiles_admin ON profiles FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS profiles_self_select ON profiles;
CREATE POLICY profiles_self_select ON profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_self_insert ON profiles;
CREATE POLICY profiles_self_insert ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Companies policies
DROP POLICY IF EXISTS companies_admin ON companies;
CREATE POLICY companies_admin ON companies FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS companies_self_select ON companies;
CREATE POLICY companies_self_select ON companies FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS companies_self_insert ON companies;
CREATE POLICY companies_self_insert ON companies FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS companies_self_update ON companies;
CREATE POLICY companies_self_update ON companies FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Candidates policies
DROP POLICY IF EXISTS candidates_admin ON candidates;
CREATE POLICY candidates_admin ON candidates FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS candidates_self_select ON candidates;
CREATE POLICY candidates_self_select ON candidates FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS candidates_public_select ON candidates;
CREATE POLICY candidates_public_select ON candidates FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'company'
        ) 
        AND status = 'active'
    );

DROP POLICY IF EXISTS candidates_self_insert ON candidates;
CREATE POLICY candidates_self_insert ON candidates FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS candidates_self_update ON candidates;
CREATE POLICY candidates_self_update ON candidates FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Job postings policies
DROP POLICY IF EXISTS job_postings_admin ON job_postings;
CREATE POLICY job_postings_admin ON job_postings FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS job_postings_company_select ON job_postings;
CREATE POLICY job_postings_company_select ON job_postings FOR SELECT 
    USING (company_id = auth.uid() OR status = 'open');

DROP POLICY IF EXISTS job_postings_company_insert ON job_postings;
CREATE POLICY job_postings_company_insert ON job_postings FOR INSERT 
    WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS job_postings_company_update ON job_postings;
CREATE POLICY job_postings_company_update ON job_postings FOR UPDATE 
    USING (company_id = auth.uid())
    WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS job_postings_company_delete ON job_postings;
CREATE POLICY job_postings_company_delete ON job_postings FOR DELETE 
    USING (company_id = auth.uid());

-- Skills policies
DROP POLICY IF EXISTS skills_public_select ON skills;
CREATE POLICY skills_public_select ON skills FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS skills_admin ON skills;
CREATE POLICY skills_admin ON skills FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS skills_insert_authenticated ON skills;
CREATE POLICY skills_insert_authenticated ON skills FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Candidate skills policies
DROP POLICY IF EXISTS candidate_skills_admin ON candidate_skills;
CREATE POLICY candidate_skills_admin ON candidate_skills FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS candidate_skills_self_select ON candidate_skills;
CREATE POLICY candidate_skills_self_select ON candidate_skills FOR SELECT 
    USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS candidate_skills_self_insert ON candidate_skills;
CREATE POLICY candidate_skills_self_insert ON candidate_skills FOR INSERT 
    WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS candidate_skills_self_update ON candidate_skills;
CREATE POLICY candidate_skills_self_update ON candidate_skills FOR UPDATE 
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS candidate_skills_self_delete ON candidate_skills;
CREATE POLICY candidate_skills_self_delete ON candidate_skills FOR DELETE 
    USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS candidate_skills_company_select ON candidate_skills;
CREATE POLICY candidate_skills_company_select ON candidate_skills FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'company'
        )
    );

-- Candidate matches policies
DROP POLICY IF EXISTS candidate_matches_admin ON candidate_matches;
CREATE POLICY candidate_matches_admin ON candidate_matches FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS candidate_matches_company_select ON candidate_matches;
CREATE POLICY candidate_matches_company_select ON candidate_matches FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE job_postings.id = job_posting_id 
            AND job_postings.company_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS candidate_matches_candidate_select ON candidate_matches;
CREATE POLICY candidate_matches_candidate_select ON candidate_matches FOR SELECT 
    USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS candidate_matches_company_update ON candidate_matches;
CREATE POLICY candidate_matches_company_update ON candidate_matches FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE job_postings.id = job_posting_id 
            AND job_postings.company_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE job_postings.id = job_posting_id 
            AND job_postings.company_id = auth.uid()
        )
    );

-- Invitations policies
DROP POLICY IF EXISTS invitations_admin ON invitations;
CREATE POLICY invitations_admin ON invitations FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS invitations_company_select ON invitations;
CREATE POLICY invitations_company_select ON invitations FOR SELECT 
    USING (company_id = auth.uid());

DROP POLICY IF EXISTS invitations_company_insert ON invitations;
CREATE POLICY invitations_company_insert ON invitations FOR INSERT 
    WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS invitations_company_update ON invitations;
CREATE POLICY invitations_company_update ON invitations FOR UPDATE 
    USING (company_id = auth.uid())
    WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS invitations_company_delete ON invitations;
CREATE POLICY invitations_company_delete ON invitations FOR DELETE 
    USING (company_id = auth.uid());

DROP POLICY IF EXISTS invitations_candidate_select ON invitations;
CREATE POLICY invitations_candidate_select ON invitations FOR SELECT 
    USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS invitations_candidate_update ON invitations;
CREATE POLICY invitations_candidate_update ON invitations FOR UPDATE 
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS notifications_admin ON notifications;
CREATE POLICY notifications_admin ON notifications FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS notifications_self_select ON notifications;
CREATE POLICY notifications_self_select ON notifications FOR SELECT 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_self_update ON notifications;
CREATE POLICY notifications_self_update ON notifications FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Audit logs policies (admin only)
DROP POLICY IF EXISTS audit_logs_admin ON audit_logs;
CREATE POLICY audit_logs_admin ON audit_logs FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Calendar integrations policies
DROP POLICY IF EXISTS calendar_integrations_admin ON calendar_integrations;
CREATE POLICY calendar_integrations_admin ON calendar_integrations FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS calendar_integrations_select ON calendar_integrations;
CREATE POLICY calendar_integrations_select ON calendar_integrations FOR SELECT 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS calendar_integrations_insert ON calendar_integrations;
CREATE POLICY calendar_integrations_insert ON calendar_integrations FOR INSERT 
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS calendar_integrations_update ON calendar_integrations;
CREATE POLICY calendar_integrations_update ON calendar_integrations FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS calendar_integrations_delete ON calendar_integrations;
CREATE POLICY calendar_integrations_delete ON calendar_integrations FOR DELETE 
    USING (user_id = auth.uid());

-- ========================================
-- GRANT PERMISSIONS SECTION
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public access if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON skills TO anon;

-- Ensure service role has full access
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- FINAL NOTES
-- ========================================
-- This script is now idempotent and can be run multiple times
-- It handles existing objects gracefully
-- For a complete reset, manually drop all tables first 