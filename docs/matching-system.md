# Matching-System Dokumentation

## Übersicht
Das Matching-System ist ein zentraler Bestandteil der Plattform, der Kandidaten mit passenden Stellen und Unternehmen mit passenden Kandidaten zusammenbringt. Das System verwendet einen Mock-Service für Entwicklungs- und Testzwecke, der realistische Daten simuliert.

## Architektur

### 1. Service-Schicht

#### MatchingService (Basis-Service)
- Basisklasse für das Matching-System
- Definiert die Schnittstelle für alle Matching-Operationen
- Implementiert die grundlegende Logik für das Matching

#### MockMatchingService
- Erweitert den MatchingService für Testzwecke
- Verwendet MockDataService für simulierte Daten
- Implementiert künstliche Verzögerungen für realistischeres Verhalten
- Initialisiert automatisch Benutzer-Mappings beim Login

#### MockDataService
- Singleton-Instanz für Mock-Daten
- Verwaltet Mock-Daten für:
  - Kandidaten
  - Stellenausschreibungen
  - Matches
  - Skills
- Implementiert Benutzer-Mapping-System für die Verknüpfung von echten Benutzer-IDs mit Mock-Daten

### 2. Datenmodelle

#### CandidateMatch
```typescript
{
  id: string;
  candidate_id: string;
  job_posting_id: string;
  match_score: number;
  match_details: MatchDetails;
  status: "pending" | "reviewed" | "contacted" | "rejected";
  created_at: string;
  updated_at: string;
}
```

#### MatchDetails
```typescript
{
  skillMatches: Array<{
    skill: string;
    score: number;
  }>;
  experienceMatch: number;
  locationMatch: boolean;
  availabilityMatch: boolean;
}
```

## Funktionsweise

### 1. Benutzer-Mapping
- Beim Login wird ein Mapping zwischen der echten Benutzer-ID und Mock-Daten erstellt
- Für Kandidaten: Zufällige Zuordnung zu einem Mock-Kandidaten
- Für Unternehmen: Alle Stellenausschreibungen werden mit der Unternehmens-ID verknüpft

### 2. Match-Prozess

#### Für Kandidaten
1. Kandidat meldet sich an
2. System lädt alle verfügbaren Stellenausschreibungen
3. Für jede Stelle wird ein Match-Score berechnet basierend auf:
   - Skill-Übereinstimmung
   - Erfahrungslevel
   - Standort-Kompatibilität
   - Verfügbarkeit

#### Für Unternehmen
1. Unternehmen meldet sich an
2. System lädt alle offenen Stellenausschreibungen des Unternehmens
3. Für jede Stelle werden passende Kandidaten gefunden
4. Match-Scores werden berechnet und sortiert

### 3. Match-Score Berechnung
Der Match-Score wird aus mehreren Faktoren berechnet:
- Skills (50%): Durchschnittliche Übereinstimmung der Skills
- Erfahrung (30%): Übereinstimmung des Erfahrungslevels
- Standort (10%): Binärer Faktor für Standort-Kompatibilität
- Verfügbarkeit (10%): Binärer Faktor für Verfügbarkeits-Kompatibilität

### 4. Match-Status-Management
Matches können folgende Status haben:
- `pending`: Initialer Status
- `reviewed`: Match wurde geprüft
- `contacted`: Kontakt wurde aufgenommen
- `rejected`: Match wurde abgelehnt

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