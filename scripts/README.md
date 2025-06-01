# Scripts Dokumentation

## 📋 Übersicht

Dieses Verzeichnis enthält alle wichtigen Scripts für Setup, Wartung und Testing von MySync.

## 🚀 Setup Scripts

### 1. Resume-System Setup
```bash
# Resume-Management einrichten
npm run setup-resumes
# → Führt scripts/setup-resumes-database.ts aus
```

**Was passiert:**
- ✅ Erstellt `resumes` Tabelle
- ✅ Konfiguriert Storage-Bucket
- ✅ Setzt RLS-Policies
- ✅ Erstellt Test-Daten

### 2. Test-Unternehmen erstellen
```bash
# Unternehmen und Pools erstellen
npm run seed-companies

# Oder mit cleanup (löscht erst alte Daten)
npm run seed-companies:clean
```

**Was passiert:**
- ✅ Erstellt Test-Unternehmen
- ✅ Konfiguriert Company-Profile
- ✅ Erstellt Pool-Zuweisungen
- ✅ Fügt Test-Kandidaten hinzu

## 🔧 Wartungs-Scripts

### 1. Pool-System testen
```bash
# Pool-Routes und Funktionalität testen
npx tsx scripts/test-pool-routes.ts
```

### 2. Debug Scripts
```bash
# Pool-Candidates Debug
npx tsx scripts/debug-pool-candidates.ts

# Pool-Companies Debug  
npx tsx scripts/debug-pool-companies.ts
```

### 3. Pool-Daten hinzufügen
```bash
# Test-Pool-Daten erstellen
npx tsx scripts/add-test-pool-data.ts
```

## 📊 Aktuelle Scripts-Übersicht

| Script | Beschreibung | Zweck | Status |
|--------|--------------|--------|--------|
| **setup-resumes-database.ts** | Resume-System Setup | Setup | ✅ Aktiv |
| **seed-test-companies.ts** | Test-Unternehmen erstellen | Setup | ✅ Aktiv |
| **test-pool-routes.ts** | Pool-System Testing | Testing | ✅ Aktiv |
| **add-test-pool-data.ts** | Pool-Test-Daten | Setup | ✅ Aktiv |
| **debug-pool-candidates.ts** | Pool-Kandidaten Debug | Debug | ✅ Aktiv |
| **debug-pool-companies.ts** | Pool-Unternehmen Debug | Debug | ✅ Aktiv |

## 🔍 Script-Details

### setup-resumes-database.ts
**Zweck:** Vollständiges Resume-System Setup

**Features:**
- Resumes-Tabelle mit vollständigem Schema
- Storage-Bucket "resumes" mit 10MB Limit
- RLS-Policies für Admin/Candidate/Company Zugriff
- Storage-Policies für sichere Datei-Zugriffe
- Test-Daten für Entwicklung

**Verwendung:**
```bash
npm run setup-resumes

# Oder direkt:
npx tsx scripts/setup-resumes-database.ts
```

### seed-test-companies.ts
**Zweck:** Test-Umgebung mit Unternehmen aufsetzen

**Features:**
- Deutsche Test-Unternehmen erstellen
- Company-Profile mit realistischen Daten
- Pool-Zuweisungen für Testing
- Kandidaten-Pool-Assignments

**Verwendung:**
```bash
# Normale Seed-Operation
npm run seed-companies

# Mit Cleanup (löscht existierende Daten)
npm run seed-companies:clean
```

### test-pool-routes.ts
**Zweck:** Pool-System Funktionalität testen

**Features:**
- API-Routes testen
- Datenbank-Queries validieren
- Pool-Assignments prüfen
- Company-Access validieren

**Verwendung:**
```bash
npx tsx scripts/test-pool-routes.ts
```

### add-test-pool-data.ts
**Zweck:** Pool-Test-Daten erstellen

**Features:**
- Kandidaten-Pools erstellen
- Pool-Assignments hinzufügen
- Company-Access konfigurieren
- Test-Szenarien aufbauen

**Verwendung:**
```bash
npx tsx scripts/add-test-pool-data.ts
```

### debug-pool-candidates.ts
**Zweck:** Pool-Kandidaten Debugging

**Features:**
- Pool-Candidate-Zuweisungen prüfen
- Datenbank-Inkonsistenzen finden
- Candidate-Pool-Beziehungen validieren

**Verwendung:**
```bash
npx tsx scripts/debug-pool-candidates.ts
```

### debug-pool-companies.ts
**Zweck:** Pool-Unternehmen Debugging

**Features:**
- Company-Pool-Access prüfen
- Berechtigungen validieren
- Access-Level Probleme diagnostizieren

**Verwendung:**
```bash
npx tsx scripts/debug-pool-companies.ts
```

## 🎯 Häufige Aufgaben

### 1. Frische Entwicklungsumgebung aufsetzen
```bash
# 1. Datenbank aufsetzen
npm run setup-resumes

# 2. Test-Daten erstellen
npm run seed-companies

# 3. Pool-Daten hinzufügen
npx tsx scripts/add-test-pool-data.ts

# 4. System testen
npx tsx scripts/test-pool-routes.ts
```

### 2. Resume-System zurücksetzen
```bash
# In Supabase Dashboard > SQL Editor:
DROP TABLE IF EXISTS resumes CASCADE;
DELETE FROM storage.buckets WHERE id = 'resumes';

# Dann neu aufsetzen:
npm run setup-resumes
```

### 3. Test-Unternehmen neu erstellen
```bash
# Alte Daten löschen und neu erstellen
npm run seed-companies:clean
```

### 4. Pool-System debuggen
```bash
# Candidates-Zuweisungen prüfen
npx tsx scripts/debug-pool-candidates.ts

# Company-Access prüfen
npx tsx scripts/debug-pool-companies.ts

# Pool-Routes testen
npx tsx scripts/test-pool-routes.ts
```

## 🔒 Sicherheitshinweise

### Environment Variables
Scripts benötigen folgende Umgebungsvariablen:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Permissions
- Scripts verwenden Service Role Key (Full Access)
- Niemals in Production verwenden ohne Review
- Test-Daten nur in Development/Staging

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. "exec_sql function not found"
```
Problem: RPC-Funktion nicht verfügbar
Lösung: Scripts verwenden direkte Supabase-Client Calls
Status: Bereits in allen Scripts behoben
```

#### 2. "Permission denied for table"
```
Problem: Service Role Key fehlt oder falsch
Lösung: .env.local prüfen, korrekten Key einsetzen
```

#### 3. "Storage bucket already exists"
```
Problem: Bucket existiert bereits
Lösung: Normal - Scripts verwenden ON CONFLICT DO NOTHING
```

#### 4. "Cannot connect to Supabase"
```
Problem: URLs oder Keys falsch
Lösung: Umgebungsvariablen prüfen
```

### Debug-Commands
```bash
# Test Environment Variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test Supabase Connection
npx tsx scripts/debug-pool-companies.ts

# Check Database Status
npx tsx scripts/test-pool-routes.ts

# Check Pool Data
npx tsx scripts/debug-pool-candidates.ts
```

## 📝 Script-Entwicklung

### Script-Template
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function yourFunction() {
  console.log('\n🚀 Starting your script...\n');
  
  try {
    // Your logic here
    
    console.log('✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run script
if (require.main === module) {
  yourFunction().catch(console.error);
}
```

### Neue Scripts hinzufügen
1. TypeScript-Datei in `scripts/` erstellen
2. Template verwenden (siehe oben)
3. Error-Handling implementieren
4. NPM-Script in `package.json` hinzufügen (falls nötig)
5. Dokumentation hier ergänzen

## 🗂️ Entfernte Scripts

~~Die folgenden Scripts wurden erfolgreich aufgeräumt:~~
- ~~`package-scripts.json`~~ → NPM Scripts in main package.json
- ~~`create-test-companies.sql`~~ → `seed-test-companies.ts`
- ~~`ensure-admin-user.sql`~~ → Supabase Migration
- ~~`fix-rls-policies.sql`~~ → Supabase Migration
- ~~`fix-pool-visibility.sql`~~ → Supabase Migration
- ~~`seed.ts`~~ → `seed-test-companies.ts`

---

**Scripts Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 