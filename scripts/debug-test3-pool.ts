import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehlende Umgebungsvariablen:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Gesetzt' : '❌ Fehlt');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Gesetzt' : '❌ Fehlt');
  console.error('\nBitte stellen Sie sicher, dass .env.local existiert und die erforderlichen Variablen enthält.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTest3Pool() {
  console.log('🔍 Debug: Pool "test3" Kandidaten Problem\n');
  
  try {
    // 1. Pool "test3" finden
    console.log('1️⃣ Suche Pool "test3"...');
    const { data: pools, error: poolError } = await supabase
      .from('candidate_pools')
      .select('*')
      .ilike('name', '%test3%');

    if (poolError) {
      console.error('❌ Fehler beim Suchen der Pools:', poolError);
      return;
    }

    if (!pools || pools.length === 0) {
      console.log('❌ Pool "test3" nicht gefunden');
      return;
    }

    const pool = pools[0];
    console.log(`✅ Pool gefunden: ${pool.name} (ID: ${pool.id})`);
    console.log(`   - Status: ${pool.status}`);
    console.log(`   - Typ: ${pool.pool_type}`);
    console.log(`   - Erstellt: ${pool.created_at}`);

    // 2. Pool-Kandidaten-Zuweisungen prüfen
    console.log('\n2️⃣ Prüfe Pool-Kandidaten-Zuweisungen...');
    const { data: poolCandidates, error: pcError } = await supabase
      .from('pool_candidates')
      .select('*')
      .eq('pool_id', pool.id);

    if (pcError) {
      console.error('❌ Fehler beim Laden der Pool-Kandidaten:', pcError);
      return;
    }

    console.log(`📊 ${poolCandidates?.length || 0} Kandidaten-Zuweisungen gefunden`);
    
    if (poolCandidates && poolCandidates.length > 0) {
      console.log('   Zugewiesene Kandidaten-IDs:', poolCandidates.map(pc => pc.candidate_id));
      console.log('   Erste Zuweisung Details:', poolCandidates[0]);
    }

    // 3. Kandidaten-Daten prüfen
    if (poolCandidates && poolCandidates.length > 0) {
      console.log('\n3️⃣ Prüfe Kandidaten-Daten...');
      
      for (const pc of poolCandidates.slice(0, 3)) { // Nur erste 3 prüfen
        console.log(`\n   Kandidat ID: ${pc.candidate_id}`);
        
        const { data: candidate, error: candError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', pc.candidate_id)
          .single();

        if (candError) {
          console.error(`   ❌ Fehler beim Laden von Kandidat ${pc.candidate_id}:`, candError);
        } else if (candidate) {
          console.log(`   ✅ ${candidate.first_name} ${candidate.last_name} (${candidate.email})`);
          console.log(`      - Skills: ${JSON.stringify(candidate.skills)}`);
        } else {
          console.log(`   ⚠️ Kandidat ${pc.candidate_id} nicht gefunden in candidates Tabelle`);
        }
      }
    }

    // 4. RLS Policies prüfen
    console.log('\n4️⃣ Prüfe RLS Policies...');
    
    // Candidates table policies
    const { data: candidatePolicies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'candidates');

    if (candidatePolicies && candidatePolicies.length > 0) {
      console.log(`📜 Candidates RLS Policies (${candidatePolicies.length}):`);
      candidatePolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}): ${policy.qual}`);
      });
    } else {
      console.log('⚠️ Keine RLS Policies für candidates Tabelle gefunden');
    }

    // Pool candidates policies  
    const { data: poolCandidatePolicies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'pool_candidates');

    if (poolCandidatePolicies && poolCandidatePolicies.length > 0) {
      console.log(`📜 Pool Candidates RLS Policies (${poolCandidatePolicies.length}):`);
      poolCandidatePolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}): ${policy.qual}`);
      });
    } else {
      console.log('⚠️ Keine RLS Policies für pool_candidates Tabelle gefunden');
    }

    // 5. Test Query wie in der App
    console.log('\n5️⃣ Teste Query wie in der Admin App...');
    const { data: testQuery, error: testError } = await supabase
      .from("pool_candidates")
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
      .eq("pool_id", pool.id)
      .order("priority", { ascending: false });

    if (testError) {
      console.error('❌ Fehler bei Test Query:', testError);
    } else {
      console.log(`✅ Test Query erfolgreich: ${testQuery?.length || 0} Ergebnisse`);
      if (testQuery && testQuery.length > 0) {
        console.log('   Erste 2 Ergebnisse:');
        testQuery.slice(0, 2).forEach((result, index) => {
          console.log(`     ${index + 1}. Assignment ID: ${result.id}`);
          console.log(`        Candidate: ${result.candidate?.first_name || 'NULL'} ${result.candidate?.last_name || 'NULL'}`);
          console.log(`        Email: ${result.candidate?.email || 'NULL'}`);
          console.log(`        Skills: ${JSON.stringify(result.candidate?.skills) || 'NULL'}`);
        });
      }
    }

    // 6. Admin User prüfen
    console.log('\n6️⃣ Prüfe Admin Users...');
    const { data: adminUsers } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'admin');

    console.log(`👨‍💼 ${adminUsers?.length || 0} Admin User gefunden`);
    if (adminUsers && adminUsers.length > 0) {
      console.log('   Admin IDs:', adminUsers.map(u => u.id));
    }

  } catch (error) {
    console.error('💥 Unerwarteter Fehler:', error);
  }
}

debugTest3Pool().catch(console.error); 