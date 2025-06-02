-- RLS Policies for candidate_selections table
-- Copy and paste this into Supabase SQL Editor

-- Enable RLS on candidate_selections table
ALTER TABLE candidate_selections ENABLE ROW LEVEL SECURITY;

-- Allow companies to view their own selections
CREATE POLICY "company_view_own_selections" ON candidate_selections
FOR SELECT USING (
  company_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'company'
  )
);

-- Allow companies to create their own selections
CREATE POLICY "company_create_own_selections" ON candidate_selections
FOR INSERT WITH CHECK (
  company_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'company'
  )
);

-- Allow companies to update their own selections
CREATE POLICY "company_update_own_selections" ON candidate_selections
FOR UPDATE USING (
  company_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'company'
  )
);

-- Allow companies to delete their own selections
CREATE POLICY "company_delete_own_selections" ON candidate_selections
FOR DELETE USING (
  company_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'company'
  )
);

-- Allow admins to view all selections
CREATE POLICY "admin_view_all_selections" ON candidate_selections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage all selections
CREATE POLICY "admin_manage_all_selections" ON candidate_selections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_selections TO authenticated; 