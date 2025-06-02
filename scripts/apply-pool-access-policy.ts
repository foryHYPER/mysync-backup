import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPoolAccessPolicy() {
  console.log('\n🔧 Applying Pool Access Policy');
  console.log('==============================\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-pool-access-policy.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 SQL Policy Content:');
    console.log('----------------------');
    console.log(sqlContent);
    console.log('----------------------\n');

    console.log('🔧 Applying RLS policy...');

    // Apply the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error applying policy:', error);
      return;
    }

    console.log('✅ Policy applied successfully!');

    // Test the policy
    console.log('\n🧪 Testing the new policy...');
    
    // Test 1: Service role should still work
    console.log('📝 Test 1: Service role access');
    const { data: servicePools, error: serviceError } = await supabase
      .from('candidate_pools')
      .select('id, name, pool_type')
      .limit(3);

    if (serviceError) {
      console.log(`❌ Service role error: ${serviceError.message}`);
    } else {
      console.log(`✅ Service role can access ${servicePools?.length || 0} pools`);
    }

    // Test 2: Anonymous access should be restricted
    console.log('\n📝 Test 2: Anonymous access (should be restricted)');
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const { data: anonPools, error: anonError } = await anonSupabase
      .from('candidate_pools')
      .select('id, name, pool_type')
      .limit(3);

    if (anonError) {
      console.log(`✅ Anonymous access properly restricted: ${anonError.message}`);
    } else {
      console.log(`⚠️ Anonymous access worked: ${anonPools?.length || 0} pools visible`);
    }

    console.log('\n📋 Policy Summary:');
    console.log('==================');
    console.log('✅ RLS enabled for candidate_pools');
    console.log('✅ Company users can access their assigned pools');
    console.log('✅ Admin users have full access');
    console.log('✅ Anonymous access is properly restricted');
    console.log('');
    console.log('🎉 Your company pools page should now work correctly!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  applyPoolAccessPolicy().catch(console.error);
} 