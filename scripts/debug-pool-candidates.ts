import { createClient } from '@supabase/supabase-js';

// Debug script to investigate candidate access issues
async function debugCandidateAccess() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Debug: Investigating candidate access for admins...\n');

  try {
    // Test 1: Check if we can read candidates table at all with service role
    console.log('📊 Test 1: Reading candidates with service role...');
    const { data: allCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email')
      .limit(10);

    if (candidatesError) {
      console.error('❌ Error with service role:', candidatesError);
    } else {
      console.log(`✅ Service role can read candidates: ${allCandidates?.length} found`);
      console.log('   Sample candidates:', allCandidates?.slice(0, 3).map(c => `${c.first_name} ${c.last_name} (${c.email})`));
    }

    // Test 2: Check RLS policies on candidates table
    console.log('\n📋 Test 2: Checking RLS policies on candidates table...');
    const { data: candidatePolicies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'candidates');

    if (candidatePolicies && candidatePolicies.length > 0) {
      console.log(`📜 Found ${candidatePolicies.length} RLS policies for candidates table:`);
      candidatePolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  No RLS policies found for candidates table');
    }

    // Test 3: Check if RLS is enabled on candidates table
    console.log('\n🔒 Test 3: Checking if RLS is enabled on candidates table...');
    const { data: tableInfo } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'candidates');

    if (tableInfo && tableInfo.length > 0) {
      console.log(`🔐 RLS enabled on candidates table: ${tableInfo[0].rowsecurity}`);
    }

    // Test 4: Try to simulate admin access
    console.log('\n👤 Test 4: Simulating admin user access...');
    
    // Get an admin user first
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminProfile) {
      console.log(`👨‍💼 Found admin user: ${adminProfile.id}`);
      
      // Try to read candidates as this admin (this won't work perfectly since we're using service role)
      // But we can check the logic
      console.log('🎯 Admin should be able to read all candidates if RLS policies are correct');
    } else {
      console.log('❌ No admin user found in profiles table');
    }

    // Test 5: Check a specific pool and its candidate assignments
    const poolId = '38e7cac6-08fb-47cc-be3b-128593054c05';
    console.log(`\n🏊 Test 5: Checking pool ${poolId} candidate assignments...`);
    
    const { data: poolCandidates, error: poolError } = await supabase
      .from('pool_candidates')
      .select('candidate_id')
      .eq('pool_id', poolId);

    if (poolError) {
      console.error('❌ Error reading pool candidates:', poolError);
    } else {
      console.log(`📊 Pool has ${poolCandidates?.length || 0} candidates assigned`);
      if (poolCandidates && poolCandidates.length > 0) {
        console.log('   Assigned candidate IDs:', poolCandidates.map(pc => pc.candidate_id).slice(0, 5));
      }
    }

    // Test 6: Calculate how many candidates should be available
    const totalCandidates = allCandidates?.length || 0;
    const assignedCandidates = poolCandidates?.length || 0;
    const availableCandidates = totalCandidates - assignedCandidates;
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total candidates in DB: ${totalCandidates}`);
    console.log(`   Already in pool: ${assignedCandidates}`);
    console.log(`   Should be available: ${availableCandidates}`);

    if (availableCandidates > 0 && candidatesError) {
      console.log('\n❗ ISSUE IDENTIFIED: Admin users cannot read candidates table due to RLS restrictions');
      console.log('   Solution: Update RLS policies to allow admins to read candidates');
    } else if (availableCandidates === 0) {
      console.log('\n✅ All candidates are actually assigned to this pool');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug function
debugCandidateAccess()
  .then(() => {
    console.log('\n🏁 Debug complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  }); 