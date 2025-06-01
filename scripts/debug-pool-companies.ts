import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local file if it exists
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugPoolCompanies() {
  console.log('\n🔍 Pool-Unternehmen Debug Information\n');

  try {
    // Get all pools
    const { data: pools } = await supabase
      .from('candidate_pools')
      .select('id, name')
      .order('created_at', { ascending: false });

    console.log('📋 Alle Pools:');
    console.log('=============');
    if (pools) {
      pools.forEach(pool => {
        console.log(`- ${pool.name} (ID: ${pool.id})`);
      });
    }
    console.log('');

    // Get all companies
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    console.log('🏢 Alle Unternehmen:');
    console.log('==================');
    if (companies) {
      companies.forEach(company => {
        console.log(`- ${company.name} (ID: ${company.id})`);
      });
    }
    console.log('');

    // Get all pool company access
    const { data: poolAccess } = await supabase
      .from('pool_company_access')
      .select(`
        *,
        pool:candidate_pools(name),
        company:companies(name)
      `)
      .order('granted_at', { ascending: false });

    console.log('🔗 Pool-Zuweisungen:');
    console.log('===================');
    if (poolAccess && poolAccess.length > 0) {
      poolAccess.forEach(access => {
        console.log(`- Pool: "${access.pool?.name}" → Unternehmen: "${access.company?.name}"`);
        console.log(`  Zugriffslevel: ${access.access_level}, Gewährt am: ${new Date(access.granted_at).toLocaleDateString('de-DE')}`);
        console.log('');
      });
    } else {
      console.log('❌ Keine Pool-Zuweisungen gefunden!');
      console.log('');
    }

    // For each pool, show which companies have access and which don't
    if (pools && pools.length > 0) {
      console.log('📊 Detaillierte Pool-Analyse:');
      console.log('============================');
      
      for (const pool of pools) {
        console.log(`\n🏊 Pool: "${pool.name}"`);
        
        // Get companies with access to this pool
        const { data: poolCompanies } = await supabase
          .from('pool_company_access')
          .select('company_id, access_level')
          .eq('pool_id', pool.id);

        const companiesWithAccess = new Set(poolCompanies?.map(pc => pc.company_id) || []);
        
        console.log(`   ✅ Unternehmen mit Zugang (${companiesWithAccess.size}):`);
        if (poolCompanies && poolCompanies.length > 0) {
          for (const pc of poolCompanies) {
            const company = companies?.find(c => c.id === pc.company_id);
            console.log(`      - ${company?.name || 'Unbekannt'} (${pc.access_level})`);
          }
        } else {
          console.log('      (keine)');
        }

        console.log(`   ❌ Verfügbare Unternehmen (${companies ? companies.length - companiesWithAccess.size : 0}):`);
        if (companies) {
          const availableCompanies = companies.filter(c => !companiesWithAccess.has(c.id));
          if (availableCompanies.length > 0) {
            availableCompanies.forEach(company => {
              console.log(`      - ${company.name}`);
            });
          } else {
            console.log('      (keine - alle Unternehmen haben bereits Zugang)');
          }
        }
      }
    }

    console.log('\n💡 Zusammenfassung:');
    console.log('==================');
    console.log(`- Pools gesamt: ${pools?.length || 0}`);
    console.log(`- Unternehmen gesamt: ${companies?.length || 0}`);
    console.log(`- Pool-Zuweisungen gesamt: ${poolAccess?.length || 0}`);

  } catch (error) {
    console.error('❌ Fehler beim Debug:', error);
  }
}

debugPoolCompanies(); 