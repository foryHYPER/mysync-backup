# Development Setup

## 📋 Übersicht

Diese Anleitung beschreibt das Setup einer lokalen Entwicklungsumgebung für MySync Dashboard.

## 🎯 Voraussetzungen

### System-Requirements
- **Node.js** 18+ (empfohlen: 20.x)
- **npm** 9+ oder **yarn** 1.22+
- **Git** für Version Control
- **VS Code** (empfohlen) oder anderer Editor

### Cloud-Services
- **Supabase Account** - Database & Auth
- **Vercel Account** (optional) - Deployment

## 🚀 Quick Start

### 1. Repository klonen
```bash
# Repository klonen
git clone https://github.com/your-org/mysync-dashboard.git
cd mysync-dashboard

# Dependencies installieren
npm install
```

### 2. Environment Setup
```bash
# .env.local erstellen
cp .env.example .env.local
```

Environment Variables konfigurieren:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Datenbank Setup
```bash
# Resume-System einrichten
npm run setup-resumes

# Test-Unternehmen erstellen
npm run seed-companies
```

### 4. Development Server starten
```bash
# Development Server
npm run dev

# Öffne: http://localhost:3000
```

## 🗄️ Datenbank-Setup

### Supabase Projekt erstellen
1. **Account erstellen** - [supabase.com](https://supabase.com)
2. **Neues Projekt** - "MySync Dashboard"
3. **Region wählen** - EU (Frankfurt/Ireland)
4. **Projekt erstellen** - Warten auf Initialisierung

### Schema-Migration
```bash
# Option 1: Automatische Migration (wenn Supabase CLI setup)
cd supabase
npx supabase db reset

# Option 2: Manuelle SQL-Ausführung
# → Kopiere SQL aus docs/deployment/migrations.md
# → Führe in Supabase SQL Editor aus
```

### Test-Daten erstellen
```bash
# Resume-System setup
npm run setup-resumes

# Unternehmen und Pools
npm run seed-companies

# System testen
npx tsx scripts/test-pool-routes.ts
```

## 🔧 Development Workflow

### Branching Strategy
```bash
# Feature branch erstellen
git checkout -b feature/new-feature

# Entwicklung...
git add .
git commit -m "feat: add new feature"

# Push & Pull Request
git push origin feature/new-feature
```

### Code Standards
- **TypeScript** - Strenge Typisierung
- **ESLint** - Linting Rules
- **Prettier** - Code Formatting
- **Conventional Commits** - Commit Messages

### Development Commands
```bash
# Development Server
npm run dev

# Production Build
npm run build

# Type Checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Database Scripts
npm run setup-resumes
npm run seed-companies
npm run seed-companies:clean
```

## 📁 Projekt-Struktur

### Verzeichnis-Layout
```
mysync-dashboard/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 dashboard/          # Dashboard Routes
│   │   ├── 📁 admin/          # Admin Dashboard
│   │   ├── 📁 company/        # Company Dashboard
│   │   └── 📁 candidate/      # Candidate Dashboard
│   ├── 📁 auth/               # Authentication
│   └── 📄 layout.tsx          # Root Layout
├── 📁 components/             # Reusable Components
│   ├── 📁 ui/                 # Base UI Components
│   ├── 📁 forms/              # Form Components
│   └── 📁 dashboard/          # Dashboard Components
├── 📁 lib/                    # Utilities & Config
│   ├── 📄 supabase/           # Supabase Client
│   ├── 📄 utils.ts            # Helper Functions
│   └── 📄 validations.ts      # Form Validations
├── 📁 docs/                   # Documentation
│   ├── 📁 admin/              # Admin Docs
│   ├── 📁 company/            # Company Docs
│   ├── 📁 candidate/          # Candidate Docs
│   └── 📁 development/        # Dev Docs
├── 📁 scripts/                # Database Scripts
├── 📁 supabase/               # Supabase Config
│   └── 📁 migrations/         # Database Migrations
└── 📁 public/                 # Static Assets
```

### Key Files
- `app/layout.tsx` - Root Layout & Providers
- `components/ui/` - shadcn/ui Components
- `lib/supabase/` - Database Client Setup
- `scripts/` - Database Management
- `docs/` - Comprehensive Documentation

## 🛠️ Tools & Technologies

### Frontend Stack
- **Next.js 15** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component Library
- **Radix UI** - Headless Components

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security** - Data Protection
- **Storage** - File Management

### Development Tools
- **VS Code** - Code Editor
- **ESLint** - Code Linting
- **Prettier** - Code Formatting
- **tsx** - TypeScript Execution

## 🔒 Authentication & Permissions

### User Roles
- **Admin** - Full system access
- **Company** - Pool access & candidate browsing
- **Candidate** - Profile management & applications

### RLS Policies
Alle Tabellen verwenden Row Level Security:
- `profiles` - Benutzer-Profile
- `candidates` - Kandidaten-Details
- `companies` - Unternehmen-Details
- `pools` - Kandidaten-Pools
- `pool_candidates` - Pool-Zuweisungen
- `pool_company_access` - Unternehmen-Zugang
- `resumes` - Lebenslauf-Management

### Test-Accounts
```bash
# Nach seed-companies Script verfügbar:

# Admin Account
Email: admin@example.com
Password: admin123

# Company Account
Email: anna.schmidt@techcorp-solutions.de
Password: company123

# Candidate Account
# → Registrierung über /auth/signup
```

## 🐛 Debugging & Troubleshooting

### Häufige Probleme

#### 1. Supabase Connection Fehler
```bash
# Environment Variables prüfen
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Supabase Projekt Status prüfen
# → Supabase Dashboard > Settings > API
```

#### 2. Database Schema fehlt
```bash
# Manuell SQL ausführen
# → docs/deployment/migrations.md kopieren
# → Supabase SQL Editor verwenden

# Oder automatisch (wenn CLI setup)
npx supabase db reset
```

#### 3. Resume-System funktioniert nicht
```bash
# Resume-Setup erneut ausführen
npm run setup-resumes

# Oder manuell Script testen
npx tsx scripts/setup-resumes-database.ts
```

#### 4. Build Errors
```bash
# Dependencies aktualisieren
npm install

# Type Errors prüfen
npm run type-check

# Build testen
npm run build
```

### Debug Commands
```bash
# Pool-System testen
npx tsx scripts/test-pool-routes.ts

# Database Debug
npx tsx scripts/debug-pool-candidates.ts
npx tsx scripts/debug-pool-companies.ts

# Resume-System Debug
npx tsx scripts/create-resumes-table-simple.ts
```

## 📦 Package Management

### Key Dependencies
```json
{
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
    "@supabase/ssr": "^0.6.1",
    "@radix-ui/react-*": "Latest",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}
```

### Adding Dependencies
```bash
# UI Components
npm install @radix-ui/react-component-name

# Utilities
npm install package-name
npm install -D @types/package-name

# Update package.json scripts if needed
```

## 🚀 Deployment

### Vercel (Empfohlen)
```bash
# Vercel CLI installieren
npm install -g vercel

# Projekt deployen
vercel

# Environment Variables in Vercel Dashboard setzen
```

### Environment für Production
```env
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 📚 Weitere Ressourcen

### Dokumentation
- **[Admin Documentation](../admin/README.md)** - Admin-System
- **[Company Documentation](../company/README.md)** - Unternehmen-Features
- **[Candidate Documentation](../candidate/README.md)** - Kandidaten-Features
- **[Database Migrations](../deployment/migrations.md)** - Schema-Setup

### External Links
- **[Next.js Docs](https://nextjs.org/docs)** - Framework Documentation
- **[Supabase Docs](https://supabase.com/docs)** - Backend Documentation
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling Framework
- **[shadcn/ui](https://ui.shadcn.com)** - Component Library

---

**Development Setup Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 