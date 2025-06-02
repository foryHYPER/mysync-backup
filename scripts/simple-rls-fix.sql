-- SIMPLE RLS FIX FOR CANDIDATES ACCESS ISSUE
-- Copy and paste this into Supabase SQL Editor

-- Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pool_candidates table  
ALTER TABLE pool_candidates ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all candidates
CREATE POLICY "admin_view_all_candidates" ON candidates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage pool candidates
CREATE POLICY "admin_manage_pool_candidates" ON pool_candidates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow companies to view candidates in their assigned pools
CREATE POLICY "company_view_pool_candidates" ON candidates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pool_candidates pc
    JOIN pool_company_access pca ON pca.pool_id = pc.pool_id
    WHERE pc.candidate_id = candidates.id
    AND pca.company_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'company'
    )
  )
);

-- Grant necessary permissions
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON pool_candidates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON candidates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON pool_candidates TO authenticated; 