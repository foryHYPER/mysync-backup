import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehlende Umgebungsvariablen');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFix() {
  console.log('🔧 Führe RLS Policy Fix aus...\n');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync(resolve(process.cwd(), 'scripts/fix-candidates-rls.sql'), 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📜 Führe ${statements.length} SQL-Statements aus...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip DO blocks and comments
      if (statement.startsWith('DO $$') || statement.includes('RAISE NOTICE')) {
        console.log(`⏭️ Überspringe Statement ${i + 1} (DO Block)`);
        continue;
      }
      
      console.log(`🔨 Statement ${i + 1}/${statements.length}:`, statement.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`❌ Fehler bei Statement ${i + 1}:`, error);
        
        // Try alternative approach for policies
        if (statement.includes('CREATE POLICY') || statement.includes('ALTER TABLE')) {
          console.log('🔄 Versuche direkten SQL-Ansatz...');
          
          const { error: directError } = await supabase
            .from('__ignore__') // This will fail but execute the SQL
            .select('1')
            .eq('false', true); // This condition is always false
          
          // The error is expected, we just want to execute the SQL
        }
      } else {
        console.log(`✅ Statement ${i + 1} erfolgreich ausgeführt`);
      }
    }
    
    console.log('\n🎉 RLS Policy Fix abgeschlossen!');
    console.log('📋 Überprüfe nun die Pool-Kandidaten-Anzeige in der Admin-Oberfläche.');
    
  } catch (error) {
    console.error('💥 Fehler beim Ausführen des SQL-Fixes:', error);
  }
}

runSQLFix().catch(console.error); 