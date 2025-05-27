import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
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
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here (optional but recommended)');
  console.log('\x1b[0m');
  console.log('\nGet these values from your Supabase project:');
  console.log('https://app.supabase.com/project/_/settings/api\n');
  process.exit(1);
}

// Supabase Admin Client mit Service Role Key für volle Berechtigungen
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
    },
    global: {
      headers: {
        // Bypass RLS when using service role key
        ...(process.env.SUPABASE_SERVICE_ROLE_KEY ? { 'Prefer': 'return=minimal' } : {})
      }
    }
  }
);

// Log which key we're using
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\x1b[32m✓ Using Service Role Key (RLS bypassed)\x1b[0m\n');
} else {
  console.log('\x1b[33m⚠ Using Anon Key (RLS policies apply)\x1b[0m');
  console.log('\x1b[33m  For best results, add SUPABASE_SERVICE_ROLE_KEY to .env.local\x1b[0m\n');
}

// Farbige Console-Ausgaben
const log = {
  info: (msg: string) => console.log(`\x1b[36m✓ ${msg}\x1b[0m`),
  error: (msg: string) => console.error(`\x1b[31m✗ ${msg}\x1b[0m`),
  warn: (msg: string) => console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`),
  success: (msg: string) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`)
};

// Test-Daten
const skills = [
  // Frontend
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS',
  // Backend
  'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  // Datenbanken
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
  // Andere
  'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices'
];

const companies = [
  {
    email: 'hr@techcorp.de',
    password: 'test123',
    name: 'TechCorp GmbH',
    website: 'https://techcorp.de',
    address: 'Alexanderplatz 1, 10178 Berlin',
    contact_name: 'Anna Schmidt',
    contact_email: 'anna.schmidt@techcorp.de',
    contact_phone: '+49 30 12345678'
  },
  {
    email: 'jobs@innovate.de',
    password: 'test123',
    name: 'Innovate Solutions AG',
    website: 'https://innovate.de',
    address: 'Königsallee 92, 40212 Düsseldorf',
    contact_name: 'Thomas Weber',
    contact_email: 'thomas.weber@innovate.de',
    contact_phone: '+49 211 87654321'
  },
  {
    email: 'recruiting@digital.de',
    password: 'test123',
    name: 'Digital Dynamics GmbH',
    website: 'https://digital-dynamics.de',
    address: 'Marienplatz 8, 80331 München',
    contact_name: 'Sarah Meyer',
    contact_email: 'sarah.meyer@digital.de',
    contact_phone: '+49 89 11223344'
  }
];

const candidates = [
  {
    email: 'max.mustermann@email.de',
    password: 'test123',
    first_name: 'Max',
    last_name: 'Mustermann',
    phone: '+49 170 1234567',
    location: 'Berlin',
    experience: 5,
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    availability: 'Ab sofort'
  },
  {
    email: 'julia.schneider@email.de',
    password: 'test123',
    first_name: 'Julia',
    last_name: 'Schneider',
    phone: '+49 171 2345678',
    location: 'München',
    experience: 3,
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
    availability: '2025-03-01'
  },
  {
    email: 'thomas.mueller@email.de',
    password: 'test123',
    first_name: 'Thomas',
    last_name: 'Müller',
    phone: '+49 172 3456789',
    location: 'Hamburg',
    experience: 7,
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Microservices', 'Azure'],
    availability: 'Ab sofort'
  },
  {
    email: 'lisa.wagner@email.de',
    password: 'test123',
    first_name: 'Lisa',
    last_name: 'Wagner',
    phone: '+49 173 4567890',
    location: 'Frankfurt',
    experience: 4,
    skills: ['Vue.js', 'TypeScript', 'GraphQL', 'MongoDB', 'Docker'],
    availability: '2025-02-15'
  },
  {
    email: 'daniel.becker@email.de',
    password: 'test123',
    first_name: 'Daniel',
    last_name: 'Becker',
    phone: '+49 174 5678901',
    location: 'Köln',
    experience: 6,
    skills: ['C#', '.NET', 'Azure', 'SQL Server', 'REST API'],
    availability: 'Ab sofort'
  }
];

const admin = {
  email: 'admin@mysync.de',
  password: 'admin123'
};

// Utility-Funktionen
async function cleanDatabase() {
  log.warn('Bereinige Datenbank...');
  
  // Reihenfolge beachten wegen Foreign Keys
  const tables = [
    'candidate_matches',
    'invitations',
    'candidate_skills',
    'job_postings',
    'candidates',
    'companies',
    'profiles'
  ];

  for (const table of tables) {
    // Use a simple delete all for most tables
    const { error } = await supabase
      .from(table)
      .delete()
      .gte('created_at', '2000-01-01'); // This ensures we delete all rows
      
    if (error) {
      log.warn(`Fehler beim Bereinigen von ${table}: ${error.message}`);
    }
  }
  
  // Optionally clean auth users (careful with this!)
  const args = process.argv.slice(2);
  if (args.includes('--clean-auth')) {
    log.warn('Lösche auch Auth-Benutzer...');
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (users?.users) {
      for (const user of users.users) {
        // Don't delete your own admin user if you're logged in
        if (user.email !== 'your-admin@email.com') {
          const { error } = await supabase.auth.admin.deleteUser(user.id);
          if (error) {
            log.warn(`Fehler beim Löschen von Auth-User ${user.email}: ${error.message}`);
          }
        }
      }
    }
  }
  
  log.info('Datenbank bereinigt');
}

async function createUser(email: string, password: string, role: string) {
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
      log.error(`Fehler beim Erstellen von User ${email}: ${authError.message}`);
      return null;
    }
    
    userId = authData.user.id;
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

  return userId;
}

async function seedSkills() {
  log.info('Erstelle Skills...');
  
  for (const skill of skills) {
    const { error } = await supabase
      .from('skills')
      .upsert({ name: skill }, { onConflict: 'name' });
    
    if (error) {
      log.warn(`Skill ${skill} existiert bereits oder Fehler: ${error.message}`);
    }
  }
  
  log.success(`${skills.length} Skills erstellt`);
}

async function seedCompanies() {
  log.info('Erstelle Unternehmen...');
  
  for (const company of companies) {
    const userId = await createUser(company.email, company.password, 'company');
    if (!userId) continue;

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingCompany) {
      log.warn(`Unternehmen ${company.name} existiert bereits`);
      continue;
    }

    const { error } = await supabase
      .from('companies')
      .insert({
        id: userId,
        name: company.name,
        website: company.website,
        address: company.address,
        contact_name: company.contact_name,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
        onboarding_status: 'completed',
        onboarding_progress: 100
      });

    if (error) {
      log.error(`Fehler beim Erstellen von Unternehmen ${company.name}: ${error.message}`);
    } else {
      log.success(`Unternehmen ${company.name} erstellt`);
    }
  }
}

async function seedCandidates() {
  log.info('Erstelle Kandidaten...');
  
  for (const candidate of candidates) {
    const userId = await createUser(candidate.email, candidate.password, 'candidate');
    if (!userId) continue;

    // Check if candidate already exists
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingCandidate) {
      log.warn(`Kandidat ${candidate.email} existiert bereits`);
      continue;
    }

    const { error: candidateError } = await supabase
      .from('candidates')
      .insert({
        id: userId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        experience: candidate.experience,
        availability: candidate.availability,
        status: 'active'
      });

    if (candidateError) {
      log.error(`Fehler beim Erstellen von Kandidat ${candidate.email}: ${candidateError.message}`);
      continue;
    }

    // Füge Skills hinzu
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name')
      .in('name', candidate.skills);

    if (skillsData) {
      const candidateSkills = skillsData.map(skill => ({
        candidate_id: userId,
        skill_id: skill.id,
        level: Math.floor(Math.random() * 3) + 3 // Random level 3-5
      }));

      await supabase.from('candidate_skills').insert(candidateSkills);
    }

    log.success(`Kandidat ${candidate.first_name} ${candidate.last_name} erstellt`);
  }
}

async function seedJobPostings() {
  log.info('Erstelle Stellenausschreibungen...');
  
  const jobPostings = [
    {
      company_email: 'hr@techcorp.de',
      title: 'Senior Frontend Developer',
      description: 'Wir suchen einen erfahrenen Frontend-Entwickler für unser Team in Berlin.',
      requirements: {
        requiredSkills: [
          { name: 'React', level: 4, required: true },
          { name: 'TypeScript', level: 3, required: true },
          { name: 'CSS3', level: 4, required: true }
        ],
        preferredSkills: [
          { name: 'Next.js', level: 3, required: false },
          { name: 'GraphQL', level: 2, required: false }
        ],
        experience: 5,
        location: 'Berlin'
      },
      location: 'Berlin',
      salary_range: '60.000 - 80.000 EUR'
    },
    {
      company_email: 'jobs@innovate.de',
      title: 'Full Stack Developer',
      description: 'Innovative Projekte in einem dynamischen Umfeld erwarten dich.',
      requirements: {
        requiredSkills: [
          { name: 'JavaScript', level: 4, required: true },
          { name: 'Node.js', level: 3, required: true },
          { name: 'PostgreSQL', level: 3, required: true }
        ],
        preferredSkills: [
          { name: 'Docker', level: 2, required: false },
          { name: 'AWS', level: 2, required: false }
        ],
        experience: 3,
        location: 'Düsseldorf'
      },
      location: 'Düsseldorf',
      salary_range: '50.000 - 70.000 EUR'
    },
    {
      company_email: 'recruiting@digital.de',
      title: 'DevOps Engineer',
      description: 'Gestalte unsere Cloud-Infrastruktur und CI/CD-Prozesse.',
      requirements: {
        requiredSkills: [
          { name: 'Kubernetes', level: 4, required: true },
          { name: 'Docker', level: 4, required: true },
          { name: 'Terraform', level: 3, required: true }
        ],
        preferredSkills: [
          { name: 'AWS', level: 3, required: false },
          { name: 'Python', level: 2, required: false }
        ],
        experience: 4,
        location: 'München'
      },
      location: 'München',
      salary_range: '65.000 - 85.000 EUR'
    }
  ];

  for (const job of jobPostings) {
    // Finde die Company ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'company')
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('contact_email', job.company_email.replace('hr@', 'anna.schmidt@').replace('jobs@', 'thomas.weber@').replace('recruiting@', 'sarah.meyer@'))
      .single();

    if (!company) {
      log.warn(`Unternehmen für ${job.company_email} nicht gefunden`);
      continue;
    }

    const { error } = await supabase
      .from('job_postings')
      .insert({
        company_id: company.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        salary_range: job.salary_range,
        status: 'open'
      });

    if (error) {
      log.error(`Fehler beim Erstellen von Stelle ${job.title}: ${error.message}`);
    } else {
      log.success(`Stelle ${job.title} erstellt`);
    }
  }
}

async function seedAdmin() {
  log.info('Erstelle Admin-User...');
  
  const userId = await createUser(admin.email, admin.password, 'admin');
  if (userId) {
    log.success('Admin-User erstellt');
  }
}

async function runMatching() {
  log.info('Führe Matching durch...');
  
  // Hole alle Kandidaten und Stellen
  const { data: candidatesData } = await supabase
    .from('candidates')
    .select('id');
  
  const { data: jobsData } = await supabase
    .from('job_postings')
    .select('id');

  if (!candidatesData || !jobsData) {
    log.warn('Keine Kandidaten oder Stellen gefunden');
    return;
  }

  // Simuliere einige Matches
  let matchCount = 0;
  for (const candidate of candidatesData) {
    for (const job of jobsData) {
      // Zufälliger Match-Score zwischen 60 und 95
      const matchScore = Math.floor(Math.random() * 35) + 60;
      
      if (matchScore > 70) { // Nur gute Matches speichern
        const { error } = await supabase
          .from('candidate_matches')
          .insert({
            candidate_id: candidate.id,
            job_posting_id: job.id,
            match_score: matchScore,
            match_details: {
              skillMatches: [
                { skill: 'JavaScript', required: true, level: 4, match: true, score: 80 },
                { skill: 'React', required: true, level: 3, match: true, score: 75 }
              ],
              experienceMatch: matchScore - 5,
              locationMatch: Math.random() > 0.3,
              availabilityMatch: Math.random() > 0.2,
              totalScore: matchScore
            },
            status: 'pending'
          });
        
        if (!error) matchCount++;
      }
    }
  }
  
  log.success(`${matchCount} Matches erstellt`);
}

async function seedInvitations() {
  log.info('Erstelle Einladungen...');
  
  // Hole einige Matches
  const { data: matches } = await supabase
    .from('candidate_matches')
    .select(`
      candidate_id, 
      job_posting_id, 
      job_postings!inner(company_id)
    `)
    .eq('status', 'pending')
    .limit(5);

  if (!matches) return;

  for (const match of matches) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
    
    const { error } = await supabase
      .from('invitations')
      .insert({
        company_id: (match as any).job_postings.company_id,
        candidate_id: match.candidate_id,
        job_id: match.job_posting_id,
        proposed_at: futureDate.toISOString(),
        location: 'Online (Teams)',
        message: 'Wir würden Sie gerne zu einem Vorstellungsgespräch einladen.',
        status: 'pending'
      });

    if (!error) {
      // Update Match-Status
      await supabase
        .from('candidate_matches')
        .update({ status: 'contacted' })
        .eq('candidate_id', match.candidate_id)
        .eq('job_posting_id', match.job_posting_id);
    }
  }
  
  log.success('Einladungen erstellt');
}

// Hauptfunktion
async function main() {
  const args = process.argv.slice(2);
  const isClean = args.includes('--clean');
  const isDev = args.includes('--dev');

  console.log('\n🌱 mySync Database Seeding\n');

  try {
    if (isClean) {
      await cleanDatabase();
    }

    // Basis-Daten
    await seedSkills();
    await seedCompanies();
    await seedCandidates();
    await seedAdmin();
    await seedJobPostings();

    // Matching und Einladungen
    await runMatching();
    await seedInvitations();

    console.log('\n✅ Seeding erfolgreich abgeschlossen!\n');
    console.log('Test-Zugänge:');
    console.log('-------------');
    console.log('Admin:     admin@mysync.de / admin123');
    console.log('Company:   hr@techcorp.de / test123');
    console.log('Kandidat:  max.mustermann@email.de / test123');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Fehler beim Seeding:', error);
    process.exit(1);
  }
}

// Script ausführen
main(); 