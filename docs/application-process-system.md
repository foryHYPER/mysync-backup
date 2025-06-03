# Bewerbungsprozess-System (Application Process System)

## 📋 Übersicht

Das Bewerbungsprozess-System ist ein zentrales Feature, das den gesamten Lebenszyklus einer Bewerbung von der ersten Kontaktaufnahme bis zur finalen Entscheidung abbildet. Es bietet allen Beteiligten (Kandidaten, Unternehmen, Admins) eine klare Übersicht über den aktuellen Status und die nächsten Schritte.

## 🎯 Ziele

### Primäre Ziele
- **Transparenz:** Alle Parteien wissen jederzeit, wo sie im Prozess stehen
- **Effizienz:** Reduzierung von Nachfragen und verlorenen Bewerbungen
- **Strukturierung:** Einheitlicher Ablauf für alle Bewerbungen
- **Nachverfolgung:** Vollständige Historie für Analytics und Compliance

### Sekundäre Ziele
- **Automatisierung:** Reduzierung manueller Arbeit
- **Integration:** Nahtlose Verbindung mit bestehenden Pool- und Matching-Systemen
- **Skalierbarkeit:** System kann mit wachsender Nutzerzahl mithalten

## 🔄 Bewerbungsprozess-Stufen

### 1. Initiierung (Initiation)
**Status:** `initiated`
- **Trigger:** Admin fügt Kandidat zu Pool hinzu OR Kandidat bewirbt sich selbst
- **Automatisch:** Match-Score wird berechnet und gespeichert
- **Nächster Schritt:** Pool-Review durch Unternehmen

### 2. Pool-Review (Pool Review)
**Status:** `pool_review`
- **Verantwortlich:** Unternehmen
- **Aktion:** Unternehmen sichtet verfügbare Kandidaten in ihren Pools
- **Mögliche Übergänge:**
  - → `interested` (Unternehmen zeigt Interesse)
  - → `rejected_pool` (Kandidat wird aus Pool-Betrachtung ausgeschlossen)

### 3. Interesse bekundet (Interest Expressed)
**Status:** `interested`
- **Trigger:** Unternehmen markiert Kandidat als "interessant"
- **Automatisch:** Kandidat wird benachrichtigt
- **Nächster Schritt:** Initialer Kontakt

### 4. Erstkontakt (Initial Contact)
**Status:** `initial_contact`
- **Verantwortlich:** Unternehmen
- **Aktion:** Unternehmen nimmt Kontakt zum Kandidaten auf
- **Tracking:** Datum und Art des Kontakts
- **Mögliche Übergänge:**
  - → `contacted_back` (Kandidat antwortet)
  - → `no_response` (Keine Antwort nach X Tagen)

### 5. Gegenseitiges Interesse (Mutual Interest)
**Status:** `mutual_interest`
- **Trigger:** Kandidat zeigt ebenfalls Interesse
- **Nächster Schritt:** Terminplanung für Interview

### 6. Interview geplant (Interview Scheduled)
**Status:** `interview_scheduled`
- **Verantwortlich:** Beide Parteien
- **Integration:** Kalender-Integration für Terminplanung
- **Tracking:** Datum, Zeit, Art des Interviews (Video/Vor Ort)

### 7. Interview durchgeführt (Interview Completed)
**Status:** `interview_completed`
- **Trigger:** Interview-Termin ist vorbei
- **Nächste Schritte:** Bewertung und Feedback

### 8. Bewertung (Evaluation)
**Status:** `under_evaluation`
- **Verantwortlich:** Unternehmen
- **Tracking:** Bewertungsnotizen, Scores
- **Zeitlimit:** Definierte Frist für Entscheidung

### 9. Entscheidung (Decision)
**Status:** `decision_made`
- **Mögliche Übergänge:**
  - → `offer_extended` (Jobangebot)
  - → `rejected_interview` (Absage nach Interview)

### 10. Angebot (Offer Extended)
**Status:** `offer_extended`
- **Verantwortlich:** Unternehmen
- **Tracking:** Angebotdetails, Gehalt, Startdatum
- **Zeitlimit:** Frist für Kandidatenantwort

### 11. Finale Entscheidung (Final Decision)
**Status:** Einer der folgenden:
- `offer_accepted` - Angebot angenommen
- `offer_declined` - Angebot abgelehnt
- `offer_expired` - Angebot verfallen
- `rejected_pool` - Im Pool abgelehnt
- `rejected_interview` - Nach Interview abgelehnt
- `no_response` - Keine Antwort
- `withdrawn` - Zurückgezogen (durch Kandidat oder Unternehmen)

## 🏗️ Datenbank-Struktur

### Neue Tabelle: `application_processes`

```sql
CREATE TABLE application_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core References
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES candidate_pools(id) ON DELETE SET NULL,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  
  -- Process Status
  current_status TEXT NOT NULL DEFAULT 'initiated' CHECK (
    current_status IN (
      'initiated', 'pool_review', 'interested', 'initial_contact',
      'contacted_back', 'mutual_interest', 'interview_scheduled',
      'interview_completed', 'under_evaluation', 'decision_made',
      'offer_extended', 'offer_accepted', 'offer_declined',
      'offer_expired', 'rejected_pool', 'rejected_interview',
      'no_response', 'withdrawn'
    )
  ),
  
  -- Metadata
  match_score DECIMAL(5,2),
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  source TEXT DEFAULT 'pool_assignment' CHECK (source IN ('pool_assignment', 'direct_application', 'referral')),
  
  -- Tracking
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_next_action_date TIMESTAMPTZ,
  next_action_responsible TEXT CHECK (next_action_responsible IN ('candidate', 'company', 'admin', 'system')),
  
  -- Process Data
  process_data JSONB DEFAULT '{}', -- Flexible storage for process-specific data
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(candidate_id, company_id, pool_id)
);
```

### Neue Tabelle: `application_status_history`

```sql
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_process_id UUID NOT NULL REFERENCES application_processes(id) ON DELETE CASCADE,
  
  -- Status Change
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Context
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_reason TEXT,
  notes TEXT,
  
  -- Metadata
  automated BOOLEAN DEFAULT FALSE,
  duration_in_previous_status INTERVAL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Neue Tabelle: `application_interactions`

```sql
CREATE TABLE application_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_process_id UUID NOT NULL REFERENCES application_processes(id) ON DELETE CASCADE,
  
  -- Interaction Details
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN (
      'email_sent', 'email_received', 'phone_call', 'video_call',
      'meeting_scheduled', 'meeting_completed', 'document_shared',
      'feedback_provided', 'note_added', 'status_updated'
    )
  ),
  
  -- Content
  subject TEXT,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Participants
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  participants JSONB DEFAULT '[]', -- Array of participant IDs
  
  -- Metadata
  interaction_date TIMESTAMPTZ DEFAULT NOW(),
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs. external communication
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🎭 Rollenperspektiven

### 👨‍💼 Kandidaten-Perspektive

#### Dashboard-Integration
- **Status-Widget:** Aktueller Status aller laufenden Bewerbungen
- **Timeline-View:** Chronologische Übersicht der Schritte
- **Next Steps:** Was als nächstes zu erwarten ist
- **Action Items:** Was der Kandidat tun muss

#### Neue Seiten
1. **`/dashboard/candidate/applications`**
   - Übersicht aller Bewerbungsprozesse
   - Filterung nach Status, Unternehmen, Datum
   - Detailansicht je Bewerbung

2. **`/dashboard/candidate/applications/[id]`**
   - Detaillierte Prozess-Timeline
   - Kommunikationshistorie
   - Anstehende Termine
   - Dokumente und Anhänge

#### Features
- **Benachrichtigungen:** Bei Status-Änderungen
- **Kalender-Integration:** Automatische Termine
- **Document-Upload:** Zusätzliche Unterlagen
- **Feedback-System:** Bewertung des Prozesses

### 🏢 Unternehmen-Perspektive

#### Dashboard-Integration
- **Pipeline-Übersicht:** Alle Kandidaten in verschiedenen Stufen
- **Action Items:** Kandidaten, die Aufmerksamkeit benötigen
- **Analytics:** Conversion-Rates, Durchlaufzeiten
- **Deadlines:** Anstehende Fristen

#### Neue Seiten
1. **`/dashboard/company/applications`**
   - Kanban-Board mit Bewerbungsstufen
   - Drag & Drop für Status-Änderungen
   - Bulk-Actions für mehrere Kandidaten
   - Advanced Filtering

2. **`/dashboard/company/applications/[id]`**
   - Kandidaten-Profil mit Bewerbungshistorie
   - Kommunikations-Interface
   - Interview-Scheduling
   - Bewertungsformulare

3. **`/dashboard/company/pipeline`**
   - Pipeline-Analytics
   - Bottleneck-Identifikation
   - Team-Performance Tracking

#### Features
- **Automated Workflows:** Erinnerungen und Eskalationen
- **Team-Collaboration:** Interne Notizen und Bewertungen
- **Template-System:** Vorgefertigte E-Mail-Templates
- **Reporting:** Detailed Analytics und KPIs

### 👨‍💻 Admin-Perspektive

#### Dashboard-Integration
- **System-Übersicht:** Gesamtstatistiken aller Prozesse
- **Problembehebung:** Stuck Processes, Eskalationen
- **Quality Assurance:** Prozess-Compliance Monitoring
- **Performance Metrics:** System-weite KPIs

#### Neue Seiten
1. **`/dashboard/admin/applications`**
   - Systemweite Prozess-Übersicht
   - Intervention bei Problemen
   - Prozess-Konfiguration

2. **`/dashboard/admin/process-analytics`**
   - Detaillierte Analytics
   - A/B-Testing von Prozess-Varianten
   - Success-Rate Tracking

#### Features
- **Process Configuration:** Anpassung von Standard-Abläufen
- **Escalation Management:** Automatische Intervention
- **Data Export:** Compliance und Reporting
- **System Monitoring:** Performance und Health-Checks

## 🔧 Technische Implementierung

### Phase 1: Grundsystem (Woche 1-2)
1. **Datenbank-Setup**
   - Tabellen erstellen
   - Relationen einrichten
   - RLS-Policies definieren

2. **Core API**
   - CRUD-Operations für Bewerbungsprozesse
   - Status-Transitions mit Validierung
   - Historie-Tracking

3. **Basic UI Components**
   - Status-Badge Komponente
   - Timeline Komponente
   - Process-Card Komponente

### Phase 2: Kandidaten-Interface (Woche 3)
1. **Candidate Dashboard Integration**
   - Status-Widget
   - Recent Activities

2. **Applications Overview Page**
   - List-View mit Filtering
   - Status-Indikatoren

3. **Application Detail Page**
   - Timeline-View
   - Communication Interface

### Phase 3: Unternehmen-Interface (Woche 4-5)
1. **Company Dashboard Integration**
   - Pipeline-Übersicht
   - Action Items

2. **Kanban-Board Implementation**
   - Drag & Drop
   - Bulk-Actions

3. **Communication System**
   - E-Mail Integration
   - Template-System

### Phase 4: Admin-Tools (Woche 6)
1. **Admin Dashboard Integration**
2. **Process Analytics**
3. **Configuration Interface**

### Phase 5: Automatisierung (Woche 7-8)
1. **Automated Notifications**
2. **Escalation Rules**
3. **Calendar Integration**
4. **Reporting System**

## 📊 Success Metrics

### Quantitative KPIs
- **Process Completion Rate:** % der Prozesse, die erfolgreich abgeschlossen werden
- **Average Process Duration:** Durchschnittliche Zeit von Initiierung bis Abschluss
- **Stage Conversion Rates:** Conversion zwischen einzelnen Stufen
- **Response Times:** Wie schnell reagieren Parteien auf Aktionen
- **User Engagement:** Wie oft nutzen User das System

### Qualitative Indikatoren
- **User Satisfaction:** Feedback-Scores von Kandidaten und Unternehmen
- **Process Transparency:** Reduzierung von Status-Nachfragen
- **Error Reduction:** Weniger verlorene oder vergessene Bewerbungen
- **Efficiency Gains:** Zeitersparnis für HR-Teams

## 🚀 Migration Strategy

### Bestehende Daten
1. **candidate_matches** → **application_processes**
   - Migrationsskript für bestehende Matches
   - Status-Mapping basierend auf aktuellen Daten

2. **invitations** → **application_interactions**
   - Interview-Einladungen als Interactions

3. **Backward Compatibility**
   - Bestehende APIs bleiben funktional
   - Schrittweise Migration

### Rollout-Plan
1. **Beta-Phase:** Ausgewählte Unternehmen und Kandidaten
2. **Gradual Rollout:** Schrittweise Aktivierung für alle User
3. **Full Migration:** Komplette Umstellung auf neues System

## 🔐 Security & Privacy

### Data Protection
- **DSGVO-Compliance:** Recht auf Vergessenwerden
- **Data Minimization:** Nur notwendige Daten speichern
- **Audit Trail:** Vollständige Nachverfolgbarkeit

### Access Control
- **Role-based Access:** Strikte Trennung der Rollenperspektiven
- **Data Segregation:** Unternehmen sehen nur ihre Prozesse
- **Admin Oversight:** Admins können alle Daten einsehen

## 📋 Next Steps

1. **Review & Feedback:** Stakeholder-Review dieses Plans
2. **Technical Architecture:** Detaillierte technische Spezifikation
3. **UI/UX Design:** Wireframes und Prototypen
4. **Implementation Planning:** Sprint-Planung und Task-Breakdown
5. **Database Migration:** Preparation und Testing

---

**Geschätzte Entwicklungszeit:** 8 Wochen
**Benötigte Ressourcen:** 1 Fullstack Developer, 1 UI/UX Designer (optional)
**Priorität:** Hoch (Core Feature)

## 📝 Offene Fragen

1. **Automatisierung-Level:** Wie viel soll automatisch passieren vs. manuelle Kontrolle?
2. **Integration-Scope:** Externe Tools (E-Mail, Kalender, CRM)?
3. **Customization:** Sollen Unternehmen eigene Prozess-Schritte definieren können?
4. **Notifications:** E-Mail, In-App, Push? Welche Präferenzen?
5. **Mobile App:** Ist eine mobile Version geplant? 