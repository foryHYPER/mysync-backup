-- Create RLS policy for candidate_pools table
-- This policy allows companies to access pools they have been granted access to

-- First, enable RLS on candidate_pools (if not already enabled)
ALTER TABLE candidate_pools ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT operations
-- This allows users to see pools if their company has access via pool_company_access
CREATE POLICY "Companies can view their assigned pools" ON candidate_pools
    FOR SELECT
    USING (
        -- Allow if the user's company has access to this pool
        EXISTS (
            SELECT 1 
            FROM pool_company_access pca
            INNER JOIN profiles p ON p.company_id = pca.company_id
            WHERE pca.pool_id = candidate_pools.id
            AND p.id = auth.uid()
        )
    );

-- Create policy for admin users (full access)
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

-- Optional: Policy for authenticated users to see basic pool info
-- (uncomment if you want all authenticated users to see pool names/types)
-- CREATE POLICY "Authenticated users can view basic pool info" ON candidate_pools
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated users
GRANT SELECT ON candidate_pools TO authenticated;
GRANT SELECT ON pool_company_access TO authenticated;
GRANT SELECT ON profiles TO authenticated; 