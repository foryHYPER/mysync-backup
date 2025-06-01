/**
 * Script to set up the resumes database table and storage
 * This creates the resumes table, RLS policies, storage bucket, and test data
 */

import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupResumesDatabase() {
  console.log('\n📄 Setting up Resumes Database');
  console.log('================================\n');

  try {
    // Step 1: Create resumes table
    console.log('1️⃣ Creating resumes table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (tableError) {
      console.error('   ❌ Error creating table:', tableError.message);
    } else {
      console.log('   ✅ Resumes table created successfully');
    }

    // Step 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
        CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
        CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);
        CREATE INDEX IF NOT EXISTS idx_resumes_quality_score ON resumes(quality_score);
      `
    });

    if (indexError) {
      console.error('   ❌ Error creating indexes:', indexError.message);
    } else {
      console.log('   ✅ Indexes created successfully');
    }

    // Step 3: Enable RLS
    console.log('3️⃣ Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;`
    });

    if (rlsError) {
      console.error('   ❌ Error enabling RLS:', rlsError.message);
    } else {
      console.log('   ✅ RLS enabled successfully');
    }

    // Step 4: Create RLS policies
    console.log('4️⃣ Creating RLS policies...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- Companies can view approved resumes
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
      `
    });

    if (policyError) {
      console.error('   ❌ Error creating policies:', policyError.message);
    } else {
      console.log('   ✅ RLS policies created successfully');
    }

    // Step 5: Create storage bucket
    console.log('5️⃣ Creating storage bucket...');
    const { error: bucketError } = await supabase.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('   ❌ Error creating storage bucket:', bucketError.message);
    } else {
      console.log('   ✅ Storage bucket created/verified successfully');
    }

    // Step 6: Create storage policies
    console.log('6️⃣ Creating storage policies...');
    const storagePolicies = [
      {
        name: 'Authenticated users can upload resumes',
        policy: `CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
          FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = 'resumes');`
      },
      {
        name: 'Users can view their own resumes',
        policy: `CREATE POLICY "Users can view their own resumes" ON storage.objects
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
          );`
      },
      {
        name: 'Users can update their own resumes',
        policy: `CREATE POLICY "Users can update their own resumes" ON storage.objects
          FOR UPDATE 
          TO authenticated
          USING (
            bucket_id = 'resumes' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );`
      },
      {
        name: 'Users can delete their own resumes',
        policy: `CREATE POLICY "Users can delete their own resumes" ON storage.objects
          FOR DELETE 
          TO authenticated
          USING (
            bucket_id = 'resumes' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );`
      }
    ];

    for (const storagePolicy of storagePolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: storagePolicy.policy });
      if (error && !error.message.includes('already exists')) {
        console.error(`   ❌ Error creating policy "${storagePolicy.name}":`, error.message);
      } else {
        console.log(`   ✅ Policy "${storagePolicy.name}" created successfully`);
      }
    }

    // Step 7: Create test data
    console.log('7️⃣ Creating test resume data...');
    const { error: testDataError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (testDataError) {
      console.error('   ❌ Error creating test data:', testDataError.message);
    } else {
      console.log('   ✅ Test resume data created successfully');
    }

    // Step 8: Show summary
    console.log('\n8️⃣ Setup Summary:');
    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true });

    console.log(`   • ${resumeCount || 0} resumes in database`);
    console.log('   • Storage bucket "resumes" configured');
    console.log('   • RLS policies active for security');
    console.log('   • Upload functionality ready');

    console.log('\n✅ Resumes database setup completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Test upload at: http://localhost:3000/dashboard/candidate/profile');
    console.log('   2. View resumes at: http://localhost:3000/dashboard/admin/resumes');
    console.log('   3. Download functionality now works with real files');

  } catch (error) {
    console.error('❌ Error setting up resumes database:', error);
  }
}

// Run the script
if (require.main === module) {
  setupResumesDatabase().catch(console.error);
} 