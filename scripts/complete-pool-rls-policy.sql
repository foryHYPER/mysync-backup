-- Complete RLS Policy Setup for Candidate Pools
-- This fixes the pool access issue where companies can't see their assigned pools

-- Drop existing policies if they exist (in case of re-running)
DROP POLICY IF EXISTS "Companies can view their assigned pools" ON candidate_pools;
DROP POLICY IF EXISTS "Admins have full access to pools" ON candidate_pools;

-- Enable RLS on candidate_pools table
ALTER TABLE candidate_pools ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow companies to view pools they have been granted access to
-- Fixed: Using profiles.id directly as the company_id (not profiles.company_id)
CREATE POLICY "Companies can view their assigned pools" ON candidate_pools
    FOR SELECT
    USING (
        -- Allow if the current user's profile ID matches a company that has access to this pool
        EXISTS (
            SELECT 1 
            FROM pool_company_access pca
            WHERE pca.pool_id = candidate_pools.id
            AND pca.company_id = auth.uid()
        )
    );

-- Policy 2: Allow admin users full access to all pools
CREATE POLICY "Admins have full access to pools" ON candidate_pools
    FOR ALL
    USING (
        -- Allow if user has admin role
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 3: Service role bypass (optional, but recommended)
-- This ensures service role can always access pools for backend operations
CREATE POLICY "Service role full access" ON candidate_pools
    FOR ALL
    USING (
        -- Allow if using service role
        current_setting('role') = 'service_role'
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT ON candidate_pools TO authenticated;
GRANT SELECT ON pool_company_access TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Ensure the authenticated role can access these tables
GRANT USAGE ON SCHEMA public TO authenticated;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies for candidate_pools have been successfully created!';
    RAISE NOTICE 'Companies will now only see pools they have been granted access to.';
    RAISE NOTICE 'Admin users have full access to all pools.';
END $$; 