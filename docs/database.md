-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. profiles: Referenced to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','company','candidate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. companies: Zusätzliche Daten für Role = 'company'
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

-- 3. candidates: Zusätzliche Daten für Role = 'candidate'
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

-- 4. job_postings: Optionale Stellenprofile für Matching
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

-- 5. invitations: Interview-Einladungen
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

-- 6. notifications: In-App- und E-Mail-Benachrichtigungen
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. audit_logs: CRUD-Aktionen für Compliance & Debugging
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

-- 8. calendar_integrations: OAuth-Daten für Google/Outlook
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

-- 9. skills + candidate_skills: Many-to-Many für Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT,
  PRIMARY KEY (candidate_id, skill_id)
);

-- 10. candidate_matches: Automatisches Matching zwischen Kandidaten und Stellen
CREATE TABLE IF NOT EXISTS candidate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL, -- Score von 0-100
  match_details JSONB NOT NULL, -- Detaillierte Matching-Informationen
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, job_posting_id)
);

-- ====================
-- RLS Policies
-- ====================

-- 1. profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_admin ON profiles FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY profiles_self_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_self_update ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_admin ON companies FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY companies_self_select ON companies FOR SELECT USING (auth.uid() = id);
CREATE POLICY companies_self_insert ON companies FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY companies_self_update ON companies FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidates_admin ON candidates FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY candidates_self_select ON candidates FOR SELECT USING (auth.uid() = id);
CREATE POLICY candidates_public_select ON candidates FOR SELECT USING (current_setting('jwt.claims.role') = 'company' AND status = 'active');
CREATE POLICY candidates_self_insert ON candidates FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY candidates_self_update ON candidates FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_postings_admin ON job_postings FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY job_postings_company_select ON job_postings FOR SELECT USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY job_postings_company_insert ON job_postings FOR INSERT WITH CHECK (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY job_postings_company_update ON job_postings FOR UPDATE USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid()) WITH CHECK (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY job_postings_company_delete ON job_postings FOR DELETE USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());

-- 5. invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY invitations_admin ON invitations FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY invitations_company_select ON invitations FOR SELECT USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY invitations_company_insert ON invitations FOR INSERT WITH CHECK (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY invitations_company_update ON invitations FOR UPDATE USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid()) WITH	CHECK (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY invitations_company_delete ON invitations FOR DELETE USING (current_setting('jwt.claims.role') = 'company' AND company_id = auth.uid());
CREATE POLICY invitations_candidate_select ON invitations FOR SELECT USING (current_setting('jwt.claims.role') = 'candidate' AND candidate_id = auth.uid());
CREATE POLICY invitations_candidate_update ON invitations FOR UPDATE USING (current_setting('jwt.claims.role') = 'candidate' AND candidate_id = auth.uid()) WITH	CHECK (current_setting('jwt.claims.role') = 'candidate' AND candidate_id = auth.uid());

-- 6. notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_admin ON notifications FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY notifications_self_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_self_update ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin ON audit_logs FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH	CHECK (current_setting('jwt.claims.role') = 'admin');

-- 8. calendar_integrations
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_integrations_admin ON calendar_integrations FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH	CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY calendar_integrations_select ON calendar_integrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY calendar_integrations_insert ON calendar_integrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY calendar_integrations_update ON calendar_integrations FOR UPDATE USING (user_id = auth.uid()) WITH	CHECK (user_id = auth.uid());
CREATE POLICY calendar_integrations_delete ON calendar_integrations FOR DELETE USING (user_id = auth.uid());

-- 9. skills
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_public_select ON skills FOR SELECT USING (true);
CREATE POLICY skills_admin ON skills FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY skills_insert_authenticated ON skills FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. candidate_skills
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidate_skills_admin ON candidate_skills FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH	CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY candidate_skills_self_select ON candidate_skills FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY candidate_skills_self_insert ON candidate_skills FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY candidate_skills_self_update ON candidate_skills FOR UPDATE USING (candidate_id = auth.uid()) WITH	CHECK (candidate_id = auth.uid());
CREATE POLICY candidate_skills_self_delete ON candidate_skills FOR DELETE USING (candidate_id = auth.uid());
CREATE POLICY candidate_skills_company_select ON candidate_skills FOR SELECT USING (current_setting('jwt.claims.role') = 'company');

-- 11. candidate_matches
ALTER TABLE candidate_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidate_matches_admin ON candidate_matches FOR ALL USING (current_setting('jwt.claims.role') = 'admin') WITH CHECK (current_setting('jwt.claims.role') = 'admin');
CREATE POLICY candidate_matches_company_select ON candidate_matches FOR SELECT USING (current_setting('jwt.claims.role') = 'company' AND job_posting_id IN (SELECT id FROM job_postings WHERE company_id = auth.uid()));
CREATE POLICY candidate_matches_candidate_select ON candidate_matches FOR SELECT USING (current_setting('jwt.claims.role') = 'candidate' AND candidate_id = auth.uid());
CREATE POLICY candidate_matches_company_update ON candidate_matches FOR UPDATE USING (current_setting('jwt.claims.role') = 'company' AND job_posting_id IN (SELECT id FROM job_postings WHERE company_id = auth.uid())) WITH CHECK (current_setting('jwt.claims.role') = 'company' AND job_posting_id IN (SELECT id FROM job_postings WHERE company_id = auth.uid()));

-- Trigger für automatische Aktualisierung des updated_at Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidate_matches_updated_at
    BEFORE UPDATE ON candidate_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
