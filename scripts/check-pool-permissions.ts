import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPoolPermissions() {
  console.log('\n🔍 Pool Permissions Check');
  console.log('=========================\n');

  try {
    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');

    if (companiesError) {
      console.error('❌ Error loading companies:', companiesError);
      return;
    }

    console.log(`📊 Found ${companies?.length || 0} companies\n`);

    // For each company, check what pools they can access
    for (const company of companies || []) {
      console.log(`🏢 Company: ${company.name} (ID: ${company.id})`);

      // Get pool access for this company
      const { data: poolAccess, error: accessError } = await supabase
        .from('pool_company_access')
        .select('id, pool_id, access_level, granted_at')
        .eq('company_id', company.id);

      if (accessError) {
        console.log(`   ❌ Error loading pool access: ${accessError.message}`);
        continue;
      }

      console.log(`   🏊 Pool Access (${poolAccess?.length || 0} pools):`);
      
      if (poolAccess && poolAccess.length > 0) {
        for (const access of poolAccess) {
          // Try to get pool details
          const { data: pool, error: poolError } = await supabase
            .from('candidate_pools')
            .select('id, name, pool_type')
            .eq('id', access.pool_id)
            .maybeSingle();

          if (poolError) {
            console.log(`     ❌ Pool ID ${access.pool_id} - ERROR: ${poolError.message}`);
          } else if (pool) {
            console.log(`     ✅ ${pool.name} (${access.access_level}) - ${pool.pool_type}`);
          } else {
            console.log(`     ❌ Pool ID ${access.pool_id} - NOT FOUND (RLS or deleted)`);
          }
        }
      } else {
        console.log(`     📝 No pool access granted`);
      }

      console.log('');
    }

    // Check overall pool availability
    console.log('\n📊 Overall Pool Analysis:');
    
    const { data: allPools, error: allPoolsError } = await supabase
      .from('candidate_pools')
      .select('id, name, pool_type');

    if (allPoolsError) {
      console.log(`❌ Error loading all pools: ${allPoolsError.message}`);
    } else {
      console.log(`📋 Total pools in system: ${allPools?.length || 0}`);
      
      allPools?.forEach(pool => {
        console.log(`   - ${pool.name} (${pool.pool_type})`);
      });
    }

    // Check RLS status using simpler query
    console.log('\n🔒 Security Check:');
    try {
      const { data: rlsCheck } = await supabase
        .rpc('exec_sql', {
          sql: "SELECT relrowsecurity as rls_enabled FROM pg_class WHERE relname = 'candidate_pools';"
        })
        .single();

      if (rlsCheck && typeof rlsCheck === 'object' && 'rls_enabled' in rlsCheck) {
        console.log(`🔒 RLS enabled: ${rlsCheck.rls_enabled ? 'Yes' : 'No'}`);
      } else {
        console.log(`❓ Could not determine RLS status`);
      }
    } catch (rlsError) {
      console.log(`❓ Could not check RLS status`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  checkPoolPermissions().catch(console.error);
} 