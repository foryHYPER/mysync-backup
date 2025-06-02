-- Fix RLS Policies for Candidates and Pool Candidates Tables
-- This will allow admins to see candidates in pools

-- =============================================
-- CANDIDATES TABLE RLS POLICIES
-- =============================================

-- Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all candidates" ON candidates;
DROP POLICY IF EXISTS "Companies can view candidates in their assigned pools" ON candidates;
DROP POLICY IF EXISTS "Candidates can view their own profile" ON candidates;

-- Policy 1: Allow admins to view all candidates
CREATE POLICY "Admins can view all candidates" ON candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 2: Allow companies to view candidates in pools they have access to
CREATE POLICY "Companies can view candidates in their assigned pools" ON candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM pool_candidates pc
            INNER JOIN pool_company_access pca ON pca.pool_id = pc.pool_id
            INNER JOIN profiles p ON p.company_id = pca.company_id
            WHERE pc.candidate_id = candidates.id
            AND p.id = auth.uid()
            AND p.role = 'company'
        )
    );

-- Policy 3: Allow candidates to view their own profile
CREATE POLICY "Candidates can view their own profile" ON candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'candidate'
            AND profiles.id = candidates.id
        )
    );

-- Policy 4: Allow admins to create/update/delete candidates
CREATE POLICY "Admins can manage candidates" ON candidates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 5: Allow candidates to update their own profile
CREATE POLICY "Candidates can update their own profile" ON candidates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'candidate'
            AND profiles.id = candidates.id
        )
    );

-- =============================================
-- POOL_CANDIDATES TABLE RLS POLICIES
-- =============================================

-- Enable RLS on pool_candidates table
ALTER TABLE pool_candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage pool candidates" ON pool_candidates;
DROP POLICY IF EXISTS "Companies can view pool candidates in their assigned pools" ON pool_candidates;

-- Policy 1: Allow admins to manage all pool candidate assignments
CREATE POLICY "Admins can manage pool candidates" ON pool_candidates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 2: Allow companies to view pool candidates in pools they have access to
CREATE POLICY "Companies can view pool candidates in their assigned pools" ON pool_candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM pool_company_access pca
            INNER JOIN profiles p ON p.company_id = pca.company_id
            WHERE pca.pool_id = pool_candidates.pool_id
            AND p.id = auth.uid()
            AND p.role = 'company'
        )
    );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON pool_candidates TO authenticated;
GRANT SELECT ON pool_company_access TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Grant additional permissions for admins
GRANT INSERT, UPDATE, DELETE ON candidates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON pool_candidates TO authenticated;

-- Ensure the authenticated role can access these tables
GRANT USAGE ON SCHEMA public TO authenticated;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies für candidates und pool_candidates Tabellen erfolgreich erstellt!';
    RAISE NOTICE '👨‍💼 Admins haben vollen Zugriff auf alle Kandidaten und Pool-Zuweisungen.';
    RAISE NOTICE '🏢 Unternehmen können nur Kandidaten in ihren zugewiesenen Pools sehen.';
    RAISE NOTICE '👤 Kandidaten können nur ihre eigenen Profile sehen und bearbeiten.';
END $$; 