# Database Seeding für mySync

## Überblick

Dieses moderne Seed-System ermöglicht es, die mySync-Datenbank mit realistischen Testdaten zu befüllen.

## Voraussetzungen

1. **Supabase-Projekt** muss eingerichtet sein
2. **Umgebungsvariablen** müssen gesetzt sein:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Für Admin-Operationen
   ```

3. **Datenbank-Schema** muss angewendet sein (siehe `/docs/database.md`)

## Installation

```bash
npm install
```

## Verwendung

### Standard-Seeding
```bash
npm run seed
```
Fügt Testdaten zur bestehenden Datenbank hinzu.

### Clean Seeding
```bash
npm run seed:clean
```
Bereinigt die Datenbank vor dem Seeding (⚠️ Vorsicht: Löscht alle Daten!)

### Development Seeding
```bash
npm run seed:dev
```
Für zusätzliche Entwicklungsdaten (noch nicht implementiert).

## Was wird erstellt?

### 👥 Benutzer

#### Admin
- **Email:** admin@mysync.de
- **Passwort:** admin123

#### Unternehmen (3x)
- TechCorp GmbH (Berlin)
- Innovate Solutions AG (Düsseldorf)  
- Digital Dynamics GmbH (München)
- **Passwort:** test123 (für alle)

#### Kandidaten (5x)
- Max Mustermann (Berlin, 5 Jahre Erfahrung)
- Julia Schneider (München, 3 Jahre)
- Thomas Müller (Hamburg, 7 Jahre)
- Lisa Wagner (Frankfurt, 4 Jahre)
- Daniel Becker (Köln, 6 Jahre)
- **Passwort:** test123 (für alle)

### 💼 Weitere Daten

- **35+ Skills** (Frontend, Backend, DevOps, etc.)
- **3 Stellenausschreibungen**
- **Automatisches Matching** zwischen Kandidaten und Stellen
- **Interview-Einladungen** für Top-Matches

## Datenstruktur

```
Skills → Kandidaten → Kandidaten-Skills
      ↘             ↗
        Matches
      ↙             ↖
Unternehmen → Job-Postings

Matches → Einladungen
```

## Anpassung

Das Seed-Script (`/scripts/seed.ts`) ist modular aufgebaut:

- `skills[]` - Skills anpassen
- `companies[]` - Unternehmen hinzufügen
- `candidates[]` - Kandidaten erweitern
- `jobPostings[]` - Stellenausschreibungen ändern

## Fehlerbehandlung

Das Script zeigt farbcodierte Ausgaben:
- 🔵 Info (Cyan)
- ✅ Erfolg (Grün)
- ⚠️ Warnung (Gelb)
- ❌ Fehler (Rot)

## Best Practices

1. **Entwicklung:** Nutzen Sie `seed:clean` für einen sauberen Start
2. **Testing:** Normale `seed` für inkrementelle Tests
3. **Produktion:** NIEMALS in Produktion ausführen!

## Troubleshooting

### "Auth Admin API nicht aktiviert"
→ Aktivieren Sie die Auth Admin API in Ihrem Supabase-Dashboard

### "Permission denied"
→ Prüfen Sie den `SUPABASE_SERVICE_ROLE_KEY`

### "Skill existiert bereits"
→ Normal bei wiederholtem Seeding, kann ignoriert werden 