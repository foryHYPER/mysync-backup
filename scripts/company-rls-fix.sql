-- COMPANY RLS FIX - Fehlende Policy für pool_candidates Tabelle
-- Copy and paste this into Supabase SQL Editor

-- Add missing policy for companies to view pool_candidates in their assigned pools
CREATE POLICY "company_view_pool_assignments" ON pool_candidates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pool_company_access pca
    WHERE pca.pool_id = pool_candidates.pool_id
    AND pca.company_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'company'
    )
  )
);

-- Verify that RLS is enabled on pool_candidates
ALTER TABLE pool_candidates ENABLE ROW LEVEL SECURITY;

-- Grant permissions if not already granted
GRANT SELECT ON pool_candidates TO authenticated; 