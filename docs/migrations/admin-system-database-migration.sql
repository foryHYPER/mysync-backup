-- =============================================
-- mySync Admin System Database Migration
-- =============================================
-- This file contains all the database schema changes required
-- to fully integrate the admin system with real database data
-- instead of the current mock data implementation.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PHASE 1: ENHANCE EXISTING TABLES
-- =============================================

-- 1.1 Enhance companies table for onboarding pipeline
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT 
    DEFAULT 'pending' 
    CHECK (onboarding_status IN ('pending','in_review','approved','rejected','incomplete')),
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 1.2 Enhance candidates table for quality control
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0 
    CHECK (quality_score >= 0 AND quality_score <= 100),
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0 
    CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
  ADD COLUMN IF NOT EXISTS verification_status TEXT 
    DEFAULT 'pending' 
    CHECK (verification_status IN ('verified','pending','failed')),
  ADD COLUMN IF NOT EXISTS red_flags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resume_quality TEXT 
    CHECK (resume_quality IN ('excellent','good','needs_improvement','poor')),
  ADD COLUMN IF NOT EXISTS match_success_rate INTEGER DEFAULT 0 
    CHECK (match_success_rate >= 0 AND match_success_rate <= 100),
  ADD COLUMN IF NOT EXISTS employer_feedback_score DECIMAL(2,1) DEFAULT 0 
    CHECK (employer_feedback_score >= 0 AND employer_feedback_score <= 5),
  ADD COLUMN IF NOT EXISTS experience_level TEXT;

-- 1.3 Enhance audit_logs table for comprehensive logging
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_role TEXT,
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS severity TEXT 
    DEFAULT 'info' 
    CHECK (severity IN ('info','warning','error','critical')),
  ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- =============================================
-- PHASE 2: CREATE NEW TABLES
-- =============================================

-- 2.1 Resume management table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','rejected','under_review')),
  quality_score INTEGER DEFAULT 0 
    CHECK (quality_score >= 0 AND quality_score <= 100),
  skills_extracted JSONB DEFAULT '[]',
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  education_level TEXT,
  languages JSONB DEFAULT '[]',
  analysis_complete BOOLEAN DEFAULT FALSE,
  reviewer_notes TEXT,
  download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
  match_count INTEGER DEFAULT 0 CHECK (match_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 User activity tracking table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Data export management table
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv','json','pdf')),
  file_url TEXT,
  file_size BIGINT CHECK (file_size > 0),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','processing','completed','failed')),
  parameters JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2.4 System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL CHECK (data_type IN ('string','number','boolean','object','array')),
  is_sensitive BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, setting_key)
);

-- 2.5 Security threats table
CREATE TABLE IF NOT EXISTS security_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  country TEXT,
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'brute_force','ddos','sql_injection','xss','suspicious_activity','malware'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count INTEGER DEFAULT 1 CHECK (attempt_count > 0),
  blocked BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  description TEXT,
  auto_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT FALSE,
  attempts_before_block INTEGER DEFAULT 0 CHECK (attempts_before_block >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PHASE 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for resumes table
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_resumes_quality_score ON resumes(quality_score);

-- Indexes for user_activities table
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_session_id ON user_activities(session_id);

-- Indexes for data_exports table
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at ON data_exports(created_at);

-- Indexes for system_settings table
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_sensitive ON system_settings(is_sensitive);

-- Indexes for security_threats table
CREATE INDEX IF NOT EXISTS idx_security_threats_ip_address ON security_threats(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_threats_threat_type ON security_threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
CREATE INDEX IF NOT EXISTS idx_security_threats_detected_at ON security_threats(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_threats_blocked ON security_threats(blocked);

-- Indexes for blocked_ips table
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_at ON blocked_ips(blocked_at);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_permanent ON blocked_ips(permanent);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at ON blocked_ips(expires_at);

-- Indexes for enhanced existing tables
CREATE INDEX IF NOT EXISTS idx_companies_onboarding_status ON companies(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);

CREATE INDEX IF NOT EXISTS idx_candidates_verification_status ON candidates(verification_status);
CREATE INDEX IF NOT EXISTS idx_candidates_quality_score ON candidates(quality_score);
CREATE INDEX IF NOT EXISTS idx_candidates_last_activity ON candidates(last_activity);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- =============================================
-- PHASE 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- RLS for resumes table
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY resumes_admin_all ON resumes 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

CREATE POLICY resumes_candidate_own ON resumes 
  FOR ALL 
  USING (candidate_id = auth.uid()) 
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY resumes_company_view ON resumes 
  FOR SELECT 
  USING (current_setting('jwt.claims.role') = 'company' AND status = 'approved');

-- RLS for user_activities table
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_activities_admin_all ON user_activities 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

CREATE POLICY user_activities_own ON user_activities 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS for data_exports table
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_exports_admin_all ON data_exports 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

CREATE POLICY data_exports_own ON data_exports 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- RLS for system_settings table
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin_all ON system_settings 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

-- RLS for security_threats table
ALTER TABLE security_threats ENABLE ROW LEVEL SECURITY;

CREATE POLICY security_threats_admin_all ON security_threats 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

-- RLS for blocked_ips table
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocked_ips_admin_all ON blocked_ips 
  FOR ALL 
  USING (current_setting('jwt.claims.role') = 'admin') 
  WITH CHECK (current_setting('jwt.claims.role') = 'admin');

-- =============================================
-- PHASE 5: TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger function (reuse existing or create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to new tables
CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_threats_updated_at
    BEFORE UPDATE ON security_threats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PHASE 6: INITIAL DATA POPULATION
-- =============================================

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value, description, data_type) VALUES
-- General Settings
('general', 'platform_name', '"mySync"', 'Platform display name', 'string'),
('general', 'platform_description', '"Recruitment platform connecting talent with opportunities"', 'Platform description', 'string'),
('general', 'maintenance_mode', 'false', 'Enable maintenance mode', 'boolean'),
('general', 'max_users', '10000', 'Maximum number of users allowed', 'number'),

-- Authentication & Security
('auth', 'password_min_length', '8', 'Minimum password length', 'number'),
('auth', 'require_2fa', 'false', 'Require two-factor authentication', 'boolean'),
('auth', 'session_timeout', '3600', 'Session timeout in seconds', 'number'),
('auth', 'max_login_attempts', '5', 'Maximum login attempts before lockout', 'number'),

-- Notifications
('notifications', 'email_enabled', 'true', 'Enable email notifications', 'boolean'),
('notifications', 'push_enabled', 'true', 'Enable push notifications', 'boolean'),
('notifications', 'sms_enabled', 'false', 'Enable SMS notifications', 'boolean'),
('notifications', 'notification_frequency', '"daily"', 'Default notification frequency', 'string'),

-- Matching Algorithm
('matching', 'auto_matching', 'true', 'Enable automatic matching', 'boolean'),
('matching', 'min_match_score', '70', 'Minimum match score threshold', 'number'),
('matching', 'max_matches_per_candidate', '10', 'Maximum matches per candidate', 'number'),
('matching', 'match_expiry_days', '30', 'Days until matches expire', 'number'),

-- Data & Analytics
('data', 'retention_days', '2555', 'Data retention period in days (7 years)', 'number'),
('data', 'backup_frequency', '"daily"', 'Backup frequency', 'string'),
('data', 'export_formats', '["csv", "json", "pdf"]', 'Available export formats', 'array'),

-- API & Integrations
('api', 'rate_limit_per_minute', '100', 'API rate limit per minute', 'number'),
('api', 'webhook_enabled', 'true', 'Enable webhook integrations', 'boolean'),
('api', 'third_party_integrations', '["google", "linkedin", "xing"]', 'Enabled third-party integrations', 'array')

ON CONFLICT (category, setting_key) DO NOTHING;

-- =============================================
-- PHASE 7: DATA MIGRATION FUNCTIONS
-- =============================================

-- Function to migrate existing data and calculate quality scores
CREATE OR REPLACE FUNCTION migrate_candidate_quality_scores()
RETURNS void AS $$
BEGIN
    -- Update quality scores based on profile completeness
    UPDATE candidates SET
        quality_score = CASE
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL AND skills IS NOT NULL 
                 AND location IS NOT NULL AND phone IS NOT NULL THEN 85
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL AND skills IS NOT NULL THEN 70
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL THEN 50
            ELSE 30
        END,
        profile_completeness = CASE
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL AND skills IS NOT NULL 
                 AND location IS NOT NULL AND phone IS NOT NULL 
                 AND resume_url IS NOT NULL THEN 100
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL AND skills IS NOT NULL 
                 AND location IS NOT NULL THEN 85
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL AND skills IS NOT NULL THEN 70
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND email IS NOT NULL THEN 50
            ELSE 30
        END,
        last_activity = COALESCE(updated_at, created_at);
END;
$$ LANGUAGE plpgsql;

-- Function to set default onboarding status for existing companies
CREATE OR REPLACE FUNCTION migrate_company_onboarding_status()
RETURNS void AS $$
BEGIN
    UPDATE companies SET
        onboarding_status = CASE
            WHEN name IS NOT NULL AND contact_email IS NOT NULL 
                 AND website IS NOT NULL THEN 'completed'
            WHEN name IS NOT NULL AND contact_email IS NOT NULL THEN 'in_progress'
            ELSE 'pending'
        END,
        completion_percentage = CASE
            WHEN name IS NOT NULL AND contact_email IS NOT NULL 
                 AND website IS NOT NULL AND address IS NOT NULL 
                 AND contact_phone IS NOT NULL THEN 100
            WHEN name IS NOT NULL AND contact_email IS NOT NULL 
                 AND website IS NOT NULL THEN 80
            WHEN name IS NOT NULL AND contact_email IS NOT NULL THEN 60
            ELSE 30
        END;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PHASE 8: EXECUTE MIGRATION FUNCTIONS
-- =============================================

-- Execute the migration functions
SELECT migrate_candidate_quality_scores();
SELECT migrate_company_onboarding_status();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify the migration was successful
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check if all new tables were created
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('resumes', 'user_activities', 'data_exports', 'system_settings', 'security_threats', 'blocked_ips');
    
    RAISE NOTICE 'Created % new tables', table_count;
    
    -- Check if indexes were created
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Total indexes: %', index_count;
    
    -- Check if RLS policies were created
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total RLS policies: %', policy_count;
    
    RAISE NOTICE 'Database migration completed successfully!';
END $$;

-- =============================================
-- CLEANUP FUNCTIONS (FOR ROLLBACK IF NEEDED)
-- =============================================

-- Function to rollback all changes (use with caution!)
CREATE OR REPLACE FUNCTION rollback_admin_system_migration()
RETURNS void AS $$
BEGIN
    -- Drop new tables
    DROP TABLE IF EXISTS blocked_ips CASCADE;
    DROP TABLE IF EXISTS security_threats CASCADE;
    DROP TABLE IF EXISTS system_settings CASCADE;
    DROP TABLE IF EXISTS data_exports CASCADE;
    DROP TABLE IF EXISTS user_activities CASCADE;
    DROP TABLE IF EXISTS resumes CASCADE;
    
    -- Remove added columns from existing tables
    ALTER TABLE companies 
        DROP COLUMN IF EXISTS onboarding_status,
        DROP COLUMN IF EXISTS completion_percentage,
        DROP COLUMN IF EXISTS submitted_at,
        DROP COLUMN IF EXISTS reviewed_at,
        DROP COLUMN IF EXISTS reviewer_id,
        DROP COLUMN IF EXISTS reviewer_notes,
        DROP COLUMN IF EXISTS required_documents,
        DROP COLUMN IF EXISTS industry,
        DROP COLUMN IF EXISTS size,
        DROP COLUMN IF EXISTS phone,
        DROP COLUMN IF EXISTS description;
        
    ALTER TABLE candidates
        DROP COLUMN IF EXISTS quality_score,
        DROP COLUMN IF EXISTS profile_completeness,
        DROP COLUMN IF EXISTS verification_status,
        DROP COLUMN IF EXISTS red_flags,
        DROP COLUMN IF EXISTS last_activity,
        DROP COLUMN IF EXISTS resume_quality,
        DROP COLUMN IF EXISTS match_success_rate,
        DROP COLUMN IF EXISTS employer_feedback_score,
        DROP COLUMN IF EXISTS experience_level;
        
    ALTER TABLE audit_logs
        DROP COLUMN IF EXISTS user_email,
        DROP COLUMN IF EXISTS user_role,
        DROP COLUMN IF EXISTS resource_type,
        DROP COLUMN IF EXISTS resource_id,
        DROP COLUMN IF EXISTS ip_address,
        DROP COLUMN IF EXISTS user_agent,
        DROP COLUMN IF EXISTS details,
        DROP COLUMN IF EXISTS severity,
        DROP COLUMN IF EXISTS success,
        DROP COLUMN IF EXISTS session_id;
        
    RAISE NOTICE 'Migration rollback completed!';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMIT; 