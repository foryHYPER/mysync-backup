# Resume-Management System

## 📋 Übersicht

Das Resume-Management System ermöglicht Administratoren die zentrale Verwaltung, Bewertung und Qualitätskontrolle aller Kandidaten-Lebensläufe.

## 🎯 Features

### ✅ Implementierte Funktionen

#### **Zentrale Resume-Verwaltung**
- 📄 **Alle Lebensläufe anzeigen** - Übersicht aller hochgeladenen CVs
- 🔍 **Such- und Filterfunktionen** - Nach Kandidat, Status, Qualität
- 📊 **Qualitäts-Bewertung** - Score von 1-100 Punkten
- ✅ **Status-Management** - Pending/Approved/Rejected/Under Review
- 📥 **Download-Funktion** - PDF-Download für echte Dateien
- 🏷️ **Skills-Extraktion** - Automatische Skill-Analyse
- 📈 **Analytics & Metriken** - Detaillierte Statistiken

#### **Workflow-Management**
- 🔄 **Bulk-Aktionen** - Mehrere Lebensläufe gleichzeitig bearbeiten
- 📝 **Reviewer-Notizen** - Kommentare für Bewertungen
- 📊 **Progress Tracking** - Bearbeitungsfortschritt verfolgen
- 🔔 **Status-Updates** - Automatische Benachrichtigungen

## 🔗 Navigation

### Resume-Management URLs
| Feature | URL | Beschreibung |
|---------|-----|--------------|
| **Resume-Übersicht** | `/dashboard/admin/resumes` | Alle Lebensläufe |
| **Kandidaten-CVs** | `/dashboard/admin/candidates` | CVs pro Kandidat |

### Interface-Bereiche
```
Resume-Management Dashboard:
├── 📊 Metriken-Karten
│   ├── Gesamt Lebensläufe
│   ├── Wartend auf Review
│   ├── Genehmigte CVs
│   ├── Abgelehnte CVs
│   ├── Durchschnitt Quality Score
│   └── Download-Statistiken
├── 🔍 Filter & Suche
│   ├── Status-Filter
│   ├── Qualitäts-Filter
│   └── Kandidaten-Suche
└── 📋 Resume-Tabelle
    ├── Kandidaten-Info
    ├── Datei-Details
    ├── Quality Score
    ├── Status-Badge
    ├── Analyse-Status
    └── Aktionen-Menü
```

## 📊 Resume-Metriken

### Dashboard-Übersicht
Die Resume-Management Seite zeigt folgende Metriken:

#### **Quantitative Metriken**
- 📄 **Gesamt Lebensläufe** - Anzahl aller Uploads
- ⏳ **Wartend auf Review** - Pending + Under Review
- ✅ **Genehmigte CVs** - Approved Status
- ❌ **Abgelehnte CVs** - Rejected Status
- 📥 **Download-Anzahl** - Gesamt-Downloads

#### **Qualitative Metriken**  
- ⭐ **Durchschnittlicher Quality Score** - Bewertung 1-100
- 📈 **Approval Rate** - % genehmigte vs. gesamte
- ⏱️ **Review Time** - Durchschnittliche Bearbeitungszeit
- 🎯 **Completion Rate** - % analysierte CVs

## 🛠️ Funktionen im Detail

### 1. Resume-Übersicht

#### **Tabellen-Spalten:**
```
Kandidat           | Datei                    | Quality Score | Status      | Analyse    | Aktionen
Max Mustermann     | Max_Mustermann_CV.pdf    | 85/100       | Genehmigt   | ✅         | 👁️ 📥 ⚙️
anna.schmidt@...   | 2.3 MB                   |              |             | Abgeschlossen|
```

#### **Filter-Optionen:**
- **Status-Filter:** Alle / Ausstehend / In Prüfung / Genehmigt / Abgelehnt
- **Qualitäts-Filter:** Alle / Hoch (80+) / Niedrig (<60) / Nicht analysiert
- **Kandidaten-Suche:** Name, E-Mail, Dateiname, Skills

### 2. Resume-Details Dialog

#### **Allgemeine Informationen**
- 👤 **Kandidaten-Name** - Vollständiger Name
- 📧 **E-Mail-Adresse** - Kontakt-Information
- 📄 **Dateiname** - Original-Dateiname
- 📏 **Dateigröße** - MB/KB Angabe
- 📅 **Upload-Datum** - Zeitstempel
- 📊 **Download-Count** - Anzahl Downloads
- 🎯 **Match-Count** - Anzahl Pool-Matches

#### **Analyse-Ergebnisse**
- ⭐ **Quality Score** - 1-100 mit visueller Anzeige
- 💼 **Berufserfahrung** - Jahre Erfahrung
- 🎓 **Bildungsabschluss** - Höchster Abschluss
- 🗣️ **Sprachen** - Sprachkenntnisse
- ✅ **Analyse-Status** - Abgeschlossen/Ausstehend

#### **Extrahierte Skills**
- 🏷️ **Skill-Tags** - Automatisch erkannte Fähigkeiten
- 📈 **Skill-Level** - Optional: Erfahrungslevel
- 🔗 **Skill-Kategorien** - Gruppierung (Tech, Soft Skills, etc.)

### 3. Resume-Aktionen

#### **Einzelaktionen:**
- 👁️ **Details anzeigen** - Modal mit allen Informationen
- 📥 **Download** - PDF-Datei herunterladen
- ✅ **Genehmigen** - Status auf "Approved" setzen
- ❌ **Ablehnen** - Status auf "Rejected" setzen
- 🔬 **Analyse starten** - Skills-Extraktion starten

#### **Bulk-Aktionen:**
- ✅ **Bulk Approve** - Mehrere CVs genehmigen
- ❌ **Bulk Reject** - Mehrere CVs ablehnen  
- 🔬 **Bulk Analyze** - Analyse für mehrere starten
- 📥 **Bulk Download** - ZIP-Download multiple PDFs

## 🔄 Workflow-Prozesse

### 1. Resume-Review-Prozess
```
1. Kandidat lädt CV hoch
   ↓
2. Status: "Pending" 
   ↓
3. Admin öffnet Resume-Management
   ↓
4. Filter: "Ausstehend"
   ↓
5. Resume-Details öffnen
   ↓
6. Quality Score bewerten
   ↓
7. Status entscheiden:
   • Genehmigen → "Approved"
   • Ablehnen → "Rejected"  
   • Weitere Prüfung → "Under Review"
   ↓
8. Optional: Reviewer-Notizen
   ↓
9. Kandidat wird benachrichtigt
```

### 2. Quality-Assessment-Workflow
```
Automatische Analyse:
├── Skills-Extraktion aus PDF-Text
├── Experience-Years aus Daten
├── Education-Level Identifikation  
├── Languages-Detection
└── Quality-Score Berechnung

Manual Review:
├── Automated Score prüfen
├── Manual Adjustments
├── Reviewer Notes hinzufügen
└── Final Status setzen
```

## 📥 Download-Funktionalität

### **Download-Features:**
- ✅ **Einzelner PDF-Download** - Direkt aus Supabase Storage
- ✅ **Bulk-ZIP-Download** - Mehrere PDFs in einem ZIP
- ✅ **Download-Counter** - Tracking der Zugriffe
- ✅ **Access-Control** - Nur Admins können downloaden
- ✅ **File-Validation** - Existenz-Prüfung vor Download

### **Download-Verhalten:**
```javascript
// Einzelner Download
handleDownload(resume) {
  1. Download-Counter erhöhen
  2. File aus Supabase Storage laden
  3. Browser-Download starten
  4. Success-Toast anzeigen
}

// Fallback für fehlende Dateien
if (file_not_found) {
  1. Placeholder-Text-Datei erstellen
  2. Demo-Download mit Hinweis
  3. Warning-Toast anzeigen
}
```

## 🔒 Sicherheit & Berechtigungen

### **Access Control:**
- ✅ **Admin-Only** - Nur Admins können Resume-Management nutzen
- ✅ **RLS Policies** - Row Level Security auf resumes-Tabelle
- ✅ **Storage Policies** - Sichere Datei-Zugriffe
- ✅ **Audit Logging** - Alle Download-Aktionen werden geloggt

### **RLS Policy Details:**
```sql
-- Admins können alle Resumes verwalten
CREATE POLICY resumes_admin_all ON resumes 
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Storage-Zugriff für Admins
CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() 
       AND profiles.role = 'admin'
     ))
  );
```

## 🛠️ Setup & Konfiguration

### 1. Datenbank-Setup
```bash
# Resumes-Tabelle erstellen
npm run setup-resumes

# Oder manuell via SQL:
# Führe scripts/fix-resumes-implementation.sql aus
```

### 2. Storage-Setup
- ✅ **Bucket "resumes"** - Automatisch erstellt
- ✅ **10MB File Limit** - Konfiguriert
- ✅ **PDF/DOC/DOCX** - Erlaubte Dateitypen
- ✅ **Private Bucket** - Nicht öffentlich zugänglich

### 3. Permissions prüfen
```bash
# Prüfen ob alles funktioniert
npx tsx scripts/create-resumes-table-simple.ts
```

## 🐛 Troubleshooting

### Häufige Probleme

#### **1. Keine Lebensläufe sichtbar**
```
Problem: Resume-Liste ist leer
Lösung:
- Prüfen ob resumes-Tabelle existiert
- RLS-Policies für Admin-Rolle überprüfen
- Browser-Cache leeren
```

#### **2. Download funktioniert nicht**
```
Problem: "Download gestartet" aber nichts passiert
Ursachen:
- Datei existiert nicht im Storage
- Storage-Policies blockieren Zugriff
- Browser blockiert Download

Lösung:
- Storage-Bucket "resumes" prüfen
- Storage-Policies überprüfen
- Placeholder-Download wird als Fallback erstellt
```

#### **3. Upload vom Kandidaten funktioniert nicht**
```
Problem: Kandidaten können keine CVs hochladen
Lösung:
- FileUpload-Komponente im Candidate-Profile prüfen
- Storage-Upload-Policies überprüfen
- Browser-Konsole auf JS-Fehler prüfen
```

### Debug-Commands
```bash
# Resume-System testen
npx tsx scripts/create-resumes-table-simple.ts

# Storage-Bucket prüfen
# → Supabase Dashboard > Storage > resumes

# RLS-Policies prüfen  
# → Supabase Dashboard > Database > Policies
```

## 📈 Analytics & Reporting

### Verfügbare Metriken
- 📊 **Upload-Trends** - CVs pro Zeitraum
- ⭐ **Quality-Distribution** - Score-Verteilung
- ⏱️ **Review-Performance** - Bearbeitungszeiten
- 🎯 **Approval-Rates** - Erfolgsquoten
- 📥 **Download-Patterns** - Zugriffsmuster

### Export-Funktionen
- 📋 **CSV-Export** - Resume-Daten
- 📊 **Excel-Reports** - Detaillierte Analytics
- 📈 **Dashboard-Widgets** - Live-Metriken

## 🔮 Geplante Features (Future)

### Phase 2 Enhancements
- 🤖 **KI-basierte Quality-Bewertung** - Automatisierte Scoring
- 📧 **E-Mail-Benachrichtigungen** - Status-Updates
- 🔄 **Versionierung** - Multiple CV-Versionen pro Kandidat
- 🏷️ **Advanced Tagging** - Custom Kategorien
- 📱 **Mobile-Optimierung** - Responsive Design
- 🔍 **Volltext-Suche** - PDF-Content-Suche

---

**Resume-Management Version:** 1.0.0 | **Letzte Aktualisierung:** Dezember 2024 