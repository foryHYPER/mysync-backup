import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehlende Umgebungsvariablen');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCompanyAccess() {
  console.log('🏢 Debug: Company Zugriff auf Pool-Kandidaten\n');
  
  try {
    // 1. Alle Company Profiles finden
    console.log('1️⃣ Suche Company Profiles...');
    const { data: companyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'company');

    if (profilesError) {
      console.error('❌ Fehler beim Laden der Company Profiles:', profilesError);
      return;
    }

    console.log(`👥 ${companyProfiles?.length || 0} Company Profiles gefunden`);
    if (companyProfiles && companyProfiles.length > 0) {
      console.log('   Company IDs:', companyProfiles.map(p => p.id));
      
      const firstCompany = companyProfiles[0];
      console.log(`\n📋 Erste Company Details: ${JSON.stringify(firstCompany, null, 2)}`);

      // 2. Pool Access für diese Company prüfen
      console.log('\n2️⃣ Prüfe Pool Access für erste Company...');
      const { data: poolAccess, error: accessError } = await supabase
        .from('pool_company_access')
        .select('*')
        .eq('company_id', firstCompany.id);

      if (accessError) {
        console.error('❌ Fehler beim Laden des Pool Access:', accessError);
        return;
      }

      console.log(`🔑 ${poolAccess?.length || 0} Pool-Zugriffe für Company gefunden`);
      if (poolAccess && poolAccess.length > 0) {
        console.log('   Pool Access Details:', poolAccess);

        // 3. Für jeden Pool die Kandidaten prüfen
        for (const access of poolAccess.slice(0, 2)) { // Nur erste 2 Pools testen
          console.log(`\n3️⃣ Teste Pool ${access.pool_id}...`);
          
          // Pool Name holen
          const { data: pool } = await supabase
            .from('candidate_pools')
            .select('name')
            .eq('id', access.pool_id)
            .single();

          console.log(`   Pool Name: ${pool?.name || 'Unbekannt'}`);

          // Pool Candidates mit Service Role (sollte funktionieren)
          const { data: poolCandidates, error: pcError } = await supabase
            .from('pool_candidates')
            .select('*')
            .eq('pool_id', access.pool_id);

          if (pcError) {
            console.error(`   ❌ Fehler beim Laden der Pool-Kandidaten:`, pcError);
          } else {
            console.log(`   📊 ${poolCandidates?.length || 0} Pool-Kandidaten gefunden (Service Role)`);
          }

          // Test Query wie in der Company App (simuliert Company User)
          console.log('   🔍 Teste Company Query (simuliert als Company User)...');
          
          // Simuliere Company Auth durch direktes SQL
          const testQuery = `
            SELECT pc.*, c.first_name, c.last_name, c.email
            FROM pool_candidates pc
            JOIN candidates c ON c.id = pc.candidate_id
            WHERE pc.pool_id = '${access.pool_id}'
            AND EXISTS (
              SELECT 1 FROM pool_company_access pca
              WHERE pca.pool_id = pc.pool_id
              AND pca.company_id = '${firstCompany.id}'
            )
          `;

          const { data: testResult, error: testError } = await supabase
            .rpc('exec_sql', { sql: testQuery });

          if (testError) {
            console.error('   ❌ Test Query Fehler:', testError);
          } else {
            console.log('   ✅ Test Query erfolgreich');
          }
        }
      } else {
        console.log('⚠️ Keine Pool-Zugriffe für diese Company gefunden');
        
        // Alle Pool Company Access anzeigen
        console.log('\n🔍 Alle Pool Company Access Einträge:');
        const { data: allAccess } = await supabase
          .from('pool_company_access')
          .select('*');
        
        console.log(allAccess);
      }
    }

    // 4. RLS Policies für pool_candidates prüfen
    console.log('\n4️⃣ Prüfe RLS Policies für pool_candidates...');
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'pool_candidates');

    if (policies && policies.length > 0) {
      console.log(`📜 ${policies.length} RLS Policies für pool_candidates gefunden:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
        console.log(`     Qual: ${policy.qual}`);
      });
    } else {
      console.log('⚠️ Keine RLS Policies für pool_candidates gefunden');
    }

  } catch (error) {
    console.error('💥 Unerwarteter Fehler:', error);
  }
}

debugCompanyAccess().catch(console.error); 