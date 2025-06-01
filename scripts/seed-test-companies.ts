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
  console.log('\x1b[36m✓ Loaded environment variables from .env.local\x1b[0m');
}

// Check for required environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\x1b[31m❌ Missing required environment variables!\x1b[0m\n');
  console.log('Please create a .env.local file in the root directory with:');
  console.log('\x1b[36m');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here (REQUIRED for creating users)');
  console.log('\x1b[0m');
  console.log('\nGet these values from your Supabase project:');
  console.log('https://app.supabase.com/project/_/settings/api\n');
  process.exit(1);
}

// Supabase Admin Client mit Service Role Key
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Check if we have service role key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31m❌ SUPABASE_SERVICE_ROLE_KEY is required to create auth users!\x1b[0m');
  console.log('\x1b[33mPlease add your Service Role Key to .env.local\x1b[0m\n');
  process.exit(1);
}

console.log('\x1b[32m✓ Using Service Role Key (can create auth users)\x1b[0m\n');

// Farbige Console-Ausgaben
const log = {
  info: (msg: string) => console.log(`\x1b[36m✓ ${msg}\x1b[0m`),
  error: (msg: string) => console.error(`\x1b[31m✗ ${msg}\x1b[0m`),
  warn: (msg: string) => console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`),
  success: (msg: string) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`)
};

// Test-Unternehmen mit Auth-Daten
const testCompanies = [
  {
    email: 'anna.schmidt@techcorp-solutions.de',
    password: 'company123',
    name: 'TechCorp Solutions GmbH',
    website: 'https://techcorp-solutions.de',
    address: 'Musterstraße 123, 10115 Berlin',
    contact_name: 'Anna Schmidt',
    contact_email: 'anna.schmidt@techcorp-solutions.de',
    contact_phone: '+49 30 12345678',
    onboarding_status: 'completed' as const,
    onboarding_progress: 100
  },
  {
    email: 'michael.weber@digilabs.com',
    password: 'company123',
    name: 'Digital Innovation Labs',
    website: 'https://digital-innovation-labs.com',
    address: 'Hauptstraße 45, 80331 München',
    contact_name: 'Michael Weber',
    contact_email: 'michael.weber@digilabs.com',
    contact_phone: '+49 89 98765432',
    onboarding_status: 'completed' as const,
    onboarding_progress: 100
  },
  {
    email: 'sarah.johnson@startup-dynamics.io',
    password: 'company123',
    name: 'StartUp Dynamics',
    website: 'https://startup-dynamics.io',
    address: 'Kreativpark 7, 20095 Hamburg',
    contact_name: 'Sarah Johnson',
    contact_email: 'sarah.johnson@startup-dynamics.io',
    contact_phone: '+49 40 55544433',
    onboarding_status: 'completed' as const,
    onboarding_progress: 100
  },
  {
    email: 'thomas.mueller@enterprise-solutions.de',
    password: 'company123',
    name: 'Enterprise Solutions AG',
    website: 'https://enterprise-solutions.de',
    address: 'Businesscenter 22, 50667 Köln',
    contact_name: 'Thomas Müller',
    contact_email: 'thomas.mueller@enterprise-solutions.de',
    contact_phone: '+49 221 77788899',
    onboarding_status: 'in_progress' as const,
    onboarding_progress: 75
  },
  {
    email: 'lisa.chen@cloudfirst.tech',
    password: 'company123',
    name: 'CloudFirst Technologies',
    website: 'https://cloudfirst.tech',
    address: 'Innovation Hub 15, 70173 Stuttgart',
    contact_name: 'Lisa Chen',
    contact_email: 'lisa.chen@cloudfirst.tech',
    contact_phone: '+49 711 33322211',
    onboarding_status: 'completed' as const,
    onboarding_progress: 100
  },
  {
    email: 'robert.braun@ai-ventures.berlin',
    password: 'company123',
    name: 'AI Ventures Berlin',
    website: 'https://ai-ventures.berlin',
    address: 'Startup Allee 88, 10178 Berlin',
    contact_name: 'Dr. Robert Braun',
    contact_email: 'robert.braun@ai-ventures.berlin',
    contact_phone: '+49 30 44455566',
    onboarding_status: 'not_started' as const,
    onboarding_progress: 25
  }
];

// Utility-Funktionen
async function createAuthUser(email: string, password: string, role: string) {
  try {
    // First check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);
    
    let userId: string;
    
    if (existingUser) {
      // User already exists in Auth
      userId = existingUser.id;
      log.warn(`Auth user ${email} already exists, using existing ID`);
    } else {
      // Create new Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        log.error(`Fehler beim Erstellen von Auth-User ${email}: ${authError.message}`);
        return null;
      }
      
      userId = authData.user.id;
      log.success(`Auth-User ${email} erstellt`);
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingProfile) {
      log.warn(`Profile for ${email} already exists`);
      return userId;
    }

    // Create profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role
      });

    if (profileError) {
      log.error(`Fehler beim Erstellen von Profil für ${email}: ${profileError.message}`);
      return null;
    }

    log.success(`Profile für ${email} erstellt`);
    return userId;
    
  } catch (error) {
    log.error(`Unerwarteter Fehler bei ${email}: ${error}`);
    return null;
  }
}

async function cleanExistingCompanies() {
  const args = process.argv.slice(2);
  if (!args.includes('--clean')) {
    return;
  }

  log.warn('Bereinige bestehende Testunternehmen...');
  
  // Get existing test companies by their names
  const companyNames = testCompanies.map(c => c.name);
  
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .in('name', companyNames);
    
  if (existingCompanies && existingCompanies.length > 0) {
    // Delete companies
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .in('id', existingCompanies.map(c => c.id));
      
    if (deleteError) {
      log.warn(`Fehler beim Löschen bestehender Unternehmen: ${deleteError.message}`);
    } else {
      log.info(`${existingCompanies.length} bestehende Testunternehmen gelöscht`);
    }
    
    // Delete profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .in('id', existingCompanies.map(c => c.id));
      
    if (profileError) {
      log.warn(`Fehler beim Löschen von Profilen: ${profileError.message}`);
    }
    
    // Delete auth users
    for (const company of existingCompanies) {
      const { error: authError } = await supabase.auth.admin.deleteUser(company.id);
      if (authError) {
        log.warn(`Fehler beim Löschen von Auth-User für ${company.name}: ${authError.message}`);
      }
    }
  }
}

async function seedTestCompanies() {
  log.info('Erstelle Testunternehmen mit Auth-Benutzern...');
  
  const createdCompanies: Array<{ name: string; email: string; password: string }> = [];
  
  for (const company of testCompanies) {
    log.info(`Erstelle ${company.name}...`);
    
    // Create auth user and profile
    const userId = await createAuthUser(company.email, company.password, 'company');
    if (!userId) {
      log.error(`Überspringe ${company.name} wegen Auth-Fehler`);
      continue;
    }

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingCompany) {
      log.warn(`Unternehmen ${company.name} existiert bereits in der Datenbank`);
      createdCompanies.push({ name: company.name, email: company.email, password: company.password });
      continue;
    }

    // Create company record
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        id: userId,
        name: company.name,
        website: company.website,
        address: company.address,
        contact_name: company.contact_name,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
        onboarding_status: company.onboarding_status,
        onboarding_progress: company.onboarding_progress
      });

    if (companyError) {
      log.error(`Fehler beim Erstellen von Unternehmen ${company.name}: ${companyError.message}`);
      continue;
    }

    createdCompanies.push({ name: company.name, email: company.email, password: company.password });
    log.success(`✓ ${company.name} vollständig erstellt`);
  }
  
  return createdCompanies;
}

// Hauptfunktion
async function main() {
  const args = process.argv.slice(2);

  console.log('\n🏢 Test-Unternehmen mit Auth-Benutzern erstellen\n');

  try {
    // Clean existing if requested
    await cleanExistingCompanies();

    // Create test companies
    const createdCompanies = await seedTestCompanies();

    console.log('\n✅ Testunternehmen erfolgreich erstellt!\n');
    
    if (createdCompanies.length > 0) {
      console.log('🔑 Login-Daten für Testunternehmen:');
      console.log('=====================================');
      createdCompanies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Email:    ${company.email}`);
        console.log(`   Passwort: ${company.password}`);
        console.log('');
      });
      
      console.log('📋 Diese Unternehmen können jetzt:');
      console.log('• Sich in das Dashboard einloggen');
      console.log('• Pool-Zuweisungen über Admin erhalten');
      console.log('• Kandidaten durchsuchen und auswählen');
      console.log('• Kontakt zu Kandidaten aufnehmen');
      console.log('');
      
      console.log('🎯 Nächste Schritte:');
      console.log('1. Melden Sie sich als Admin an');
      console.log('2. Gehen Sie zu Pool-Details → Unternehmen Tab');
      console.log('3. Fügen Sie diese Unternehmen zu Pools hinzu');
      console.log('4. Testen Sie die verschiedenen Zugriffslevels');
    }

  } catch (error) {
    console.error('\n❌ Fehler beim Erstellen der Testunternehmen:', error);
    process.exit(1);
  }
}

// Script ausführen
main(); 