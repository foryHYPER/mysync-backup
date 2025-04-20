# Architekturübersicht (Stand: aktuell)

## Authentifizierung & Rollen
- Authentifizierung erfolgt über Supabase (Session-basiert).
- Nach Login wird die Rolle des Users aus der Tabelle `profiles` (Feld: `role`, verknüpft über `id` = `auth.user.id`) geladen.
- Bekannte Rollen: `admin`, `client`, `candidate`.

## Routing & Zugriffsschutz
- Alle geschützten Seiten liegen unter `app/protected/`.
- Das Layout in `app/protected/layout.tsx` prüft serverseitig, ob der User authentifiziert ist. Bei fehlender Authentifizierung erfolgt ein Redirect zu `/auth/login`.
- Nach Login wird immer auf `/protected/dashboard` weitergeleitet.
- Die zentrale Datei `app/protected/dashboard/page.tsx` prüft die Rolle und rendert das passende Dashboard:
  - `admin` → `AdminDashboard`
  - `client` → `CompanyDashboard`
  - `candidate` → `CandidateDashboard`
- Es gibt **keine** separaten URLs wie `/protected/admin`, `/protected/client`, etc. – alles läuft über `/protected/dashboard`.

## Ordnerstruktur (relevant)
```
app/
  protected/
    layout.tsx                # Auth-Check für alle geschützten Seiten
    dashboard/
      page.tsx                # Zentrale Routing-Komponente für Dashboards
    data/
      admin.json              # Beispiel-Daten für Admin
      company.json            # Beispiel-Daten für Company
      candidate.json          # Beispiel-Daten für Candidate
components/
  dashboards/
    AdminDashboard.tsx        # Admin-spezifisches Dashboard
    CompanyDashboard.tsx      # Company (ehemals Client)-spezifisches Dashboard
    CandidateDashboard.tsx    # Candidate-spezifisches Dashboard
```

## Komponenten
- `AppSidebar`, `NavUser` etc. erhalten die User-Daten (inkl. E-Mail) als Prop aus dem jeweiligen Dashboard.
- Die Dashboards laden ihre Daten aus der jeweiligen Datei im zentralen `data/`-Ordner (`admin.json`, `company.json`, `candidate.json`) und zeigen rollen-spezifische Inhalte an.

## Login-Flow
- Nach erfolgreichem Login wird die Rolle aus `profiles` geladen.
- Bei bekannter Rolle erfolgt ein Redirect auf `/protected/dashboard`.
- Die Dashboard-Seite rendert das passende Dashboard.
- Bei unbekannter Rolle erfolgt ein Redirect auf `/auth/login`.

## Sicherheit
- Zugriff auf alle geschützten Seiten ist nur mit aktiver Session möglich (zentral im Layout geprüft).
- Die Rolle wird serverseitig geprüft, bevor das Dashboard gerendert wird.

---
Letztes Update: automatisch durch KI
