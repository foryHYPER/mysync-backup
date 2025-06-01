# Datenbank-Migrationen

## 📋 Übersicht

Diese Dokumentation beschreibt alle notwendigen Datenbank-Migrationen für MySync Dashboard.

## 🗃️ Migration-Übersicht

### Aktuelle Datenbankstruktur
```
MySync Database Schema:
├── 👥 profiles - Benutzer-Profile
├── 👤 candidates - Kandidaten-Details
├── 🏢 companies - Unternehmen-Details  
├── 🏊‍♂️ pools - Kandidaten-Pools
├── 📋 pool_candidates - Pool-Zuweisungen
├── 🔗 pool_company_access - Unternehmen-Zugang
└── 📄 resumes - Lebenslauf-Management (NEU!)
```

## 🚀 Vollständige Installation

### Option 1: Automatische Migration (Empfohlen)
```bash
# 1. Supabase-Migration ausführen
cd supabase
npx supabase db reset

# 2. Oder manuell einzelne Migration
npx supabase migration up
```

### Option 2: Manuelle SQL-Ausführung
Kopiere und führe die folgenden SQL-Blöcke in deiner Supabase SQL Console aus:

## 📄 1. Resume-System Migration

### Resumes-Tabelle erstellen
```sql
-- Resume Management Implementation
-- Erstellt die resumes-Tabelle und alle notwendigen Policies

-- 1. Resumes-Tabelle erstellen
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','rejected','under_review')),
  quality_score INTEGER DEFAULT 0 
    CHECK (quality_score >= 0 AND quality_score <= 100),
  skills_extracted JSONB DEFAULT '[]',
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  education_level TEXT,
  languages JSONB DEFAULT '[]',
  analysis_complete BOOLEAN DEFAULT FALSE,
  reviewer_notes TEXT,
  download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
  match_count INTEGER DEFAULT 0 CHECK (match_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_resumes_quality_score ON resumes(quality_score);

-- 3. Row Level Security aktivieren
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies erstellen
-- Admins können alle Resumes verwalten
CREATE POLICY resumes_admin_all ON resumes 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Kandidaten können ihre eigenen Resumes verwalten
CREATE POLICY resumes_candidate_own ON resumes 
  FOR ALL 
  TO authenticated
  USING (candidate_id = auth.uid()) 
  WITH CHECK (candidate_id = auth.uid());

-- Unternehmen können genehmigte Resumes ansehen
CREATE POLICY resumes_company_view ON resumes 
  FOR SELECT 
  TO authenticated
  USING (
    status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'company'
    )
  );
```

### Storage-Bucket und Policies
```sql
-- 5. Storage-Bucket für Resume-Dateien erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- 6. Storage-Policies erstellen
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() 
       AND profiles.role = 'admin'
     ))
  );

CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Test-Daten erstellen
```sql
-- 7. Test-Daten für Resumes (optional)
INSERT INTO resumes (candidate_id, filename, file_url, file_size, status, quality_score, skills_extracted, experience_years, education_level, languages, analysis_complete)
SELECT 
  c.id as candidate_id,
  COALESCE(c.first_name, 'Resume') || '_' || COALESCE(c.last_name, 'Candidate') || '_CV.pdf' as filename,
  'resumes/' || c.id || '/cv.pdf' as file_url,
  (RANDOM() * 5000000 + 100000)::BIGINT as file_size,
  (ARRAY['pending', 'approved', 'rejected', 'under_review'])[FLOOR(RANDOM() * 4 + 1)] as status,
  (RANDOM() * 100 + 1)::INTEGER as quality_score,
  '["JavaScript", "React", "Node.js", "Python"]'::JSONB as skills_extracted,
  (RANDOM() * 20 + 1)::INTEGER as experience_years,
  (ARRAY['Bachelor', 'Master', 'PhD', 'Ausbildung'])[FLOOR(RANDOM() * 4 + 1)] as education_level,
  '["Deutsch", "Englisch"]'::JSONB as languages,
  RANDOM() > 0.3 as analysis_complete
FROM candidates c
WHERE NOT EXISTS (
  SELECT 1 FROM resumes r WHERE r.candidate_id = c.id
)
LIMIT 10;
```

## 🏊‍♂️ 2. Pool-System (Bereits implementiert)

### Existierende Tabellen prüfen
```sql
-- Prüfen ob Pool-Tabellen existieren
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pools', 'pool_candidates', 'pool_company_access');
```

Falls Pool-Tabellen fehlen, siehe `supabase/migrations/20250601205717_create_resumes_table.sql`

## 👥 3. Benutzer-System (Bereits implementiert)

### Admin-Benutzer erstellen
```sql
-- Admin-Benutzer erstellen (falls nicht vorhanden)
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  'admin-uuid-here',
  'admin@example.com',
  'admin',
  'System',
  'Administrator'
) ON CONFLICT (id) DO NOTHING;
```

## 🔧 Migration-Scripts

### NPM-Scripts verwenden
```bash
# Resume-System setup
npm run setup-resumes

# Test-Companies erstellen
npm run seed-companies

# Pool-System testen
npm run test-pool-routes
```

### Verfügbare Scripts
| Script | Beschreibung | Status |
|--------|--------------|--------|
| `setup-resumes` | Resume-Tabelle und Storage setup | ✅ Aktiv |
| `seed-companies` | Test-Unternehmen erstellen | ✅ Aktiv |  
| `seed-companies:clean` | Unternehmen löschen und neu erstellen | ✅ Aktiv |

## 🔍 Migration-Verifikation

### 1. Tabellen prüfen
```sql
-- Alle Tabellen auflisten
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resumes-Tabelle spezifisch prüfen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resumes'
ORDER BY ordinal_position;
```

### 2. RLS-Policies prüfen
```sql
-- Alle Policies auflisten
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Storage-Bucket prüfen
```sql
-- Storage-Buckets anzeigen
SELECT * FROM storage.buckets;

-- Storage-Policies prüfen  
SELECT * FROM storage.policies WHERE bucket_id = 'resumes';
```

## 🚨 Troubleshooting

### Häufige Probleme

#### 1. Resumes-Tabelle existiert nicht
```bash
# Lösung: Script ausführen
npm run setup-resumes

# Oder manuell SQL ausführen (siehe oben)
```

#### 2. Storage-Bucket fehlt
```sql
-- Storage-Bucket manuell erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 10485760, 
        ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
```

#### 3. RLS-Policies blockieren Zugriff
```sql
-- Temporär RLS deaktivieren (nur für Debug!)
ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;

-- Nach Debug wieder aktivieren
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
```

#### 4. Migration schlägt fehl
```bash
# Lokale Supabase resetzen
npx supabase db reset

# Oder einzelne Migration wiederholen
npx supabase migration repair <migration_version>
```

## 📁 Migration-Dateien

### Aktuelle Migrations
- `supabase/migrations/20250601205717_create_resumes_table.sql` - Resume-System
- `scripts/fix-resumes-implementation.sql` - Legacy Script (deprecated)
- `scripts/setup-resumes-database.ts` - TypeScript Setup-Script

### Legacy Scripts (können gelöscht werden)
- `scripts/create-resumes-table-simple.ts` - Veraltet
- `scripts/fix-candidates-rls.sql` - In Haupt-Migration integriert
- `scripts/fix-companies-rls.sql` - In Haupt-Migration integriert
- `scripts/setup-pools.sql` - In Haupt-Migration integriert

## 🔄 Rollback-Prozeduren

### Resume-System rollback
```sql
-- Resumes-Tabelle entfernen
DROP TABLE IF EXISTS resumes CASCADE;

-- Storage-Bucket entfernen
DELETE FROM storage.buckets WHERE id = 'resumes';

-- Storage-Policies entfernen
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
```

## 📊 Migration-Status

### Aktueller Stand (Dezember 2024)
- ✅ **Basis-Schema** - Profiles, Candidates, Companies
- ✅ **Pool-System** - Pools, Assignments, Company Access
- ✅ **Resume-System** - Uploads, Storage, Analysis
- ✅ **Security** - RLS Policies für alle Tabellen
- ✅ **Performance** - Indexes und Optimierungen

### Nächste Schritte
- 📧 **E-Mail-System** - Notification-Tabellen
- 🤖 **KI-Integration** - ML-Models für Matching
- 📱 **Mobile-Support** - Push-Notification-Setup

---

**Migrations Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 