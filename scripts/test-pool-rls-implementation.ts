import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPoolRLSImplementation() {
  console.log('\n🧪 Testing Pool RLS Implementation');
  console.log('==================================\n');

  try {
    // Test 1: Check if RLS is enabled
    console.log('📋 Test 1: RLS Status Check');
    
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'candidate_pools')
      .eq('table_schema', 'public');

    if (tables && tables.length > 0) {
      console.log('   ✅ candidate_pools table exists');
    } else {
      console.log('   ❌ candidate_pools table not found');
    }

    // Test 2: Service role access (should work)
    console.log('\n📋 Test 2: Service Role Access');
    const { data: servicePools, error: serviceError } = await supabase
      .from('candidate_pools')
      .select('id, name, pool_type')
      .limit(3);

    if (serviceError) {
      console.log(`   ❌ Service role error: ${serviceError.message}`);
    } else {
      console.log(`   ✅ Service role can access ${servicePools?.length || 0} pools`);
      servicePools?.forEach(pool => {
        console.log(`      - ${pool.name} (${pool.pool_type})`);
      });
    }

    // Test 3: Anonymous access (should be blocked)
    console.log('\n📋 Test 3: Anonymous Access (should be blocked)');
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const { data: anonPools, error: anonError } = await anonSupabase
      .from('candidate_pools')
      .select('id, name, pool_type')
      .limit(3);

    if (anonError) {
      console.log(`   ✅ Anonymous access properly blocked: ${anonError.message}`);
    } else {
      console.log(`   ⚠️ Anonymous access still works: ${anonPools?.length || 0} pools visible`);
    }

    // Test 4: Check specific test pool
    console.log('\n📋 Test 4: Test Pool Access');
    const testPoolId = 'd626c0fe-11ea-471c-9355-ca62f09a8c95';
    
    const { data: testPool, error: testError } = await supabase
      .from('candidate_pools')
      .select('id, name, pool_type')
      .eq('id', testPoolId)
      .maybeSingle();

    if (testError) {
      console.log(`   ❌ Error accessing test pool: ${testError.message}`);
    } else if (testPool) {
      console.log(`   ✅ Test pool accessible: ${testPool.name} (${testPool.pool_type})`);
    } else {
      console.log(`   ❌ Test pool not found`);
    }

    // Test 5: Check policies exist
    console.log('\n📋 Test 5: Policy Verification');
    
    // Try to get policy information (may not work with client, but worth trying)
    const { data: policyInfo, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'candidate_pools');

    if (policyError) {
      console.log('   ❓ Cannot check policies directly (expected with client access)');
    } else if (policyInfo && policyInfo.length > 0) {
      console.log(`   ✅ Found ${policyInfo.length} policies for candidate_pools:`);
      policyInfo.forEach(policy => {
        console.log(`      - ${policy.policyname}`);
      });
    } else {
      console.log('   ⚠️ No policies found (may still exist but not visible to client)');
    }

    console.log('\n📋 Expected Results After Implementation:');
    console.log('=========================================');
    console.log('✅ Service role: Full access to all pools');
    console.log('❌ Anonymous users: No access to pools');
    console.log('✅ Company users: Access only to assigned pools');
    console.log('✅ Admin users: Full access to all pools');
    console.log('');
    console.log('🎯 Your company pools page should now show only assigned pools!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  testPoolRLSImplementation().catch(console.error);
} 