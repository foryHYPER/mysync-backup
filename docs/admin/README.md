# Admin-System Dokumentation

## 📋 Übersicht

Das Admin-System ist die zentrale Verwaltungsschnittstelle für MySync. Administratoren haben vollständigen Zugang zu allen Systemfunktionen.

## 🎯 Admin-Dashboard Features

### 1. ��‍♂️ Pool-Management (v2.1.0) - **Erweitert!**
- **Pools erstellen/bearbeiten** - Erweiterte Pool-Verwaltung mit Limits
- **Pool-Zuweisungen** - Kandidaten mit automatischer Limit-Validierung
- **Unternehmens-Zugang** - Vollständiges Berechtigungsmanagement
- **Pool-Analytics** - Real-time Metriken und erweiterte Reports

#### **🔥 Neue Features in v2.1.0:**
- ✅ **Pool-Limit Validierung** - Automatische Prüfung beim Kandidaten hinzufügen
- ✅ **Erweiterte Pool-Bearbeitung** - Responsive Dialog (896px breit)
- ✅ **Unternehmensberechtigung-Management** - Vollständige CRUD-Funktionen
- ✅ **Live-Validierung** - Sofortige Rückmeldung bei Eingaben
- ✅ **Bulk-Operationen** - Effiziente Massenbearbeitung

### 2. 📄 Lebenslauf-Management
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
│   │   ├── Kandidaten-Tab        # Pool-Kandidaten verwalten
│   │   ├── Unternehmen-Tab       # Zugriffsberechtigungen (NEU!)
│   │   └── Analytics-Tab         # Statistiken und Reports
│   └── Zuweisungen
├── 👥 Kandidaten
├── 🏢 Unternehmen
├── 📄 Lebensläufe
├── 📊 Analytics
└── ⚙️ Einstellungen
```

## 🎯 Wichtige URLs

| Feature | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | `/dashboard/admin` | Haupt-Dashboard |
| **Pools** | `/dashboard/admin/pools` | Pool-Verwaltung |
| **Pool-Details** | `/dashboard/admin/pools/[id]` | Einzelner Pool mit erweiterten Features |
| **Zuweisungen** | `/dashboard/admin/pools/assignments` | Pool-Zuweisungen |
| **Kandidaten** | `/dashboard/admin/candidates` | Kandidaten-Liste |
| **Unternehmen** | `/dashboard/admin/companies` | Unternehmen-Liste |
| **Lebensläufe** | `/dashboard/admin/resumes` | Resume-Management |
| **Pool erstellen** | `/dashboard/admin/pools/create` | Neuen Pool anlegen |

## ✨ Neue Features (v2.1.0) - **Erweitert!**

### 🏊‍♂️ Erweitertes Pool-Management System

#### **Pool-Limit Validierung:**
```typescript
// Automatische Prüfung beim Kandidaten hinzufügen
if (pool?.max_candidates) {
  const totalAfterAdding = currentCandidates + newCandidates;
  
  if (totalAfterAdding > pool.max_candidates) {
    // Fehler: Pool-Limit erreicht
    showError(`Pool-Limit erreicht! Maximal ${pool.max_candidates} erlaubt.`);
    return;
  }
  
  if (totalAfterAdding > pool.max_candidates * 0.8) {
    // Warnung: Pool fast voll
    showWarning(`Pool ist fast voll! Noch ${remaining} Plätze verfügbar.`);
  }
}
```

#### **Erweiterte Pool-Bearbeitung:**
- 🔧 **Breiter Dialog** (896px statt 672px)
- 📱 **Scrollbar-Unterstützung** für kleine Bildschirme
- 🎨 **Zwei-Spalten Layout** für Pool-Typ und Status
- ✅ **Live-Validierung** mit farbkodiertem Feedback
- 📊 **Kontextuelle Informationen** über aktuellen Pool-Status

#### **🔥 Unternehmensberechtigung-Management (NEU!):**

**Drei Zugriffslevel:**
| Level | Berechtigung | Beschreibung |
|-------|-------------|--------------|
| **Anzeigen** | `view` | Nur Pool-Kandidaten ansehen |
| **Auswählen** | `select` | Kandidaten ansehen und auswählen |
| **Kontaktieren** | `contact` | Vollzugriff: ansehen, auswählen, kontaktieren |

**Verfügbare Aktionen:**
- ✅ **Berechtigung bearbeiten** - Zugriffslevel und Einstellungen ändern
- ✅ **Zugang entfernen** - Unternehmen komplett aus Pool entfernen
- ✅ **Ablaufdatum setzen** - Zeitlich begrenzten Zugang definieren
- ✅ **Notizen hinzufügen** - Interne Vermerke für Tracking

#### **Berechtigungs-Bearbeitungsdialog:**
```typescript
interface CompanyAccessEdit {
  access_level: "view" | "select" | "contact";
  expires_at: Date | null;  // null = unbegrenzt
  notes: string | null;     // Interne Vermerke
}
```

### 📄 Resume-Management System
Das bewährte Lebenslauf-Management mit:
- ✅ **Alle Lebensläufe einsehen** - Zentrale Übersicht
- ✅ **Qualitäts-Bewertung** - Score von 1-100
- ✅ **Status-Management** - Pending/Approved/Rejected/Under Review
- ✅ **Download-Funktion** - PDF-Downloads für echte Dateien

## 🚀 Häufige Admin-Aufgaben

### Erweiterte Pool-Verwaltung

#### **1. Pool mit Limit erstellen**
```typescript
// Pool-Erstellung mit automatischer Validierung
const newPool = {
  name: "Senior Developers Q1 2024",
  description: "Top JavaScript Entwickler",
  max_candidates: 25,        // NEU: Pool-Limit
  pool_type: "featured",
  status: "active"
};
```

#### **2. Unternehmensberechtigung verwalten**
```
Pool-Details → "Unternehmen" Tab → ⚙️ Aktionen → "Berechtigung bearbeiten"

Workflow:
1. Neukunde       → access_level: "view"
2. Nach Bewährung → Upgrade auf "select"  
3. Premium-Kunde  → Upgrade auf "contact"
4. Testphase      → expires_at setzen
5. Kündigung      → Zugang entfernen
```

#### **3. Kandidaten mit Limit-Prüfung hinzufügen**
```
Pool-Details → "Kandidaten" Tab → "Kandidaten hinzufügen"

System prüft automatisch:
✅ Pool-Limit nicht überschritten
⚠️ Warnung bei 80% Auslastung
❌ Blockierung bei Überschreitung
```

### Pool-Performance überwachen
1. **Pool-Analytics in Dashboard**
   - Real-time Statistiken
   - Skill-Übersichten
   - Auswahlstatistiken pro Unternehmen

2. **Workflow-Beispiel:**
   ```
   Pool "test3" → 4 Kandidaten bei Limit 2
   → Warnung: "Pool-Limit überschritten!"
   → Aktion: Limit erhöhen oder Kandidaten entfernen
   ```

### Resume-Management
1. **Lebensläufe überprüfen**
   - Zu `/dashboard/admin/resumes`
   - Nach Status filtern (pending)
   - Qualität bewerten

2. **Lebenslauf genehmigen/ablehnen**
   - Lebenslauf in Liste öffnen
   - "Genehmigen" oder "Ablehnen"
   - Optional: Reviewer-Notizen hinzufügen

## 📊 KPIs & Metriken

### Erweiterte Pool-Performance
- **Pool-Auslastung:** Kandidaten vs. Limit (neu!)
- **Zugriffslevel-Verteilung:** View/Select/Contact Ratio
- **Temporäre Zugriffe:** Ablaufende Berechtigungen
- **Successful Matches:** Kontakte/Einstellungen

### Pool-Limit Analytics
```typescript
interface PoolMetrics {
  totalCandidates: number;
  maxCandidates: number;
  utilization: number;        // % Auslastung
  warningThreshold: number;   // 80% Warnung
  limitExceeded: boolean;     // Limit überschritten
}
```

### Resume-Qualität
- **Durchschnittlicher Quality Score:** Gesamt-Bewertung
- **Approval Rate:** % genehmigte Lebensläufe
- **Review Time:** Durchschnittliche Bearbeitungszeit
- **Download Rate:** % heruntergeladene Lebensläufe

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

### 2. Erweiterte Berechtigungen prüfen
Das Admin-System nutzt erweiterte Row Level Security (RLS) Policies:
- ✅ Admin kann alle Pool-Daten einsehen und bearbeiten
- ✅ Sichere Pool-Berechtigungs-Verwaltung
- ✅ Unternehmenszugriff-Kontrolle
- ✅ Pool-Limit Durchsetzung

### 3. Pool-System Setup
```sql
-- Pool-Limits aktivieren (bereits vorhanden)
ALTER TABLE candidate_pools 
ADD COLUMN IF NOT EXISTS max_candidates INTEGER;

-- Berechtigungs-Management (bereits vorhanden)
-- Tabelle: pool_company_access mit access_level, expires_at, notes
```

## 🔒 Sicherheit

### Erweiterte Zugangskontrollen
- ✅ **Pool-Limit Durchsetzung** - Verhindert Überschreitung
- ✅ **Berechtigungs-Validierung** - Sichere Access-Level Verwaltung
- ✅ **Temporal Access Control** - Ablaufende Zugriffe
- ✅ **Audit-Logging** - Alle Pool-Änderungen werden geloggt

### Pool-spezifische Sicherheit
```typescript
// Validierung bei Pool-Operationen
if (!isAdmin(user)) throw new Error("Insufficient privileges");
if (candidateCount + newCandidates > poolLimit) {
  throw new Error("Pool capacity exceeded");
}
if (accessLevel === "contact" && !isPremiumCompany(company)) {
  throw new Error("Contact access requires premium subscription");
}
```

## 🆘 Troubleshooting

### Häufige Pool-Management Probleme

1. **Pool-Limit Fehler**
   ```
   Error: Pool-Limit erreicht!
   → Lösung: Limit erhöhen oder Kandidaten entfernen
   ```

2. **Berechtigungs-Update Fehler**
   ```
   Error: Could not find 'updated_at' column
   → Lösung: updated_at aus Update entfernt (bereits behoben)
   ```

3. **Unternehmen kann Pool nicht sehen**
   - Pool-Zugriffsberechtigung prüfen
   - Access-Level validieren (view/select/contact)
   - Ablaufdatum prüfen

### Debug-Scripts
```bash
# Pool-System testen
npm run test-pool-routes

# Pool-Limits prüfen
npx tsx scripts/debug-pool-limits.ts

# Berechtigungs-System testen
npx tsx scripts/debug-company-access.ts

# Datenbank-Status prüfen
npx tsx scripts/debug-pool-companies.ts
```

### Pool-Debugging
```typescript
// Pool-Status prüfen
console.log('Pool Health Check:', {
  id: pool.id,
  candidateCount: candidates.length,
  maxCandidates: pool.max_candidates,
  utilization: (candidates.length / pool.max_candidates) * 100,
  companiesWithAccess: companies.length,
  warningThreshold: pool.max_candidates * 0.8
});
```

## 📞 Support

Bei Admin-spezifischen Problemen:
1. **[Pool-Management Docs](./pool-management.md)** - **NEU!** Detaillierte Pool-Verwaltung v2.1.0
2. **[Resume-Management Docs](./resume-management.md)** - Lebenslauf-Verwaltung
3. **[User-Management Docs](./user-management.md)** - Benutzer-Verwaltung
4. **[Troubleshooting](../deployment/troubleshooting.md)** - Technische Probleme

## 📋 Changelog

### Version 2.1.0 (Dezember 2024) - **Aktuell**
- 🔥 **Pool-Limit Validierung** mit automatischer Prüfung
- 🔥 **Erweiterte Pool-Bearbeitung** mit responsivem Dialog (896px)
- 🔥 **Unternehmensberechtigung-Management** komplett neu implementiert
- 🔥 **Live-Validierung** mit sofortigen Rückmeldungen
- 🔥 **Bulk-Operationen** für effiziente Massenbearbeitung
- 🔧 **Bug-Fixes** für Pool-Zugriffe und Validierung

### Version 2.0.0 (November 2024)
- Pool-System Grundlagen implementiert
- Kandidaten-Zuweisungen
- Basis Unternehmenszugriff
- Admin Dashboard Integration

### Version 1.0.0 (Oktober 2024)
- Resume Management System
- Basis Admin-Funktionen
- Benutzer-Verwaltung

---

**Admin-System Version:** 2.1.0 | **Letzte Aktualisierung:** Dezember 2024 