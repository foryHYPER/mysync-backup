/**
 * Script to add comprehensive test data for pool system testing
 * This creates realistic test scenarios with candidates, pools, company access, and selections
 */

import { createClient } from '@supabase/supabase-js';

// Environment setup 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('SUPABASE_SERVICE_ROLE_KEY is required to create auth users!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color logging functions
const log = {
  info: (msg: string) => console.log(`\x1b[36m✓ ${msg}\x1b[0m`),
  error: (msg: string) => console.error(`\x1b[31m✗ ${msg}\x1b[0m`),
  warn: (msg: string) => console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`),
  success: (msg: string) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`)
};

interface TestCandidate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  experience?: number;
  skills?: string[];
  availability?: string;
}

const TEST_CANDIDATES: TestCandidate[] = [
  {
    email: 'max.mustermann@example.com',
    password: 'candidate123',
    first_name: 'Max',
    last_name: 'Mustermann',
    phone: '+49 170 1234567',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    location: 'Berlin',
    experience: 5,
    availability: 'Sofort verfügbar'
  },
  {
    email: 'anna.schmidt.dev@example.com',
    password: 'candidate123',
    first_name: 'Anna',
    last_name: 'Schmidt',
    phone: '+49 171 2345678',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
    location: 'München',
    experience: 3,
    availability: 'Ab März 2025'
  },
  {
    email: 'thomas.weber.dev@example.com',
    password: 'candidate123',
    first_name: 'Thomas',
    last_name: 'Weber',
    phone: '+49 172 3456789',
    skills: ['Java', 'Spring', 'Kubernetes', 'Docker'],
    location: 'Hamburg',
    experience: 7,
    availability: 'Sofort verfügbar'
  },
  {
    email: 'lisa.chen.dev@example.com',
    password: 'candidate123',
    first_name: 'Lisa',
    last_name: 'Chen',
    phone: '+49 173 4567890',
    skills: ['React', 'Vue.js', 'CSS', 'UX/UI'],
    location: 'Berlin',
    experience: 4,
    availability: 'Ab Februar 2025'
  },
  {
    email: 'michael.johnson.dev@example.com',
    password: 'candidate123',
    first_name: 'Michael',
    last_name: 'Johnson',
    phone: '+49 174 5678901',
    skills: ['C#', '.NET', 'Azure', 'SQL Server'],
    location: 'Frankfurt',
    experience: 6,
    availability: 'Sofort verfügbar'
  },
  {
    email: 'sarah.mueller.dev@example.com',
    password: 'candidate123',
    first_name: 'Sarah',
    last_name: 'Müller',
    phone: '+49 175 6789012',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science'],
    location: 'Berlin',
    experience: 4,
    availability: 'Ab April 2025'
  },
  {
    email: 'david.brown.dev@example.com',
    password: 'candidate123',
    first_name: 'David',
    last_name: 'Brown',
    phone: '+49 176 7890123',
    skills: ['PHP', 'Laravel', 'MySQL', 'Redis'],
    location: 'Köln',
    experience: 5,
    availability: 'Sofort verfügbar'
  },
  {
    email: 'emma.wilson.dev@example.com',
    password: 'candidate123',
    first_name: 'Emma',
    last_name: 'Wilson',
    phone: '+49 177 8901234',
    skills: ['React Native', 'iOS', 'Android', 'Flutter'],
    location: 'Stuttgart',
    experience: 3,
    availability: 'Ab März 2025'
  }
];

const TEST_POOLS = [
  {
    name: 'Senior Frontend Entwickler',
    description: 'Erfahrene Frontend-Entwickler mit React und TypeScript Kenntnissen',
    pool_type: 'featured',
    visibility: 'public',
    max_candidates: 20,
    tags: ['Frontend', 'React', 'Senior']
  },
  {
    name: 'Backend & DevOps Spezialisten',
    description: 'Backend-Entwickler und DevOps Engineers für Cloud-Projekte',
    pool_type: 'premium',
    visibility: 'private',
    max_candidates: 15,
    tags: ['Backend', 'DevOps', 'Cloud']
  },
  {
    name: 'Data Science Team',
    description: 'Data Scientists und Machine Learning Engineers',
    pool_type: 'custom',
    visibility: 'restricted',
    max_candidates: 10,
    tags: ['Data Science', 'AI', 'ML']
  },
  {
    name: 'Mobile Development',
    description: 'iOS und Android Entwickler für mobile Apps',
    pool_type: 'main',
    visibility: 'public',
    max_candidates: 25,
    tags: ['Mobile', 'iOS', 'Android']
  }
];

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
    log.error(`Unerwarteter Fehler für ${email}: ${error}`);
    return null;
  }
}

async function addTestPoolData() {
  console.log('\n🎯 Pool Test-Daten hinzufügen');
  console.log('===============================\n');

  try {
    // Step 1: Create test candidates if they don't exist
    console.log('1️⃣ Erstelle Test-Kandidaten...');
    const createdCandidates = await createTestCandidates();
    
    // Step 2: Create test pools if they don't exist
    console.log('2️⃣ Erstelle Test-Pools...');
    const createdPools = await createTestPools();
    
    // Step 3: Assign candidates to pools
    console.log('3️⃣ Weise Kandidaten zu Pools zu...');
    await assignCandidatesToPools(createdCandidates, createdPools);
    
    // Step 4: Grant company access to pools
    console.log('4️⃣ Gewähre Unternehmen Zugang zu Pools...');
    await grantCompanyAccess(createdPools);
    
    console.log('\n✅ Test-Daten erfolgreich hinzugefügt!');
    console.log('\n📊 Übersicht der erstellten Test-Daten:');
    await showTestDataSummary();

  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen der Test-Daten:', error);
  }
}

async function createTestCandidates() {
  const createdCandidates = [];
  
  for (const candidate of TEST_CANDIDATES) {
    // Check if candidate already exists
    const { data: existing } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', candidate.email)
      .single();
    
    if (existing) {
      console.log(`   ⚠️ Kandidat ${candidate.first_name} ${candidate.last_name} existiert bereits`);
      createdCandidates.push(existing);
      continue;
    }
    
    // Create auth user and profile first
    const userId = await createAuthUser(candidate.email, candidate.password, 'candidate');
    if (!userId) {
      console.log(`   ❌ Konnte Auth-User für ${candidate.first_name} ${candidate.last_name} nicht erstellen`);
      continue;
    }
    
    // Create candidate data with correct column names and user ID
    const candidateData = {
      id: userId, // Use the auth user ID
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      experience: candidate.experience || 0,
      availability: candidate.availability,
      skills: candidate.skills || [],
      status: 'active'
    };
    
    // Create new candidate
    const { data: newCandidate, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select('*')
      .single();
    
    if (error) {
      console.error(`   ❌ Fehler beim Erstellen von ${candidate.first_name} ${candidate.last_name}:`, error.message);
      continue;
    }
    
    console.log(`   ✅ Kandidat ${candidate.first_name} ${candidate.last_name} erstellt`);
    createdCandidates.push(newCandidate);
  }
  
  return createdCandidates;
}

async function createTestPools() {
  // Get admin user ID for created_by field
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (!adminProfile) {
    throw new Error('Kein Admin-Benutzer gefunden');
  }

  const createdPools = [];
  
  for (const pool of TEST_POOLS) {
    // Check if pool already exists
    const { data: existing } = await supabase
      .from('candidate_pools')
      .select('*')
      .eq('name', pool.name)
      .single();
    
    if (existing) {
      console.log(`   ⚠️ Pool "${pool.name}" existiert bereits`);
      createdPools.push(existing);
      continue;
    }
    
    // Create new pool
    const { data: newPool, error } = await supabase
      .from('candidate_pools')
      .insert({
        ...pool,
        created_by: adminProfile.id,
        status: 'active'
      })
      .select('*')
      .single();
    
    if (error) {
      console.error(`   ❌ Fehler beim Erstellen von Pool "${pool.name}":`, error.message);
      continue;
    }
    
    console.log(`   ✅ Pool "${pool.name}" erstellt`);
    createdPools.push(newPool);
  }
  
  return createdPools;
}

async function assignCandidatesToPools(candidates: any[], pools: any[]) {
  const assignments = [
    // Frontend Pool
    { pool_idx: 0, candidate_idx: 0, priority: 5, featured: true, notes: 'Top React Developer' },
    { pool_idx: 0, candidate_idx: 3, priority: 4, featured: true, notes: 'Excellent UX skills' },
    { pool_idx: 0, candidate_idx: 4, priority: 3, featured: false, notes: 'Strong full-stack background' },
    
    // Backend & DevOps Pool
    { pool_idx: 1, candidate_idx: 1, priority: 5, featured: true, notes: 'Expert in Python and AWS' },
    { pool_idx: 1, candidate_idx: 2, priority: 5, featured: true, notes: 'DevOps specialist' },
    { pool_idx: 1, candidate_idx: 6, priority: 3, featured: false, notes: 'PHP backend developer' },
    
    // Data Science Pool
    { pool_idx: 2, candidate_idx: 5, priority: 5, featured: true, notes: 'Machine Learning expert' },
    { pool_idx: 2, candidate_idx: 1, priority: 3, featured: false, notes: 'Python data analysis' },
    
    // Mobile Development Pool
    { pool_idx: 3, candidate_idx: 7, priority: 5, featured: true, notes: 'React Native specialist' },
    { pool_idx: 3, candidate_idx: 0, priority: 2, featured: false, notes: 'Can learn mobile development' },
    { pool_idx: 3, candidate_idx: 3, priority: 3, featured: false, notes: 'Frontend skills transferable to mobile' }
  ];

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  for (const assignment of assignments) {
    const pool = pools[assignment.pool_idx];
    const candidate = candidates[assignment.candidate_idx];
    
    if (!pool || !candidate) continue;
    
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('pool_candidates')
      .select('id')
      .eq('pool_id', pool.id)
      .eq('candidate_id', candidate.id)
      .single();
    
    if (existing) {
      console.log(`   ⚠️ Zuweisung ${candidate.first_name} ${candidate.last_name} → ${pool.name} existiert bereits`);
      continue;
    }
    
    const { error } = await supabase
      .from('pool_candidates')
      .insert({
        pool_id: pool.id,
        candidate_id: candidate.id,
        added_by: adminProfile?.id,
        priority: assignment.priority,
        featured: assignment.featured,
        notes: assignment.notes
      });
    
    if (error) {
      console.error(`   ❌ Fehler bei Zuweisung ${candidate.first_name} ${candidate.last_name} → ${pool.name}:`, error.message);
      continue;
    }
    
    console.log(`   ✅ ${candidate.first_name} ${candidate.last_name} → ${pool.name} (Priorität: ${assignment.priority}${assignment.featured ? ', Featured' : ''})`);
  }
}

async function grantCompanyAccess(pools: any[]) {
  // Get companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(6);

  if (!companies || companies.length === 0) {
    console.log('   ⚠️ Keine Unternehmen gefunden');
    return;
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  const accessAssignments = [
    // Frontend Pool - 3 companies with different access levels
    { pool_idx: 0, company_idx: 0, access_level: 'contact', expires_days: 30 },
    { pool_idx: 0, company_idx: 1, access_level: 'select', expires_days: 60 },
    { pool_idx: 0, company_idx: 2, access_level: 'view', expires_days: 90 },
    
    // Backend Pool - 4 companies
    { pool_idx: 1, company_idx: 0, access_level: 'contact', expires_days: 45 },
    { pool_idx: 1, company_idx: 1, access_level: 'contact', expires_days: 30 },
    { pool_idx: 1, company_idx: 3, access_level: 'select', expires_days: 60 },
    { pool_idx: 1, company_idx: 4, access_level: 'view', expires_days: 120 },
    
    // Data Science Pool - 2 companies (restricted)
    { pool_idx: 2, company_idx: 0, access_level: 'contact', expires_days: 60 },
    { pool_idx: 2, company_idx: 5, access_level: 'select', expires_days: 90 },
    
    // Mobile Pool - 5 companies
    { pool_idx: 3, company_idx: 0, access_level: 'contact', expires_days: 30 },
    { pool_idx: 3, company_idx: 1, access_level: 'select', expires_days: 45 },
    { pool_idx: 3, company_idx: 2, access_level: 'select', expires_days: 60 },
    { pool_idx: 3, company_idx: 3, access_level: 'view', expires_days: 90 },
    { pool_idx: 3, company_idx: 4, access_level: 'view', expires_days: 120 }
  ];

  for (const access of accessAssignments) {
    const pool = pools[access.pool_idx];
    const company = companies[access.company_idx];
    
    if (!pool || !company) continue;

    // Check if access already exists
    const { data: existing } = await supabase
      .from('pool_company_access')
      .select('id')
      .eq('pool_id', pool.id)
      .eq('company_id', company.id)
      .single();
    
    if (existing) {
      console.log(`   ⚠️ Zugriff ${company.name} → ${pool.name} existiert bereits`);
      continue;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + access.expires_days);

    const { error } = await supabase
      .from('pool_company_access')
      .insert({
        pool_id: pool.id,
        company_id: company.id,
        granted_by: adminProfile?.id,
        access_level: access.access_level,
        expires_at: expiresAt.toISOString(),
        notes: `Test-Zugriff gewährt für ${access.expires_days} Tage`
      });
    
    if (error) {
      console.error(`   ❌ Fehler bei Zugriff ${company.name} → ${pool.name}:`, error.message);
      continue;
    }
    
    console.log(`   ✅ ${company.name} → ${pool.name} (${access.access_level}, ${access.expires_days} Tage)`);
  }
}

async function showTestDataSummary() {
  // Count totals
  const { count: totalPools } = await supabase
    .from('candidate_pools')
    .select('*', { count: 'exact', head: true });

  const { count: totalCandidates } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true });

  const { count: totalAssignments } = await supabase
    .from('pool_candidates')
    .select('*', { count: 'exact', head: true });

  const { count: totalAccess } = await supabase
    .from('pool_company_access')
    .select('*', { count: 'exact', head: true });

  console.log(`• ${totalPools || 0} Pools`);
  console.log(`• ${totalCandidates || 0} Kandidaten`);
  console.log(`• ${totalAssignments || 0} Pool-Zuweisungen`);
  console.log(`• ${totalAccess || 0} Unternehmen-Zugriffe`);

  console.log('\n🎯 Jetzt können Sie alle Pool-Routen testen:');
  console.log('• /dashboard/admin/pools - Pool-Übersicht');
  console.log('• /dashboard/admin/pools/[id] - Pool-Details');
  console.log('• /dashboard/company/pools - Unternehmen Pool-Übersicht');
  console.log('• /dashboard/company/pools/[id] - Unternehmen Pool-Details');
  
  console.log('\n🔑 Test-Accounts erstellt:');
  console.log('Kandidaten können sich mit folgenden Daten anmelden:');
  TEST_CANDIDATES.forEach(candidate => {
    console.log(`• ${candidate.email} | Password: ${candidate.password}`);
  });
}

// Run the script
if (require.main === module) {
  addTestPoolData().catch(console.error);
} 