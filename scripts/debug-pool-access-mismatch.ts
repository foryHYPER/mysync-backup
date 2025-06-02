import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPoolAccessMismatch() {
  console.log('\n🔍 Pool Access Mismatch Debug');
  console.log('==============================\n');

  try {
    // Get all pool_company_access entries
    const { data: accessEntries, error: accessError } = await supabase
      .from('pool_company_access')
      .select('id, pool_id, company_id, access_level, granted_at');

    if (accessError) {
      console.error('❌ Error loading pool access:', accessError);
      return;
    }

    // Get all candidate_pools
    const { data: pools, error: poolsError } = await supabase
      .from('candidate_pools')
      .select('id, name');

    if (poolsError) {
      console.error('❌ Error loading pools:', poolsError);
      return;
    }

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');

    if (companiesError) {
      console.error('❌ Error loading companies:', companiesError);
      return;
    }

    console.log(`📊 Found ${accessEntries?.length || 0} access entries`);
    console.log(`📊 Found ${pools?.length || 0} pools`);
    console.log(`📊 Found ${companies?.length || 0} companies\n`);

    // Create lookup maps
    const poolMap = new Map(pools?.map(p => [p.id, p.name]) || []);
    const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

    // Check for mismatches
    let validEntries = 0;
    let invalidPoolIds = 0;
    let invalidCompanyIds = 0;

    console.log('🔍 Checking Pool Access Entries:\n');

    accessEntries?.forEach((entry, index) => {
      const poolName = poolMap.get(entry.pool_id);
      const companyName = companyMap.get(entry.company_id);

      console.log(`${index + 1}. Access Entry ID: ${entry.id}`);
      console.log(`   Pool ID: ${entry.pool_id}`);
      console.log(`   Pool Name: ${poolName || '❌ NOT FOUND'}`);
      console.log(`   Company ID: ${entry.company_id}`);
      console.log(`   Company Name: ${companyName || '❌ NOT FOUND'}`);
      console.log(`   Access Level: ${entry.access_level}`);
      console.log(`   Granted At: ${new Date(entry.granted_at).toLocaleDateString('de-DE')}`);

      if (!poolName) {
        console.log(`   ❌ PROBLEM: Pool ID not found in candidate_pools table!`);
        invalidPoolIds++;
      } else if (!companyName) {
        console.log(`   ❌ PROBLEM: Company ID not found in companies table!`);
        invalidCompanyIds++;
      } else {
        console.log(`   ✅ Valid entry`);
        validEntries++;
      }
      console.log('');
    });

    console.log('📋 Summary:');
    console.log(`✅ Valid entries: ${validEntries}`);
    console.log(`❌ Invalid pool IDs: ${invalidPoolIds}`);
    console.log(`❌ Invalid company IDs: ${invalidCompanyIds}`);

    if (invalidPoolIds > 0) {
      console.log('\n🔧 Problematic Pool IDs:');
      accessEntries?.forEach(entry => {
        if (!poolMap.get(entry.pool_id)) {
          console.log(`   - ${entry.pool_id} (from access entry ${entry.id})`);
        }
      });
    }

    if (invalidCompanyIds > 0) {
      console.log('\n🔧 Problematic Company IDs:');
      accessEntries?.forEach(entry => {
        if (!companyMap.get(entry.company_id)) {
          console.log(`   - ${entry.company_id} (from access entry ${entry.id})`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  debugPoolAccessMismatch().catch(console.error);
} 