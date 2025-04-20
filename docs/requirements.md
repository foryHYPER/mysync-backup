Übersicht der zu implementierenden Features

1. Benutzer- und Rollenverwaltung


Profilmanagement

Admin: Firmen‑ und Systemdaten verwalten

Company: Unternehmensprofil, Ansprechpartner, Kontaktdaten

Candidate: Lebenslauf, Skills, Verfügbarkeiten, Bewerbungsunterlagen

2. Kandidaten‑Pool & Matching
Kandidaten anlegen & verwalten

Manuelle Erstellung durch Admin oder Self‑Service durch Candidate

Datenimport (z. B. CSV) für Bulk‑Anlage

Kategorisierung & Suchfilter

Tagging (Skills, Standort, Verfügbarkeit, Seniorität)

Volltext‑Suche und Filter (Skills, Sprache, Branche)

Matching-Logik

Vorschlagsliste für Companies basierend auf Jobprofilen

Scoring‑System (z. B. Passgenauigkeit in %)

3. Company‑Dashboard
Übersicht & Navigation

Dashboard mit wichtigsten Kennzahlen (Anzahl Kandidaten, Einladungen offen, angenommene Termine)

Menüstruktur: Kandidaten‑Liste, Einladungsübersicht, Einstellungen

Kandidaten‑Liste

Tabellenansicht mit Filter‑ und Sortierfunktionen

Profil-Quick‑View (Popup mit Lebenslauf, Skills, Kontaktinfo)

Interview‑Einladungen

Auswahl-Checkboxen direkt in der Liste

Formular für Terminvorschläge (Datum, Uhrzeit, Ort/Video-Link)

Versand per E‑Mail (+ In-App‑Notification)

Einladungs‑Management

Statusübersicht (ausstehend, bestätigt, abgelehnt)

Erinnerung an ausstehende Einladungen

4. Candidate‑Dashboard
Übersicht & Navigation

Übersicht kommender Termine, offene Einladungen, Status vergangener Interviews

Einladungsansicht

Detailseite mit Terminvorschlägen und Map/Video‑Link

Buttons: „Annehmen“, „Ablehnen“, ggf. „Alternativ­termin vorschlagen“

Self‑Service Funktionen

Upload/Update von Lebenslauf und Profilfoto

Anzeige aller Unternehmen, die Zugriff auf das Profil haben

Benachrichtigungen

In-App‑Alerts und E‑Mails bei neuen Einladungen oder Änderungen

5. Termin- und Kalenderintegration
Terminbestätigung

Nach Candidate‑Akzeptanz: automatischer Eintrag im internen Kalender

Optionale Integration mit Google Calendar / Outlook via OAuth

Erinnerungen & Benachrichtigungen

Automatische E‑Mail‑/SMS‑Erinnerung 24 h vor Termin

Push‑Notification (falls Mobile‑App geplant)

6. Benachrichtigungs‑System
Channels

In-App (Dashboard‑Notifications)

E‑Mail Templates mit Platzhaltern (Firma, Kandidat, Termin)

Konfigurations­möglichkeiten

Admin/Company/Candidate können Präferenzen (E‑Mail vs. Push) einstellen

Audit-Log

Protokoll aller wichtigen Aktionen (Einladungen, Änderungen, Logins)

7. Admin‑Tools & Reporting
Dashboard für Admin

Gesamtsicht: Anzahl Users, Anzahl Companies, Gesamtkandidaten, offene Einladungen

Management‑Funktionen

Company‑Freigabe / Sperrung

Kandidaten‑Review / Qualitätskontrolle

Berichte & Exporte

CSV/Excel‑Export von Kandidaten‑Listen, Einladungsstatistiken, KPIs

8. Sicherheit & Compliance
Datenzugriff

Verschlüsselte Speicherung sensibler Daten (TLS, AES)

Session‑Handling

JWT oder Sessions mit Secure‑Cookies

Datenschutz (DSGVO)

Opt‑In/Opt‑Out für Marketing‑Mails

Lösch­funktion für Kandidatenprofile auf Anfrage

Rate Limiting & Monitoring

Schutz gegen Brute‑Force und DoS

9. Technische Grundpfeiler (ohne Detailtiefe)
API Layer mit Endpunkten für Auth, User, Candidates, Invitations

Frontend‑Routing mit geschützten Routen und Role‑Guards

State Management für globale Daten (User, Notifications)

Modulare Komponenten für wiederkehrende UI‑Elemente (Tables, Forms, Modals)

Damit hat dein Entwicklerteam eine klare Roadmap:

Core Auth & RBAC

User‑Profile & Pool‑Management

Role‑Specific Dashboards (Company ↔ Candidate)

Einladungs‑Workflow & Kalender

Notifications & Reporting

Admin‑Oversight & Compliance