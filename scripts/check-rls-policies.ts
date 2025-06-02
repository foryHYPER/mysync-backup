import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('\n🔍 RLS Policies Check');
  console.log('=====================\n');

  try {
    // Check RLS status for candidate_pools table
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'candidate_pools' })
      .single();

    if (rlsError) {
      console.log('❓ Could not check RLS status, trying direct query...');
    } else {
      console.log(`🔒 RLS enabled for candidate_pools: ${rlsStatus ? 'Yes' : 'No'}`);
    }

    // Get policies for candidate_pools
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'candidate_pools');

    if (policiesError) {
      console.log('❓ Could not fetch policies directly, checking system tables...');
      
      // Try alternative approach
      const { data: systemPolicies, error: systemError } = await supabase
        .rpc('get_table_policies', { table_name: 'candidate_pools' });

      if (systemError) {
        console.log('❌ Error checking policies:', systemError);
      } else {
        console.log('📋 Policies found:', systemPolicies);
      }
    } else {
      console.log('📋 Policies for candidate_pools:');
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} for ${policy.roles?.join(', ')}`);
        console.log(`    Qual: ${policy.qual}`);
        console.log('');
      });
    }

    // Test client access to specific pool
    console.log('\n🔍 Testing specific pool access...');
    
    const testPoolId = 'd626c0fe-11ea-471c-9355-ca62f09a8c95';
    
    // Service role access
    console.log('📝 Service Role access:');
    const { data: servicePool, error: serviceError } = await supabase
      .from('candidate_pools')
      .select('id, name, description')
      .eq('id', testPoolId)
      .maybeSingle();

    if (serviceError) {
      console.log(`❌ Service role error: ${serviceError.message}`);
    } else if (servicePool) {
      console.log(`✅ Service role found: ${servicePool.name}`);
    } else {
      console.log(`❌ Service role: Pool not found`);
    }

    // Client access (without authentication context)
    console.log('\n📝 Client access (unauthenticated):');
    const clientSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const { data: clientPool, error: clientError } = await clientSupabase
      .from('candidate_pools')
      .select('id, name, description')
      .eq('id', testPoolId)
      .maybeSingle();

    if (clientError) {
      console.log(`❌ Client error: ${clientError.message}`);
    } else if (clientPool) {
      console.log(`✅ Client found: ${clientPool.name}`);
    } else {
      console.log(`❌ Client: Pool not found (likely RLS restriction)`);
    }

    // Check table structure
    console.log('\n📊 Table structure check:');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'candidate_pools' });

    if (tableError) {
      console.log('❓ Could not get table info');
    } else {
      console.log('✅ Table exists and is accessible via service role');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  checkRLSPolicies().catch(console.error);
} 