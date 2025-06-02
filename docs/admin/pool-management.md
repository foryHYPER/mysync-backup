# Pool Management System - Administratorhandbuch

## Übersicht

Das Pool Management System ermöglicht Administratoren die vollständige Verwaltung von Kandidatenpools, einschließlich der Zuweisung von Unternehmen, der Verwaltung von Kandidaten und der Kontrolle von Zugriffsberechtigungen.

## Hauptfunktionen

### 🏊‍♂️ Pool-Verwaltung
- **Pool erstellen und bearbeiten** mit erweiterten Einstellungen
- **Pool-Limits** definieren und validieren
- **Pool-Status** und Sichtbarkeit verwalten
- **Pool-Typen** (Main, Custom, Featured, Premium) zuweisen

### 👥 Kandidaten-Management
- **Kandidaten hinzufügen** mit automatischer Limit-Validierung
- **Prioritäten** und **Featured-Status** setzen
- **Kandidaten entfernen** aus Pools
- **Bulk-Operationen** für mehrere Kandidaten

### 🏢 Unternehmenszugriff-Verwaltung
- **Zugriffsberechtigungen** vergeben und bearbeiten
- **Drei Zugriffslevel**: Anzeigen, Auswählen, Kontaktieren
- **Zeitlich begrenzte Zugriffe** mit Ablaufdatum
- **Notizen** für interne Vermerke

### 📊 Analytics und Statistiken
- **Real-time Pool-Statistiken**
- **Skill-Übersichten** und Trends
- **Auswahlstatistiken** pro Unternehmen
- **Performance-Metriken**

---

## Detaillierte Funktionsbeschreibung

### 1. Pool-Bearbeitung

#### Zugang:
`Admin Dashboard → Pools → [Pool auswählen] → "Pool bearbeiten"`

#### Verfügbare Einstellungen:
- **Pool-Name** (Pflichtfeld)
- **Beschreibung** (optional)
- **Maximale Kandidatenanzahl** mit intelligenter Validierung
- **Pool-Typ**: Main, Custom, Featured, Premium
- **Pool-Status**: Aktiv, Inaktiv, Archiviert
- **Sichtbarkeit**: Öffentlich/Privat

#### Validierungsregeln:
```typescript
// Pool-Name darf nicht leer sein
if (!editForm.name.trim()) {
  throw new Error("Pool-Name ist erforderlich");
}

// Neues Limit darf nicht unter aktueller Kandidatenanzahl liegen
if (newMaxCandidates && newMaxCandidates < candidates.length) {
  throw new Error("Neues Limit ist zu niedrig");
}
```

#### Features:
✅ **Live-Validierung** mit sofortigen Rückmeldungen  
✅ **Responsive Dialog** (896px breit, scrollbar-fähig)  
✅ **Kontextuelle Informationen** (aktuelle Pool-Stats)  
✅ **Schutz vor Datenfehlern**

---

### 2. Kandidaten-Management

#### Kandidaten hinzufügen:
`Pool Detail → "Kandidaten hinzufügen"`

#### Pool-Limit Validierung:
```typescript
// Automatische Prüfung vor dem Hinzufügen
if (pool?.max_candidates) {
  const totalAfterAdding = currentCandidates + newCandidates;
  
  if (totalAfterAdding > pool.max_candidates) {
    // Fehler: Pool-Limit erreicht
    return showError(`Pool-Limit erreicht! Maximal ${pool.max_candidates} erlaubt.`);
  }
  
  if (totalAfterAdding > pool.max_candidates * 0.8) {
    // Warnung: Pool fast voll
    showWarning(`Pool ist fast voll! Noch ${remaining} Plätze verfügbar.`);
  }
}
```

#### Kandidaten-Einstellungen:
- **Priorität** (0-10 Skala)
- **Featured-Status** (Hervorhebung)
- **Notizen** (interne Vermerke)

#### Bulk-Operationen:
- Multiple Kandidaten gleichzeitig auswählen
- Batch-Import mit einheitlichen Einstellungen
- Massenbearbeitung von Prioritäten

---

### 3. Unternehmensberechtigung-Management

#### Zugang:
`Pool Detail → "Unternehmen" Tab → ⚙️ Aktionen → "Berechtigung bearbeiten"`

#### Zugriffslevel:

| Level | Berechtigung | Beschreibung |
|-------|-------------|--------------|
| **Anzeigen** | `view` | Nur Pool-Kandidaten ansehen |
| **Auswählen** | `select` | Kandidaten ansehen und auswählen |
| **Kontaktieren** | `contact` | Vollzugriff: ansehen, auswählen, kontaktieren |

#### Berechtigungs-Dialog:
```typescript
// Zugriffslevel ändern
access_level: "view" | "select" | "contact"

// Zeitlich begrenzte Zugriffe
expires_at: Date | null  // null = unbegrenzt

// Interne Vermerke
notes: string | null
```

#### Verfügbare Aktionen:
✅ **Berechtigung bearbeiten** - Zugriffslevel und Einstellungen ändern  
✅ **Zugang entfernen** - Unternehmen komplett aus Pool entfernen  
✅ **Ablaufdatum setzen** - Zeitlich begrenzten Zugang definieren  
✅ **Notizen hinzufügen** - Interne Vermerke für Tracking

---

### 4. Analytics und Reporting

#### Pool-Statistiken:
- **Aktive Kandidaten** mit Pool-Limit Anzeige
- **Unternehmen mit Zugang** 
- **Gesamt-Auswahlen** und monatliche Trends
- **Featured Kandidaten** Prozentsatz

#### Skill-Analytics:
```typescript
// Top 10 Skills im Pool
topSkills: [
  { skill: "JavaScript", count: 15 },
  { skill: "React", count: 12 },
  // ...
]

// Fortschrittsbalken-Visualisierung
skillPercentage = (skillCount / topSkillCount) * 100;
```

#### Auswahlstatistiken:
- **Pro Unternehmen**: Anzahl getätigter Auswahlen
- **Pro Kandidat**: Wie oft wurde gewählt
- **Zeitliche Trends**: Auswahlen diesen Monat vs. gesamt

---

## Technische Implementation

### Datenbankstruktur:

```sql
-- Pool-Tabelle
candidate_pools (
  id, name, description, 
  max_candidates,  -- NEU: Pool-Limit
  pool_type, status, visibility,
  created_at, updated_at
)

-- Pool-Kandidaten Zuweisungen
pool_candidates (
  id, pool_id, candidate_id,
  priority, featured, notes,
  added_by, added_at
)

-- Unternehmenszugriff
pool_company_access (
  id, pool_id, company_id,
  access_level,  -- view|select|contact
  expires_at,    -- NULL für unbegrenzt
  notes,         -- Interne Vermerke
  granted_by, granted_at
)
```

### API-Endpunkte:

```typescript
// Pool-Management
PUT  /pools/:id                    // Pool bearbeiten
GET  /pools/:id/stats             // Pool-Statistiken

// Kandidaten-Management  
POST /pools/:id/candidates        // Kandidaten hinzufügen (mit Validierung)
DELETE /pool-candidates/:id       // Kandidat entfernen

// Berechtigungs-Management
PUT  /pool-company-access/:id     // Berechtigung bearbeiten
DELETE /pool-company-access/:id   // Zugang entfernen
```

### Frontend-Komponenten:

```typescript
// Pool-Bearbeitung
<PoolEditDialog 
  pool={pool}
  onSave={handleSavePool}
  validation={validatePoolLimits}
/>

// Kandidaten-Management
<AddCandidatesDialog
  pool={pool}
  onAdd={handleAddCandidates}
  limitValidation={true}
/>

// Berechtigungs-Management
<CompanyAccessEditDialog
  companyAccess={editingCompanyAccess}
  onUpdate={handleUpdateCompanyAccess}
/>
```

---

## Workflow-Beispiele

### Pool mit Limit erstellen und verwalten:

1. **Pool erstellen** mit `max_candidates: 20`
2. **Kandidaten hinzufügen** (System prüft automatisch Limit)
3. **Bei 16 Kandidaten**: Warnung "Pool fast voll"
4. **Bei 20 Kandidaten**: Hinzufügen blockiert
5. **Limit erhöhen** oder Kandidaten entfernen

### Unternehmenszugang stufenweise gewähren:

1. **Neues Unternehmen** → `access_level: "view"`
2. **Nach Bewährung** → Upgrade auf `"select"`
3. **Premium-Kunde** → Upgrade auf `"contact"`
4. **Zeitlich begrenzt** → `expires_at` setzen
5. **Access revoken** → Zugang komplett entfernen

### Bulk-Kandidaten Import:

1. **Kandidaten-Liste** vorbereiten
2. **Pool-Limit prüfen** (automatisch)
3. **Einstellungen definieren** (Priorität, Featured)
4. **Batch-Import** durchführen
5. **Statistiken aktualisieren** (automatisch)

---

## Benutzerfreundlichkeit

### UI/UX Verbesserungen:

✅ **Responsive Dialoge** - Anpassung an verschiedene Bildschirmgrößen  
✅ **Live-Validierung** - Sofortige Rückmeldung bei Eingaben  
✅ **Kontextuelle Hilfe** - Tooltips und Beschreibungen  
✅ **Bulk-Operationen** - Effiziente Massenbearbeitung  
✅ **Visuelles Feedback** - Farbkodierte Status und Warnungen  

### Validierung und Sicherheit:

```typescript
// Client-side Validierung
if (!poolName.trim()) return "Name erforderlich";
if (newLimit < currentCandidates) return "Limit zu niedrig";

// Server-side Validierung
if (candidateCount + newCandidates > poolLimit) {
  throw new Error("Pool-Limit überschritten");
}
```

### Fehlerbehandlung:

```typescript
try {
  await updatePoolAccess(data);
  toast.success("Erfolgreich aktualisiert");
} catch (error) {
  console.error("Update failed:", error);
  toast.error("Fehler beim Aktualisieren");
}
```

---

## Best Practices

### Pool-Management:
- **Realistische Limits** setzen basierend auf Unternehmensbedarf
- **Pool-Typen** strategisch nutzen (Featured für Top-Kandidaten)
- **Beschreibungen** für interne Dokumentation nutzen

### Kandidaten-Zuweisungen:
- **Prioritäten** basierend auf Qualifikationen vergeben
- **Featured-Status** sparsam für Top-Talente verwenden
- **Notizen** für wichtige Hinweise nutzen

### Berechtigungs-Management:
- **Stufenweise Zugriffe** gewähren (view → select → contact)
- **Ablaufdaten** für Testphasen nutzen
- **Regelmäßige Audits** der Zugriffsrechte

---

## Fehlerbehebung

### Häufige Probleme:

**Pool-Limit Fehler:**
```
Error: Pool-Limit erreicht!
→ Lösung: Limit erhöhen oder Kandidaten entfernen
```

**Berechtigungs-Update Fehler:**
```
Error: Could not find 'updated_at' column
→ Lösung: updated_at aus Update entfernt (bereits behoben)
```

**RLS Policy Fehler:**
```
Error: insufficient_privilege
→ Lösung: Row Level Security Policies prüfen
```

### Debug-Tipps:

```typescript
// Pool-Status prüfen
console.log('Pool:', {
  id: pool.id,
  candidateCount: candidates.length,
  maxCandidates: pool.max_candidates,
  companiesWithAccess: companies.length
});

// Berechtigungen testen
console.log('Company Access:', {
  companyId: company.id,
  accessLevel: access.access_level,
  expiresAt: access.expires_at
});
```

---

## Changelog

### Version 2.1.0 (Aktuell)
- ✅ **Pool-Limit Validierung** mit automatischer Prüfung
- ✅ **Erweiterte Pool-Bearbeitung** mit verbessertem Dialog
- ✅ **Unternehmensberechtigung-Management** komplett neu
- ✅ **Responsive UI** mit besserer Benutzerführung
- ✅ **Live-Statistiken** mit Real-time Updates

### Version 2.0.0
- Pool-System Grundlagen
- Kandidaten-Zuweisungen
- Basis Unternehmenszugriff
- Admin Dashboard Integration

---

## Roadmap

### Geplante Features:
- 📅 **Automatische Pool-Rotationen**
- 🔄 **Kandidaten-Import aus CSV/Excel**
- 📊 **Erweiterte Analytics Dashboards**
- 🔔 **Benachrichtigungen** für Pool-Events
- 🎯 **ML-basierte Kandidaten-Empfehlungen**

---

*Letzte Aktualisierung: Dezember 2024*
*Version: 2.1.0* 