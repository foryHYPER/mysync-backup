# Unternehmen-Dashboard Dokumentation

## 📋 Übersicht

Das Unternehmen-Dashboard ermöglicht es Firmen, auf Kandidaten-Pools zuzugreifen, Talente zu suchen und den Recruiting-Prozess zu verwalten.

## 🎯 Unternehmen-Features

### 1. 🏊‍♂️ Pool-Zugang
- **Pool-Übersicht** - Verfügbare Kandidaten-Pools durchsuchen
- **Pool-Details** - Detaillierte Pool-Informationen einsehen
- **Zugangs-Level** - Verschiedene Berechtigungsstufen
- **Pool-Metriken** - Erfolgsstatistiken und Kennzahlen

### 2. 👥 Kandidaten-Auswahl
- **Kandidaten-Browser** - Pool-Mitglieder durchsuchen
- **Profile ansehen** - Detaillierte Kandidaten-Profile
- **Skills-Matching** - Automatische Übereinstimmung
- **Favoriten-Liste** - Interessante Kandidaten markieren

### 3. 📄 Lebenslauf-Zugriff
- **CV-Downloads** - Genehmigte Lebensläufe herunterladen
- **Document-Viewer** - PDFs direkt im Browser
- **Quality-Scores** - Bewertungen einsehen
- **Skills-Analysis** - Extrahierte Fähigkeiten

### 4. 📊 Analytics & Reporting
- **Pool-Performance** - Erfolgsmetriken verfolgen
- **Matching-Statistiken** - Übereinstimmungsraten
- **Recruiting-Pipeline** - Fortschritt visualisieren
- **ROI-Tracking** - Kosten-Nutzen-Analyse

## 🔗 Navigation

### Haupt-Menü
```
/dashboard/company/
├── 📊 Dashboard (Übersicht)
├── 🏊‍♂️ Pools
│   ├── Verfügbare Pools
│   ├── Pool-Details
│   └── Pool-Metriken
├── 👥 Kandidaten
│   ├── Kandidaten-Browser
│   ├── Favoriten
│   └── Kontaktierte
├── 📄 Lebensläufe
├── 📊 Analytics
└── ⚙️ Einstellungen
```

## 🎯 Wichtige URLs

| Feature | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | `/dashboard/company` | Haupt-Dashboard |
| **Pools** | `/dashboard/company/pools` | Pool-Übersicht |
| **Pool-Details** | `/dashboard/company/pools/[id]` | Einzelner Pool |
| **Kandidaten** | `/dashboard/company/candidates` | Kandidaten-Browser |
| **Analytics** | `/dashboard/company/analytics` | Reporting |
| **Einstellungen** | `/dashboard/company/settings` | Firma-Einstellungen |

## 🏊‍♂️ Pool-System für Unternehmen

### Pool-Zugang verwalten
Unternehmen erhalten Zugang zu Pools durch Administratoren mit verschiedenen Berechtigungsstufen:

#### **Access Levels:**
- 🔍 **View** - Pool-Übersicht und Grundinfos
- 👀 **Browse** - Kandidaten durchsuchen (ohne Kontaktdaten)
- 📞 **Contact** - Vollzugriff mit Kontaktmöglichkeit
- 📊 **Analytics** - Zusätzlich detaillierte Metriken
- 👑 **Full** - Alle Funktionen inklusive Downloads

### Pool-Interface

#### **Pool-Karten:**
```
┌─────────────────────────────────────┐
│  🏊‍♂️ Frontend Developer Pool        │
│                                     │
│  👥 25 Kandidaten | ⭐ 87% Match    │
│  🎯 React, TypeScript, Node.js     │
│  📅 Aktiv seit: März 2024          │
│                                     │
│  Access Level: Contact              │
│  [Durchsuchen] [Analytics]          │
└─────────────────────────────────────┘
```

#### **Pool-Metriken:**
- 👥 **Kandidaten-Anzahl** - Gesamt verfügbare Talente
- ⭐ **Match-Score** - Übereinstimmung mit Anforderungen
- 🎯 **Skill-Overlap** - Relevante Fähigkeiten
- 📊 **Pool-Aktivität** - Aktualisierungen und Neuzugänge
- 🏆 **Erfolgsrate** - Bisherige Einstellungen aus Pool

## 👥 Kandidaten-Management

### Kandidaten-Browser

#### **Filter-Optionen:**
- 🎯 **Skills** - Nach Fähigkeiten filtern
- 💼 **Erfahrung** - Jahre Berufserfahrung
- 🎓 **Bildung** - Ausbildungsgrad
- 📍 **Standort** - Geografische Lage
- ⏰ **Verfügbarkeit** - Startdatum
- ⭐ **Quality Score** - Lebenslauf-Bewertung

#### **Kandidaten-Karten:**
```
┌─────────────────────────────────────┐
│  👤 Max Mustermann                  │
│  💼 5+ Jahre | 🎓 Master           │
│  📍 Berlin | ⏰ Sofort verfügbar    │
│                                     │
│  🏷️ React • TypeScript • Node.js    │
│  ⭐ Quality Score: 87/100           │
│                                     │
│  [Profil] [Favorit] [Kontakt] [CV] │
└─────────────────────────────────────┘
```

### Kontakt-Management

#### **Kommunikations-Features:**
- 📧 **Direkt-Nachrichten** - Interne Messaging
- 📞 **Kontakt-Anfrage** - Offizielle Kontaktaufnahme
- ⭐ **Interview-Einladung** - Terminkoordination
- 📋 **Notizen** - Interne Bewertungen

#### **Status-Tracking:**
- 👀 **Angesehen** - Profil wurde betrachtet
- ⭐ **Favorisiert** - Als interessant markiert
- 📞 **Kontaktiert** - Nachricht gesendet
- 🎯 **Interviewed** - Gespräch geführt
- ✅ **Angebot** - Job-Angebot unterbreitet

## 📄 Lebenslauf-Zugriff

### Download-Berechtigungen
Je nach Access Level können Unternehmen:

#### **View/Browse Level:**
- ❌ Keine CV-Downloads
- ✅ Grundlegende Profil-Infos
- ✅ Skills und Erfahrungsangaben

#### **Contact Level:**
- ✅ CV-Download für kontaktierte Kandidaten
- ✅ Vollständige Profil-Details
- ✅ Kontaktinformationen

#### **Full Level:**
- ✅ Alle CVs der Pool-Mitglieder
- ✅ Bulk-Download-Funktionen
- ✅ Advanced Analytics

### CV-Viewer Interface

#### **Document Features:**
- 📄 **PDF-Viewer** - Direktanzeige im Browser
- 📥 **Download** - PDF auf lokalen Rechner
- 🔍 **Suche** - Text-Suche im Dokument
- 📊 **Analyse** - Skills und Qualität

## 📊 Analytics & Reporting

### Dashboard-Metriken

#### **Pool-Performance:**
- 🏊‍♂️ **Aktive Pools** - Anzahl verfügbarer Pools
- 👥 **Gesamt-Reach** - Verfügbare Kandidaten
- 📞 **Kontakt-Rate** - % kontaktierte Kandidaten
- ✅ **Erfolgs-Rate** - % erfolgreiche Einstellungen

#### **Recruiting-Pipeline:**
- 👀 **Profile Views** - Angesehene Kandidaten
- ⭐ **Favoriten** - Markierte Interessenten
- 📞 **Kontakte** - Aufgenommene Kommunikation
- 🎯 **Interviews** - Geplante/durchgeführte Gespräche
- ✅ **Offers** - Unterbreitete Angebote

### Reports & Exports

#### **Verfügbare Reports:**
- 📊 **Pool-Übersicht** - Detaillierte Pool-Statistiken
- 👥 **Kandidaten-Report** - Liste aller verfügbaren Talente
- 📈 **Aktivitäts-Report** - Eigene Recruiting-Aktivitäten
- 🎯 **Match-Analyse** - Erfolgreiche vs. erfolglose Kontakte
- 💰 **ROI-Report** - Kosten pro erfolgreicher Einstellung

#### **Export-Formate:**
- 📋 **CSV** - Daten für Excel/Google Sheets
- 📊 **PDF** - Professionelle Reports
- 📄 **Excel** - Detaillierte Analysen
- 📈 **Charts** - Grafische Auswertungen

## 🎯 Best Practices für Unternehmen

### Effiziente Pool-Nutzung
1. **Profile vollständig ansehen** - Alle verfügbaren Informationen prüfen
2. **Skills-Match beachten** - Hohe Übereinstimmung priorisieren
3. **Rechtzeitig kontaktieren** - Interessante Kandidaten schnell ansprechen
4. **Professionell kommunizieren** - Seriöse Ansprache verwenden

### Kandidaten-Auswahl optimieren
1. **Filter strategisch nutzen** - Relevante Kriterien fokussieren
2. **Quality Score beachten** - Höhere Scores bevorzugen
3. **Diversität berücksichtigen** - Vielfältige Kandidaten einbeziehen
4. **Pipeline aufbauen** - Kontinuierlich neue Talente identifizieren

### Erfolg messen
1. **KPIs definieren** - Klare Erfolgskriterien festlegen
2. **Regelmäßig auswerten** - Monatliche Performance-Reviews
3. **Feedback geben** - Kandidaten-Erfahrungen verbessern
4. **Prozesse optimieren** - Basierend auf Analytics anpassen

## 🔒 Datenschutz & Compliance

### Datenschutz-Richtlinien
- ✅ **DSGVO-konform** - Alle Daten entsprechend verarbeitet
- ✅ **Zweckbindung** - Daten nur für Recruiting verwenden
- ✅ **Minimierung** - Nur notwendige Daten zugreifen
- ✅ **Sicherheit** - Verschlüsselte Übertragung und Speicherung

### Nutzungsrichtlinien
- ❌ **Keine Weitergabe** - Kandidaten-Daten nicht an Dritte
- ❌ **Keine Speicherung** - Downloads nur temporär verwenden
- ✅ **Respektvoller Umgang** - Professionelle Kommunikation
- ✅ **Feedback geben** - Konstruktive Rückmeldungen

## 🆘 Support & Hilfe

### Häufige Fragen

#### **1. Warum kann ich bestimmte CVs nicht downloaden?**
- Access Level prüfen (Contact+ erforderlich)
- Admin um höheren Zugang bitten
- Kandidat zuerst kontaktieren

#### **2. Wie kontaktiere ich Kandidaten?**
- Über interne Messaging-Funktion
- Professionelle Ansprache verwenden
- Konkrete Position/Projekt erwähnen

#### **3. Pool-Zugang fehlt?**
- Admin kontaktieren für Zuweisung
- Gewünschtes Access Level spezifizieren
- Business Case für Zugang erläutern

### Support-Kontakt
- **Technische Probleme:** support@mysync.de
- **Pool-Zugang:** admin@mysync.de
- **Datenschutz-Fragen:** privacy@mysync.de

---

**Unternehmen-Dashboard Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 