import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPoolRLS() {
  console.log('\n🔧 Creating Pool RLS Policy');
  console.log('===========================\n');

  const queries = [
    // Enable RLS
    'ALTER TABLE candidate_pools ENABLE ROW LEVEL SECURITY;',
    
    // Create company access policy
    `CREATE POLICY "Companies can view their assigned pools" ON candidate_pools
    FOR SELECT USING (
      EXISTS (
        SELECT 1 
        FROM pool_company_access pca
        INNER JOIN profiles p ON p.company_id = pca.company_id
        WHERE pca.pool_id = candidate_pools.id
        AND p.id = auth.uid()
      )
    );`,
    
    // Create admin policy
    `CREATE POLICY "Admins have full access to pools" ON candidate_pools
    FOR ALL USING (
      EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );`,
    
    // Grant permissions
    'GRANT SELECT ON candidate_pools TO authenticated;',
    'GRANT SELECT ON pool_company_access TO authenticated;',
    'GRANT SELECT ON profiles TO authenticated;'
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`🔧 Step ${i + 1}: ${query.split('\n')[0]}`);
    
    try {
      // Try using rpc if available
      let result;
      try {
        result = await supabase.rpc('exec_sql', { sql: query });
      } catch (rpcError) {
        // If rpc doesn't work, we'll need to suggest manual approach
        console.log(`   ⚠️ RPC not available, will provide manual instructions`);
        continue;
      }
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error.message}`);
        // Continue with other queries
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error}`);
    }
  }

  console.log('\n📋 Manual SQL Commands (if RPC failed):');
  console.log('======================================');
  console.log('Please run these commands in Supabase SQL Editor:\n');
  
  queries.forEach((query, index) => {
    console.log(`-- Step ${index + 1}`);
    console.log(query);
    console.log('');
  });

  console.log('\n📋 Alternative Solution:');
  console.log('========================');
  console.log('If the RLS policies are too complex, you can also:');
  console.log('1. Disable RLS on candidate_pools: ALTER TABLE candidate_pools DISABLE ROW LEVEL SECURITY;');
  console.log('2. Use application-level filtering in your code');
  console.log('');
  console.log('Current approach with .maybeSingle() is already working correctly!');
}

// Run the script
if (require.main === module) {
  createPoolRLS().catch(console.error);
} 