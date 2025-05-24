# Matching-System

Das Matching-System von mySync ist eine intelligente Komponente, die Kandidaten und Stellenausschreibungen basierend auf verschiedenen Kriterien zusammenbringt. Das System verwendet einen gewichteten Algorithmus zur Berechnung von Match-Scores.

## Architektur

### Service-Layer

#### MatchingService
- Hauptklasse für alle Matching-Operationen
- Verwendet Supabase für Datenbankzugriff
- Implementiert intelligentes Matching basierend auf Skills, Erfahrung, Standort und Verfügbarkeit

### Datenmodelle

- **CandidateMatch**: Hauptentität für Match-Ergebnisse
- **MatchDetails**: Detaillierte Aufschlüsselung der Match-Scores
- **SkillMatch**: Einzelne Skill-Vergleiche

## Matching-Algorithmus

Der Matching-Score wird basierend auf folgenden Kriterien berechnet:

1. **Skills (60% Gewichtung)**
   - Erforderliche Skills müssen übereinstimmen
   - Bevorzugte Skills erhöhen den Score

2. **Erfahrung (20% Gewichtung)**
   - Vergleicht die Kandidaten-Erfahrung mit den Anforderungen

3. **Standort (10% Gewichtung)**
   - Prüft Übereinstimmung zwischen Kandidaten- und Job-Standort

4. **Verfügbarkeit (10% Gewichtung)**
   - Berücksichtigt die Verfügbarkeit des Kandidaten

## Datenbank-Integration

### Tabellen
- `candidates`: Kandidateninformationen
- `job_postings`: Stellenausschreibungen
- `candidate_matches`: Gespeicherte Match-Ergebnisse
- `skills` & `candidate_skills`: Skill-Management

### Abfragen
Das System nutzt effiziente Supabase-Abfragen mit Joins für optimale Performance.

## API-Endpunkte

### Kandidaten-Matching
```typescript
matchingService.matchCandidate(candidateId: string): Promise<CandidateMatch[]>
```

### Job-Posting-Matching
```typescript
matchingService.matchJobPosting(jobPostingId: string): Promise<CandidateMatch[]>
```

### Match-Status-Update
```typescript
matchingService.updateMatchStatus(matchId: string, status: string): Promise<CandidateMatch>
```

## Verwendung

### In React-Komponenten
```typescript
import { MatchingService } from "@/lib/services/matching";

const matchingService = new MatchingService();
const matches = await matchingService.getCandidateMatches(candidateId);
```

### Status-Management
- `pending`: Neuer Match, noch nicht überprüft
- `reviewed`: Match wurde vom Unternehmen angesehen
- `contacted`: Kandidat wurde kontaktiert
- `rejected`: Match wurde abgelehnt

## Best Practices

1. **Caching**: Match-Ergebnisse werden in der Datenbank gespeichert
2. **Incremental Updates**: Nur neue oder geänderte Daten werden neu berechnet
3. **Error Handling**: Robuste Fehlerbehandlung für Datenbankoperationen

## Erweiterungsmöglichkeiten

- KI-basierte Matching-Verbesserungen
- Personalisierte Gewichtungen pro Unternehmen
- Historische Match-Analyse
- Real-time Match-Benachrichtigungen

## Frontend-Integration

### MatchList-Komponente
Die `MatchList`-Komponente ist die Hauptkomponente für die Anzeige von Matches:

#### Features
- Zeigt Matches in einer Tabelle an
- Unterstützt verschiedene Ansichten für Kandidaten und Unternehmen
- Zeigt detaillierte Match-Informationen:
  - Kandidaten-Informationen
  - Match-Score mit Fortschrittsbalken
  - Detaillierte Match-Details
  - Status-Badge
  - Aktionsmenü für Status-Updates

#### State-Management
- `matches`: Array der aktuellen Matches
- `candidates`: Map der Kandidaten-Informationen
- `loading`: Lade-Status

#### Wichtige Funktionen
- `loadMatches`: Lädt Matches und zugehörige Kandidaten-Informationen
- `handleStatusChange`: Aktualisiert den Status eines Matches
- `getCandidateInfo`: Formatiert Kandidaten-Informationen
- `renderMatchDetails`: Rendert die detaillierten Match-Informationen

## Mock-Daten

### Kandidaten
- Simulierte Kandidaten mit verschiedenen:
  - Skills und Skill-Levels
  - Erfahrungsjahren
  - Standorten
  - Verfügbarkeitsstatus

### Stellenausschreibungen
- Simulierte Stellen mit:
  - Erforderlichen und bevorzugten Skills
  - Erfahrungsanforderungen
  - Standortanforderungen
  - Status (offen/geschlossen)

### Matches
- Vordefinierte Matches mit:
  - Realistischen Match-Scores
  - Detaillierten Match-Details
  - Verschiedenen Status

## Entwicklung und Testing

### Verwendung des Mock-Services
1. Der Mock-Service wird automatisch verwendet, wenn keine echte Datenbankverbindung besteht
2. Mock-Daten werden beim ersten Login initialisiert
3. Alle Operationen simulieren Netzwerkverzögerungen

### Vorteile des Mock-Systems
- Schnelle Entwicklung ohne Datenbank
- Konsistente Testdaten
- Realistische Verzögerungen
- Einfache Erweiterbarkeit

### Hinweise für Entwickler
- Mock-Daten können in `mock-data.ts` angepasst werden
- Verzögerungen können in `mock-matching.ts` konfiguriert werden
- Neue Match-Kriterien können im `MatchDetails`-Interface hinzugefügt werden 