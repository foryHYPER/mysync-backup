# Admin-System Dokumentation

## 📋 Übersicht

Das Admin-System ist die zentrale Verwaltungsschnittstelle für MySync. Administratoren haben vollständigen Zugang zu allen Systemfunktionen.

## 🎯 Admin-Dashboard Features

### 1. 🏊‍♂️ Pool-Management
- **Pools erstellen/bearbeiten** - Neue Kandidaten-Pools anlegen
- **Pool-Zuweisungen** - Kandidaten zu Pools zuweisen
- **Unternehmens-Zugang** - Firmen Zugang zu Pools gewähren
- **Pool-Analytics** - Detaillierte Metriken und Reports

### 2. 📄 Lebenslauf-Management (NEU!)
- **Resume-Übersicht** - Alle hochgeladenen Lebensläufe verwalten
- **Qualitätskontrolle** - Lebensläufe bewerten und freigeben
- **Download-Funktion** - PDF-Lebensläufe herunterladen
- **Analyse-Tools** - Skills-Extraktion und Bewertung

### 3. 👥 Benutzer-Management
- **Kandidaten verwalten** - Profile, Skills, Status
- **Unternehmen verwalten** - Firmendaten, Kontakte
- **Rollen-Zuweisung** - Admin/Company/Candidate Rollen
- **Benutzer-Analytics** - Aktivitäts-Tracking

### 4. 📊 Analytics & Reporting
- **Pool-Performance** - Erfolgsmetriken pro Pool
- **Matching-Statistiken** - Kandidaten-Unternehmen Matches
- **System-Metriken** - Nutzungsstatistiken
- **Export-Funktionen** - Daten-Export für Reports

## 🔗 Navigation

### Haupt-Menü
```
/dashboard/admin/
├── 📊 Dashboard (Übersicht)
├── 🏊‍♂️ Pools
│   ├── Pools-Übersicht
│   ├── Pool-Details
│   └── Zuweisungen
├── 👥 Kandidaten
├── 🏢 Unternehmen
├── 📄 Lebensläufe (NEU!)
├── 📊 Analytics
└── ⚙️ Einstellungen
```

## 🎯 Wichtige URLs

| Feature | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | `/dashboard/admin` | Haupt-Dashboard |
| **Pools** | `/dashboard/admin/pools` | Pool-Verwaltung |
| **Pool-Details** | `/dashboard/admin/pools/[id]` | Einzelner Pool |
| **Zuweisungen** | `/dashboard/admin/pools/assignments` | Pool-Zuweisungen |
| **Kandidaten** | `/dashboard/admin/candidates` | Kandidaten-Liste |
| **Unternehmen** | `/dashboard/admin/companies` | Unternehmen-Liste |
| **Lebensläufe** | `/dashboard/admin/resumes` | Resume-Management |
| **Pool erstellen** | `/dashboard/admin/pools/create` | Neuen Pool anlegen |

## ✨ Neue Features (v1.0)

### 📄 Resume-Management System
Das neue Lebenslauf-Management ermöglicht:

#### **Admin-Funktionen:**
- ✅ **Alle Lebensläufe einsehen** - Zentrale Übersicht
- ✅ **Qualitäts-Bewertung** - Score von 1-100
- ✅ **Status-Management** - Pending/Approved/Rejected/Under Review
- ✅ **Download-Funktion** - PDF-Downloads für echte Dateien
- ✅ **Skills-Analyse** - Automatische Skill-Extraktion
- ✅ **Filter & Suche** - Nach Status, Qualität, Kandidat
- ✅ **Bulk-Aktionen** - Mehrere Lebensläufe gleichzeitig bearbeiten

#### **Metriken & Analytics:**
- 📊 **Gesamt-Lebensläufe** - Anzahl aller Uploads
- ⏳ **Pending Review** - Wartende Bewertungen
- ✅ **Approved** - Genehmigte Lebensläufe
- ❌ **Rejected** - Abgelehnte Lebensläufe
- ⭐ **Durchschnittliche Qualität** - Quality Score
- 📥 **Download-Statistiken** - Zugriffs-Tracking

## 🔧 Setup & Konfiguration

### 1. Admin-Benutzer erstellen
```sql
-- Admin-Benutzer in Supabase erstellen
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  'admin-user-id',
  'admin@example.com',
  'admin',
  'System',
  'Administrator'
);
```

### 2. Berechtigungen prüfen
Das Admin-System nutzt Row Level Security (RLS) Policies:
- ✅ Admin kann alle Daten einsehen und bearbeiten
- ✅ Sichere Authentifizierung erforderlich
- ✅ Rolle "admin" in profiles-Tabelle erforderlich

### 3. Datenbank-Setup
Für Resume-Management muss die `resumes`-Tabelle existieren:
```bash
# Script ausführen um resumes-Tabelle zu erstellen
npm run setup-resumes
```

## 🚀 Häufige Admin-Aufgaben

### Pool-Management
1. **Neuen Pool erstellen**
   - Zu `/dashboard/admin/pools/create`
   - Pool-Details eingeben
   - Kandidaten zuweisen

2. **Unternehmen Zugang gewähren**
   - Pool-Details öffnen
   - "Neue Zuweisung" klicken
   - Unternehmen auswählen, Access Level setzen

3. **Pool-Performance überwachen**
   - Pool-Analytics in Dashboard
   - Erfolgsmetriken prüfen
   - Reports generieren

### Resume-Management
1. **Lebensläufe überprüfen**
   - Zu `/dashboard/admin/resumes`
   - Nach Status filtern (pending)
   - Qualität bewerten

2. **Lebenslauf genehmigen/ablehnen**
   - Lebenslauf in Liste öffnen
   - "Genehmigen" oder "Ablehnen"
   - Optional: Reviewer-Notizen hinzufügen

3. **Bulk-Aktionen**
   - Mehrere Lebensläufe auswählen
   - Bulk-Aktion wählen
   - Bestätigen

## 📊 KPIs & Metriken

### Pool-Performance
- **Aktive Pools:** Anzahl verfügbarer Pools
- **Zugewiesene Kandidaten:** Gesamtzahl Assignments
- **Unternehmen-Zugriffe:** Aktive Company Access
- **Successful Matches:** Kontakte/Einstellungen

### Resume-Qualität
- **Durchschnittlicher Quality Score:** Gesamt-Bewertung
- **Approval Rate:** % genehmigte Lebensläufe
- **Review Time:** Durchschnittliche Bearbeitungszeit
- **Download Rate:** % heruntergeladene Lebensläufe

## 🔒 Sicherheit

### Zugangskontrollen
- ✅ **Zwei-Faktor-Authentifizierung** empfohlen
- ✅ **Starke Passwort-Richtlinien**
- ✅ **Session-Management** - Automatisches Logout
- ✅ **Audit-Logging** - Alle Admin-Aktionen werden geloggt

### Datenenschutz
- ✅ **DSGVO-konform** - Datenschutz-Compliance
- ✅ **Minimale Datenspeicherung** - Nur notwendige Daten
- ✅ **Sichere Backups** - Verschlüsselte Datensicherung
- ✅ **Löschungsrecht** - Daten-Löschung auf Anfrage

## 🆘 Troubleshooting

### Häufige Probleme

1. **Kann keine Lebensläufe sehen**
   - Prüfen ob `resumes`-Tabelle existiert
   - RLS-Policies für Admin-Rolle prüfen
   - Browser-Cache leeren

2. **Download funktioniert nicht**
   - Storage-Bucket "resumes" prüfen
   - Storage-Policies überprüfen
   - Datei-Existenz in Supabase Storage

3. **Pool-Zuweisungen funktionieren nicht**
   - Kandidaten-Existenz prüfen
   - Pool-Status überprüfen
   - RLS-Policies für pool_candidates

### Debug-Scripts
```bash
# Pool-System testen
npm run test-pool-routes

# Datenbank-Status prüfen
npx tsx scripts/debug-pool-companies.ts

# Resume-System prüfen
npx tsx scripts/create-resumes-table-simple.ts
```

## 📞 Support

Bei Admin-spezifischen Problemen:
1. **[Pool-Management Docs](./pool-management.md)** - Detaillierte Pool-Verwaltung
2. **[Resume-Management Docs](./resume-management.md)** - Lebenslauf-Verwaltung
3. **[User-Management Docs](./user-management.md)** - Benutzer-Verwaltung
4. **[Troubleshooting](../deployment/troubleshooting.md)** - Technische Probleme

---

**Admin-System Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 