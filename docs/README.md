# MySync Dashboard - Dokumentation

## 📋 Übersicht

MySync ist eine umfassende Talent-Management-Plattform für die Verwaltung von Kandidaten, Unternehmen und Recruiting-Pools.

## 🏗️ System-Architektur

```
┌─────────────────┬─────────────────┬─────────────────┐
│     ADMIN       │    COMPANY      │   CANDIDATE     │
│                 │                 │                 │
│ • Pool-Verwaltung│ • Pool-Zugang   │ • Profil-Setup  │
│ • Kandidaten     │ • Kandidaten-   │ • Lebenslauf-   │
│ • Unternehmen    │   Auswahl      │   Upload        │
│ • Analytics      │ • Kommunikation │ • Bewerbungen   │
│ • Lebenslauf-    │ • Reports       │ • Status        │
│   Management     │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

## 📚 Dokumentation nach Rollen

### 👨‍💼 Für Administratoren
- **[Admin-System](./admin/README.md)** - Komplette Admin-Funktionalitäten
- **[Pool-Management](./admin/pool-management.md)** - Kandidaten-Pools verwalten
- **[Resume-Management](./admin/resume-management.md)** - Lebenslauf-Verwaltung
- **[User-Management](./admin/user-management.md)** - Benutzer und Rollen

### 🏢 Für Unternehmen
- **[Company-Dashboard](./company/README.md)** - Unternehmen-Dashboard
- **[Pool-Access](./company/pool-access.md)** - Zugang zu Kandidaten-Pools
- **[Selection-Process](./company/selection-process.md)** - Auswahlprozess
- **[Communications](./company/communications.md)** - Kandidaten-Kommunikation

### 👤 Für Kandidaten
- **[Candidate-Profile](./candidate/README.md)** - Profil-Management
- **[Resume-Upload](./candidate/resume-upload.md)** - Lebenslauf-Upload
- **[Application-Status](./candidate/application-status.md)** - Bewerbungsstatus
- **[Pool-Participation](./candidate/pool-participation.md)** - Pool-Teilnahme

## 🛠️ Technische Dokumentation

### Entwicklung
- **[Development-Setup](./development/setup.md)** - Entwicklungsumgebung
- **[Database-Schema](./development/database.md)** - Datenbankstruktur
- **[API-Reference](./development/api.md)** - API-Dokumentation
- **[Testing](./development/testing.md)** - Test-Strategien

### Deployment
- **[Installation](./deployment/installation.md)** - System-Installation
- **[Configuration](./deployment/configuration.md)** - Konfiguration
- **[Migrations](./deployment/migrations.md)** - Datenbank-Migrationen
- **[Troubleshooting](./deployment/troubleshooting.md)** - Fehlerbehebung

## 🚀 Quick Start

### 1. System starten
```bash
npm run dev
```

### 2. Test-Daten erstellen
```bash
npm run seed-companies
```

### 3. Zugang zu den Dashboards

**Admin:** `http://localhost:3000/dashboard/admin`
- Email: `admin@example.com`
- Password: `admin123`

**Unternehmen:** `http://localhost:3000/dashboard/company`
- Email: `anna.schmidt@techcorp-solutions.de`
- Password: `company123`

**Kandidat:** `http://localhost:3000/dashboard/candidate`
- Registrierung erforderlich

## 📊 Aktuelle Features

### ✅ Implementiert
- 🔐 Authentifizierung & Autorisierung
- 👥 Benutzer-Management (Admin/Company/Candidate)
- 🏊‍♂️ Kandidaten-Pool-System
- 📄 Lebenslauf-Upload & -Management
- 🔍 Suchfunktionen & Filter
- 📊 Analytics & Reporting
- 💬 Basis-Kommunikation

### 🚧 In Entwicklung
- 📧 E-Mail-Benachrichtigungen
- 🤖 KI-basierte Kandidaten-Matching
- 📱 Mobile App
- 🔔 Real-time Notifications

## 🔧 Wartung & Support

- **Scripts:** Alle wichtigen Scripts in `scripts/` Ordner
- **Migrations:** Datenbank-Migrationen in `supabase/migrations/`
- **Logs:** Application logs in Browser DevTools
- **Backup:** Regelmäßige Datenbank-Backups empfohlen

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die entsprechende Rollen-Dokumentation
2. Schauen Sie in die [Troubleshooting](./deployment/troubleshooting.md) Anleitung
3. Prüfen Sie die Browser-Konsole auf Fehler

---

**Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 