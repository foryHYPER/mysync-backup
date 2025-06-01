# Kandidaten-Dashboard Dokumentation

## 📋 Übersicht

Das Kandidaten-Dashboard ermöglicht es Bewerbern, ihr Profil zu verwalten, Lebensläufe hochzuladen und den Bewerbungsstatus zu verfolgen.

## 🎯 Kandidaten-Features

### 1. 👤 Profil-Management
- **Persönliche Daten** - Name, Kontakt, Standort
- **Berufliche Informationen** - Erfahrung, Skills, Verfügbarkeit
- **Profilfoto** - Avatar-Upload via URL
- **Fähigkeiten** - Skill-Tags hinzufügen/verwalten

### 2. 📄 Lebenslauf-Upload (NEU!)
- **Drag & Drop Upload** - Einfacher PDF-Upload
- **Automatische Analyse** - Skills-Extraktion
- **Status-Tracking** - Überprüfungsfortschritt verfolgen
- **Qualitäts-Feedback** - Score und Verbesserungsvorschläge

### 3. 🏊‍♂️ Pool-Teilnahme
- **Pool-Übersicht** - Verfügbare Kandidaten-Pools
- **Bewerbungsstatus** - Fortschritt in verschiedenen Pools
- **Matching-Ergebnisse** - Übereinstimmung mit Unternehmen
- **Kommunikation** - Nachrichten von Unternehmen

### 4. 📊 Dashboard & Analytics
- **Aktivitäts-Übersicht** - Bewerbungsaktivitäten
- **Profile-Views** - Wer hat mein Profil angesehen
- **Match-Statistiken** - Erfolgreiche Matches
- **Fortschritts-Tracking** - Bewerbungspipeline

## 🔗 Navigation

### Haupt-Menü
```
/dashboard/candidate/
├── 📊 Dashboard (Übersicht)
├── 👤 Profil
│   ├── Persönliche Daten
│   ├── Lebenslauf-Upload
│   ├── Skills & Kompetenzen
│   └── Verfügbarkeit
├── 🏊‍♂️ Pools
│   ├── Verfügbare Pools
│   ├── Meine Bewerbungen
│   └── Match-Ergebnisse
├── 💬 Nachrichten
├── 📊 Statistiken
└── ⚙️ Einstellungen
```

## 🎯 Wichtige URLs

| Feature | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | `/dashboard/candidate` | Haupt-Dashboard |
| **Profil** | `/dashboard/candidate/profile` | Profil bearbeiten |
| **Pools** | `/dashboard/candidate/pools` | Pool-Übersicht |
| **Bewerbungen** | `/dashboard/candidate/applications` | Bewerbungsstatus |
| **Nachrichten** | `/dashboard/candidate/messages` | Kommunikation |
| **Einstellungen** | `/dashboard/candidate/settings` | Account-Einstellungen |

## ✨ Lebenslauf-Upload System (v1.0)

### 📄 Upload-Funktionalität
Das neue Lebenslauf-Upload-System bietet:

#### **Upload-Features:**
- ✅ **Drag & Drop Interface** - Einfache Datei-Auswahl
- ✅ **PDF/DOC/DOCX Support** - Unterstützte Dateiformate
- ✅ **10MB Maximum** - Dateigröße-Limit
- ✅ **Progress-Anzeige** - Upload-Fortschritt in Echtzeit
- ✅ **Validierung** - Automatische Dateiprüfung
- ✅ **Ersatz-Upload** - Alte Dateien überschreiben

#### **Automatische Analyse:**
- 🤖 **Skills-Extraktion** - Automatische Skill-Erkennung
- 📊 **Quality-Assessment** - Qualitätsbewertung 1-100
- 🎓 **Education-Detection** - Bildungsabschlüsse erkennen
- 💼 **Experience-Calculation** - Berufserfahrung berechnen
- 🗣️ **Language-Detection** - Sprachkenntnisse identifizieren

#### **Status-Tracking:**
- ⏳ **Pending** - Wartet auf Admin-Review
- 🔍 **Under Review** - Wird aktuell geprüft
- ✅ **Approved** - Genehmigt und verfügbar
- ❌ **Rejected** - Abgelehnt mit Feedback

## 🚀 Quick Start für Kandidaten

### 1. Account erstellen
```
1. Zu /dashboard/candidate/register
2. E-Mail und Passwort eingeben
3. E-Mail-Bestätigung klicken
4. Profil vervollständigen
```

### 2. Profil einrichten
```
1. Zu /dashboard/candidate/profile
2. Persönliche Daten eingeben
3. Lebenslauf hochladen (PDF)
4. Skills hinzufügen
5. Verfügbarkeit setzen
```

### 3. Pools erkunden
```
1. Zu /dashboard/candidate/pools
2. Verfügbare Pools durchsuchen
3. Für interessante Pools bewerben
4. Status verfolgen
```

## 🛠️ Funktionen im Detail

### 1. Profil-Management

#### **Persönliche Informationen:**
- 👤 **Name** - Vor- und Nachname (erforderlich)
- 📧 **E-Mail** - Kontakt (nicht änderbar)
- 📞 **Telefon** - Rückruf-Nummer (optional)
- 📍 **Standort** - Stadt, Land
- 📸 **Profilfoto** - Avatar via URL

#### **Berufliche Informationen:**
- 💼 **Berufserfahrung** - Jahre Erfahrung (0-50)
- 🎯 **Skills & Kompetenzen** - Fähigkeiten-Tags
- ⏰ **Verfügbarkeit** - Ab sofort oder Datum
- 📄 **Lebenslauf** - PDF-Upload oder URL

### 2. Lebenslauf-Upload Interface

#### **Upload-Bereich:**
```
┌─────────────────────────────────────┐
│   📄 Lebenslauf-Upload              │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │     📁 Datei hier ablegen   │   │
│   │        oder                 │   │
│   │     [durchsuchen]           │   │
│   │                             │   │
│   │   PDF, DOC, DOCX bis 10MB   │   │
│   └─────────────────────────────┘   │
│                                     │
│   💡 Tipp: Nach dem Upload wird    │
│      Ihr Lebenslauf automatisch    │
│      analysiert und überprüft.     │
└─────────────────────────────────────┘
```

#### **Upload-Ablauf:**
```
1. Datei auswählen/droppen
   ↓
2. Validierung (Typ, Größe)
   ↓
3. Upload zu Supabase Storage
   ↓
4. Datenbank-Eintrag erstellen
   ↓
5. Automatische Analyse starten
   ↓
6. Status: "Pending Review"
   ↓
7. Admin-Benachrichtigung
   ↓
8. Kandidat erhält Status-Update
```

### 3. Skills-Management

#### **Skill-Input:**
- 🔍 **Autovervollständigung** - Existierende Skills vorschlagen
- ➕ **Neue Skills** - Eigene Fähigkeiten hinzufügen
- 🏷️ **Skill-Tags** - Visuelle Darstellung
- ❌ **Skills entfernen** - Einfaches Löschen

#### **Skill-Kategorien:**
- 💻 **Technische Skills** - Programmiersprachen, Tools
- 💬 **Soft Skills** - Kommunikation, Leadership
- 🗣️ **Sprachen** - Sprachkenntnisse
- 🎓 **Zertifizierungen** - Qualifikationen

### 4. Pool-Teilnahme

#### **Pool-Übersicht:**
- 🏊‍♂️ **Verfügbare Pools** - Offene Bewerbungen
- 📊 **Match-Score** - Passung in Prozent
- 🏷️ **Pool-Tags** - Anforderungen
- 📅 **Bewerbungsfrist** - Deadline

#### **Bewerbungsstatus:**
- ⏳ **Eingereicht** - Bewerbung ist eingegangen
- 👀 **In Betrachtung** - Wird von Unternehmen geprüft
- ⭐ **Shortlisted** - Auf Kandidaten-Liste
- 📞 **Kontaktiert** - Unternehmen hat Kontakt aufgenommen
- ❌ **Abgelehnt** - Bewerbung nicht erfolgreich

## 🔒 Datenschutz & Sicherheit

### **Datenschutz-Kontrollen:**
- 👁️ **Profil-Sichtbarkeit** - Öffentlich/Privat
- 📧 **E-Mail-Benachrichtigungen** - An/Aus
- 🔐 **Account-Sicherheit** - Passwort-Management
- 🗑️ **Daten-Löschung** - Account komplett löschen

### **DSGVO-Compliance:**
- ✅ **Einwilligung** - Explizite Zustimmung zur Datenverarbeitung
- 📋 **Transparenz** - Klare Information über Datennutzung
- ✏️ **Korrektur** - Daten jederzeit änderbar
- 🗑️ **Löschungsrecht** - Account und Daten vollständig löschbar

## 🐛 Häufige Probleme & Lösungen

### Upload-Probleme

#### **1. Upload schlägt fehl**
```
Problem: "Upload-Fehler" Meldung
Lösungen:
- Dateigröße prüfen (max. 10MB)
- Dateiformat prüfen (PDF/DOC/DOCX)
- Internet-Verbindung überprüfen
- Browser-Cache leeren
```

#### **2. Datei wird nicht angezeigt**
```
Problem: Upload erfolgreich aber nicht sichtbar
Lösungen:
- Seite neu laden (F5)
- Browser-Cache leeren
- Anderen Browser testen
```

#### **3. Analyse dauert zu lange**
```
Problem: "Analyse ausstehend" seit Stunden
Info: Normale Bearbeitungszeit 24-48h
Aktion: Bei länger als 3 Tagen Support kontaktieren
```

### Profil-Probleme

#### **1. Skills werden nicht gespeichert**
```
Problem: Hinzugefügte Skills verschwinden
Lösungen:
- Nach jeder Änderung "Speichern" klicken
- JavaScript im Browser aktivieren
- Browser-Kompatibilität prüfen
```

#### **2. Profilfoto wird nicht angezeigt**
```
Problem: Avatar zeigt kein Bild
Lösungen:
- URL auf HTTPS prüfen
- Bildformat prüfen (JPG/PNG)
- Direkte Bild-URL verwenden (nicht Webseite)
```

## 📞 Support & Hilfe

### Selbsthilfe-Ressourcen
- **[Resume-Upload Guide](./resume-upload.md)** - Detaillierte Upload-Anleitung
- **[Pool-Participation Guide](./pool-participation.md)** - Bewerbungsprozess
- **[Profile-Setup Guide](./profile-setup.md)** - Profil optimieren

### Support-Kontakt
Bei anhaltenden Problemen:
1. Browser-Konsole auf Fehler prüfen (F12)
2. Screenshot des Problems erstellen
3. Support via Contact-Form kontaktieren
4. Admin-Team benachrichtigen

### System-Status
- **Aktueller Status:** Alle Systeme funktional
- **Bekannte Issues:** Keine
- **Wartungsfenster:** Sonntags 2-4 Uhr

## 📈 Erfolgs-Tipps

### Profil-Optimierung
- ✅ **Vollständiges Profil** - Alle Felder ausfüllen
- ✅ **Aktueller Lebenslauf** - Regelmäßig aktualisieren
- ✅ **Relevante Skills** - Passende Fähigkeiten hinzufügen
- ✅ **Professionelles Foto** - Seriöses Profilbild

### Bewerbungs-Strategie
- 🎯 **Passende Pools** - Auf Skills abgestimmte Pools
- 📊 **Match-Score beachten** - Hohe Übereinstimmung bevorzugen
- ⏰ **Rechtzeitig bewerben** - Fristen einhalten
- 💬 **Proaktiv kommunizieren** - Auf Nachrichten antworten

---

**Kandidaten-Dashboard Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 