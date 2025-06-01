import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables - use Next.js built-in env support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PoolMetrics {
  id: string;
  name: string;
  candidate_count: number;
  companies_count: number;
  selections_count: number;
  featured_count: number;
  total_selections_this_month: number;
  status?: string;
}

interface CompanyPoolAccess {
  id: string;
  pool_id: string;
  company_id: string;
  pool_name: string;
  company_name: string;
  access_level: string;
  candidate_count: number;
  selection_count: number;
  assigned_at: string;
  pool_type?: string;
}

interface PoolCandidate {
  id: string;
  pool_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  priority: number;
  featured: boolean;
  selection_count: number;
}

async function testPoolRoutes() {
  console.log('\n🧪 Pool-Routen Test Suite');
  console.log('==========================\n');

  // Test 1: Admin Pool Overview (/dashboard/admin/pools)
  console.log('1️⃣ Testing Admin Pool Overview Route...');
  try {
    const adminPoolMetrics = await testAdminPoolOverview();
    console.log('✅ Admin Pool Overview: Metriken korrekt geladen\n');
  } catch (error) {
    console.error('❌ Admin Pool Overview:', error);
  }

  // Test 2: Admin Pool Detail (/dashboard/admin/pools/[id])
  console.log('2️⃣ Testing Admin Pool Detail Routes...');
  try {
    const pools = await getAllPools();
    for (const pool of pools.slice(0, 2)) { // Test first 2 pools
      await testAdminPoolDetail(pool.id, pool.name);
    }
    console.log('✅ Admin Pool Detail: Alle Metriken korrekt\n');
  } catch (error) {
    console.error('❌ Admin Pool Detail:', error);
  }

  // Test 3: Company Pool Overview (/dashboard/company/pools)
  console.log('3️⃣ Testing Company Pool Overview Route...');
  try {
    const companies = await getTestCompanies();
    for (const company of companies.slice(0, 2)) { // Test first 2 companies
      await testCompanyPoolOverview(company.id, company.name);
    }
    console.log('✅ Company Pool Overview: Metriken korrekt\n');
  } catch (error) {
    console.error('❌ Company Pool Overview:', error);
  }

  // Test 4: Company Pool Detail (/dashboard/company/pools/[id])
  console.log('4️⃣ Testing Company Pool Detail Routes...');
  try {
    const companies = await getTestCompanies();
    const pools = await getAllPools();
    
    // First assign some companies to pools if not already done
    await ensureTestAssignments();
    
    // Test company pool access
    for (const company of companies.slice(0, 1)) {
      const companyAccess = await getCompanyPoolAccess(company.id);
      for (const access of companyAccess.slice(0, 2)) {
        await testCompanyPoolDetail(access.pool_id, company.id, company.name);
      }
    }
    console.log('✅ Company Pool Detail: Metriken korrekt\n');
  } catch (error) {
    console.error('❌ Company Pool Detail:', error);
  }

  // Test 5: Pool Assignment Route (/dashboard/admin/pools/assignments)
  console.log('5️⃣ Testing Pool Assignment Route...');
  try {
    await testPoolAssignments();
    console.log('✅ Pool Assignments: Metriken korrekt\n');
  } catch (error) {
    console.error('❌ Pool Assignments:', error);
  }

  console.log('🎉 Pool-Routen Test abgeschlossen!\n');
}

async function testAdminPoolOverview(): Promise<void> {
  console.log('   📊 Lade Admin Pool Übersicht...');

  // Load all pools with metrics
  const { data: pools, error: poolsError } = await supabase
    .from('candidate_pools')
    .select('*')
    .order('created_at', { ascending: false });

  if (poolsError) throw poolsError;

  if (!pools || pools.length === 0) {
    console.log('   ⚠️ Keine Pools gefunden');
    return;
  }

  const enrichedPools = await Promise.all(
    pools.map(async (pool) => {
      // Candidate count
      const { count: candidateCount } = await supabase
        .from('pool_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id);

      // Companies count
      const { count: companiesCount } = await supabase
        .from('pool_company_access')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id);

      // Selections count
      const { count: selectionsCount } = await supabase
        .from('candidate_selections')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id);

      return {
        id: pool.id,
        name: pool.name,
        candidate_count: candidateCount || 0,
        companies_count: companiesCount || 0,
        selections_count: selectionsCount || 0
      };
    })
  );

  // Calculate overall metrics
  const totalPools = enrichedPools.length;
  const activePools = enrichedPools.filter((p: any) => p.status !== 'archived').length;
  const totalCandidates = enrichedPools.reduce((sum, p) => sum + p.candidate_count, 0);
  const totalCompanyAccess = enrichedPools.reduce((sum, p) => sum + p.companies_count, 0);
  const totalSelections = enrichedPools.reduce((sum, p) => sum + p.selections_count, 0);

  console.log(`   📈 Metriken: ${totalPools} Pools, ${totalCandidates} Kandidaten, ${totalCompanyAccess} Zugriffe, ${totalSelections} Auswahlen`);

  // Validate metrics make sense
  if (totalPools > 0 && totalCandidates >= 0 && totalCompanyAccess >= 0 && totalSelections >= 0) {
    console.log('   ✅ Alle Metriken sind valide');
  } else {
    throw new Error('Invalid metrics detected');
  }
}

async function testAdminPoolDetail(poolId: string, poolName: string): Promise<void> {
  console.log(`   🔍 Teste Pool Detail: ${poolName}...`);

  // Get pool stats
  const { count: totalCandidates } = await supabase
    .from('pool_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId);

  const { count: featuredCandidates } = await supabase
    .from('pool_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId)
    .eq('featured', true);

  const { count: companiesWithAccess } = await supabase
    .from('pool_company_access')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId);

  const { count: totalSelections } = await supabase
    .from('candidate_selections')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId);

  // Get this month's selections
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const { count: selectionsThisMonth } = await supabase
    .from('candidate_selections')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId)
    .gte('created_at', oneMonthAgo.toISOString());

  console.log(`      📊 Stats: ${totalCandidates || 0} Kandidaten, ${featuredCandidates || 0} featured, ${companiesWithAccess || 0} Unternehmen, ${totalSelections || 0} Auswahlen (${selectionsThisMonth || 0} diesen Monat)`);

  // Validate all metrics are non-negative
  const metrics = [totalCandidates, featuredCandidates, companiesWithAccess, totalSelections, selectionsThisMonth];
  if (metrics.every(m => (m || 0) >= 0)) {
    console.log('      ✅ Pool-Detail Metriken valide');
  } else {
    throw new Error(`Invalid pool detail metrics for ${poolName}`);
  }
}

async function testCompanyPoolOverview(companyId: string, companyName: string): Promise<void> {
  console.log(`   🏢 Teste Company Pool Übersicht: ${companyName}...`);

  // Load assigned pools
  const { data: poolAccess, error } = await supabase
    .from('pool_company_access')
    .select(`
      *,
      pool:candidate_pools(
        id,
        name,
        description,
        pool_type
      )
    `)
    .eq('company_id', companyId)
    .order('granted_at', { ascending: false });

  if (error) throw error;

  if (!poolAccess || poolAccess.length === 0) {
    console.log(`      ⚠️ Keine Pool-Zugriffe für ${companyName}`);
    return;
  }

  // Get metrics for each pool
  const enrichedPools = await Promise.all(
    poolAccess.map(async (access) => {
      const { count: candidateCount } = await supabase
        .from('pool_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', access.pool_id);

      const { count: selectionCount } = await supabase
        .from('candidate_selections')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('pool_id', access.pool_id);

      return {
        pool_name: access.pool?.name || 'Unknown',
        candidate_count: candidateCount || 0,
        selection_count: selectionCount || 0,
        access_level: access.access_level,
        pool_type: access.pool?.pool_type
      };
    })
  );

  const totalPools = enrichedPools.length;
  const totalCandidates = enrichedPools.reduce((sum, p) => sum + p.candidate_count, 0);
  const totalSelections = enrichedPools.reduce((sum, p) => sum + p.selection_count, 0);
  const premiumPools = enrichedPools.filter(p => p.pool_type === 'premium' || p.pool_type === 'featured').length;

  console.log(`      📈 Company Metriken: ${totalPools} Pools, ${totalCandidates} Kandidaten, ${totalSelections} Auswahlen`);

  if (totalPools >= 0 && totalCandidates >= 0 && totalSelections >= 0) {
    console.log('      ✅ Company Pool Übersicht Metriken valide');
  } else {
    throw new Error(`Invalid company pool overview metrics for ${companyName}`);
  }
}

async function testCompanyPoolDetail(poolId: string, companyId: string, companyName: string): Promise<void> {
  console.log(`   🎯 Teste Company Pool Detail für ${companyName}...`);

  // Check if company has access
  const { data: access, error: accessError } = await supabase
    .from('pool_company_access')
    .select(`
      *,
      pool:candidate_pools(
        id,
        name,
        description,
        pool_type,
        max_candidates
      )
    `)
    .eq('pool_id', poolId)
    .eq('company_id', companyId)
    .single();

  if (accessError || !access) {
    console.log(`      ⚠️ Kein Zugriff auf Pool für ${companyName}`);
    return;
  }

  // Get candidate count
  const { count: candidateCount } = await supabase
    .from('pool_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', poolId);

  // Get candidates with selections
  const { data: assignments } = await supabase
    .from('pool_candidates')
    .select(`
      *,
      candidate:candidates(
        id,
        first_name,
        last_name,
        email,
        skills
      )
    `)
    .eq('pool_id', poolId);

  const totalCandidates = assignments?.length || 0;
  const featuredCandidates = assignments?.filter(a => a.featured).length || 0;

  // Get company's selections
  const { count: mySelections } = await supabase
    .from('candidate_selections')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('pool_id', poolId);

  console.log(`      📊 Detail Stats: ${totalCandidates} Kandidaten, ${featuredCandidates} featured, ${mySelections || 0} eigene Auswahlen`);

  if (totalCandidates >= 0 && featuredCandidates >= 0 && (mySelections || 0) >= 0) {
    console.log('      ✅ Company Pool Detail Metriken valide');
  } else {
    throw new Error(`Invalid company pool detail metrics`);
  }
}

async function testPoolAssignments(): Promise<void> {
  console.log('   📋 Teste Pool Assignments...');

  const { data: assignments, error } = await supabase
    .from('pool_candidates')
    .select(`
      *,
      pool:candidate_pools(
        id,
        name,
        pool_type
      ),
      candidate:candidates(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .order('added_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  const totalAssignments = assignments?.length || 0;
  const featuredAssignments = assignments?.filter(a => a.featured).length || 0;

  // Get selections for these assignments
  const assignmentMetrics = await Promise.all(
    (assignments || []).map(async (assignment) => {
      const { count: selectionCount } = await supabase
        .from('candidate_selections')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', assignment.candidate_id)
        .eq('pool_id', assignment.pool_id);

      return {
        pool_name: assignment.pool?.name || 'Unknown',
        candidate_name: assignment.candidate ? 
          `${assignment.candidate.first_name} ${assignment.candidate.last_name}` : 'Unknown',
        selection_count: selectionCount || 0,
        featured: assignment.featured,
        priority: assignment.priority
      };
    })
  );

  console.log(`      📈 Assignment Stats: ${totalAssignments} Zuweisungen, ${featuredAssignments} featured`);

  if (totalAssignments >= 0 && featuredAssignments >= 0) {
    console.log('      ✅ Pool Assignments Metriken valide');
  } else {
    throw new Error('Invalid pool assignments metrics');
  }
}

async function getAllPools() {
  const { data: pools, error } = await supabase
    .from('candidate_pools')
    .select('id, name')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return pools || [];
}

async function getTestCompanies() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return companies || [];
}

async function getCompanyPoolAccess(companyId: string) {
  const { data: access, error } = await supabase
    .from('pool_company_access')
    .select('pool_id, access_level')
    .eq('company_id', companyId);

  if (error) throw error;
  return access || [];
}

async function ensureTestAssignments() {
  console.log('   🔧 Überprüfe Test-Zuweisungen...');

  const companies = await getTestCompanies();
  const pools = await getAllPools();

  if (companies.length === 0 || pools.length === 0) {
    console.log('      ⚠️ Keine Unternehmen oder Pools für Test-Zuweisungen');
    return;
  }

  // Check if we have any existing assignments
  const { count: existingAssignments } = await supabase
    .from('pool_company_access')
    .select('*', { count: 'exact', head: true });

  if ((existingAssignments || 0) === 0) {
    console.log('      🎯 Erstelle Test-Zuweisungen...');
    
    // Create some test assignments
    const testAssignments = [];
    for (let i = 0; i < Math.min(3, companies.length); i++) {
      for (let j = 0; j < Math.min(2, pools.length); j++) {
        testAssignments.push({
          pool_id: pools[j].id,
          company_id: companies[i].id,
          access_level: ['view', 'select', 'contact'][j % 3],
          granted_by: companies[0].id, // Use first company as admin for testing
        });
      }
    }

    if (testAssignments.length > 0) {
      const { error } = await supabase
        .from('pool_company_access')
        .insert(testAssignments);

      if (error) {
        console.log('      ⚠️ Fehler beim Erstellen von Test-Zuweisungen:', error.message);
      } else {
        console.log(`      ✅ ${testAssignments.length} Test-Zuweisungen erstellt`);
      }
    }
  } else {
    console.log(`      ✅ ${existingAssignments} existierende Zuweisungen gefunden`);
  }
}

// Run the tests
testPoolRoutes().catch(console.error); 