-- Resume Management Implementation
-- This script creates the resumes table and sets up proper RLS policies

-- 1. Create resumes table
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_resumes_quality_score ON resumes(quality_score);

-- 3. Enable RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Admins can manage all resumes
CREATE POLICY resumes_admin_all ON resumes 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Candidates can manage their own resumes
CREATE POLICY resumes_candidate_own ON resumes 
  FOR ALL 
  TO authenticated
  USING (candidate_id = auth.uid()) 
  WITH CHECK (candidate_id = auth.uid());

-- Companies can view approved resumes (through pool access)
CREATE POLICY resumes_company_view ON resumes 
  FOR SELECT 
  TO authenticated
  USING (
    status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'company'
    )
  );

-- 5. Create storage bucket for resume files (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for resumes bucket
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() 
       AND profiles.role = 'admin'
     ))
  );

CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. Insert some test data
INSERT INTO resumes (candidate_id, filename, file_url, file_size, status, quality_score, skills_extracted, experience_years, education_level, languages, analysis_complete)
SELECT 
  c.id as candidate_id,
  COALESCE(c.first_name, 'Resume') || '_' || COALESCE(c.last_name, 'Candidate') || '_CV.pdf' as filename,
  'resumes/' || c.id || '/cv.pdf' as file_url,
  (RANDOM() * 5000000 + 100000)::BIGINT as file_size,
  (ARRAY['pending', 'approved', 'rejected', 'under_review'])[FLOOR(RANDOM() * 4 + 1)] as status,
  (RANDOM() * 100 + 1)::INTEGER as quality_score,
  '["JavaScript", "React", "Node.js", "Python"]'::JSONB as skills_extracted,
  (RANDOM() * 20 + 1)::INTEGER as experience_years,
  (ARRAY['Bachelor', 'Master', 'PhD', 'Ausbildung'])[FLOOR(RANDOM() * 4 + 1)] as education_level,
  '["Deutsch", "Englisch"]'::JSONB as languages,
  RANDOM() > 0.3 as analysis_complete
FROM candidates c
WHERE NOT EXISTS (
  SELECT 1 FROM resumes r WHERE r.candidate_id = c.id
)
LIMIT 10;
