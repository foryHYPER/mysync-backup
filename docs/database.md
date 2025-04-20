1. profiles
Zentrale Tabelle für alle User, referenziert die Supabase‑Auth‑User


Feld	Typ	Constraint	Beschreibung
id	uuid	PK, FK → auth.users(id)	identisch mit Supabase‑Auth ID
role	text	NOT NULL, CHECK(role IN ('admin','company','candidate'))	Rolle des Users
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()	


2. companies
Ergänzende Daten für Role = company


Feld	Typ	Constraint	Beschreibung
id	uuid	PK, FK → profiles(id)	
name	text	NOT NULL	Firmenname
website	text		
address	text		
contact_name	text		Ansprechpartner
contact_email	text		
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()


3. candidates
Ergänzende Daten für Role = candidate


Feld	Typ	Constraint	Beschreibung
id	uuid	PK, FK → profiles(id)	
first_name	text	NOT NULL	
last_name	text	NOT NULL	
email	text	NOT NULL, UNIQUE	
phone	text		
resume_url	text		Link zum Lebenslauf
profile_photo_url	text		
skills	jsonb		z. B. [{ "skill": "React", "level": "advanced" }, …]
availability	jsonb		z. B. Wochentage, Zeitfenster
status	text	DEFAULT 'active', CHECK(status IN ('active','inactive'))	Kandidaten‑Status
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()	


4. job_postings (optional)
Wenn du später Matching anhand von Stellenprofilen automatisieren willst


Feld	Typ	Constraint	Beschreibung
id	uuid	PK	
company_id	uuid	FK → companies(id)	
title	text	NOT NULL	Jobtitel
description	text		
requirements	jsonb		z. B. Skills‑Array, Erfahrung
location	text		
salary_range	text		
status	text	DEFAULT 'open', CHECK(status IN ('open','closed'))	
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()	


5. invitations
Interview‑Einladungen von Company → Candidate


Feld	Typ	Constraint	Beschreibung
id	uuid	PK	
company_id	uuid	FK → companies(id)	
candidate_id	uuid	FK → candidates(id)	
job_id	uuid	FK → job_postings(id), NULLABLE	optional
proposed_at	timestamptz	NOT NULL	vorgeschlagener Termin
location	text		Raum oder Video‑Link
message	text		Freitext für Einladung
status	text	DEFAULT 'pending', CHECK(status IN ('pending','accepted','declined'))	
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()	


6. notifications
Alle In‑App‑ und E‑Mail‑Benachrichtigungen


Feld	Typ	Constraint	Beschreibung
id	uuid	PK	
user_id	uuid	FK → profiles(id)	Empfänger
type	text	NOT NULL	z. B. invitation_pending, reminder
payload	jsonb		Metadaten (z. B. Einladungstext, Link)
is_read	boolean	DEFAULT false	
created_at	timestamptz	DEFAULT now()	


7. audit_logs
Schreibt alle CRUD‑Aktionen für Compliance & Debugging


Feld	Typ	Constraint	Beschreibung
id	uuid	PK	
user_id	uuid	FK → profiles(id), NULLABLE	wer’s ausgelöst hat
action	text	NOT NULL	create/update/delete
table_name	text	NOT NULL	betroffene Tabelle
record_id	uuid		ID des Datensatzes
old_data	jsonb		vorheriger Zustand
new_data	jsonb		geänderter Zustand
created_at	timestamptz	DEFAULT now()	


8. calendar_integrations
OAuth‑Daten für Google/Outlook


Feld	Typ	Constraint	Beschreibung
id	uuid	PK	
user_id	uuid	FK → profiles(id)	
provider	text	CHECK(provider IN ('google','outlook'))	
access_token	text		
refresh_token	text		
expires_at	timestamptz		
enabled	boolean	DEFAULT true	
created_at	timestamptz	DEFAULT now()	
updated_at	timestamptz	DEFAULT now()	


9. skills + candidate_skills (optional Feintuning)
Zulässt saubere Many‑to‑Many‑Verknüpfung

skills(id uuid PK, name text UNIQUE)

candidate_skills(candidate_id → candidates.id, skill_id → skills.id, level text)

Beziehungen & RLS
FK‑Constraints halten die Konsistenz (z. B. invitations.company_id → companies.id).

RLS‑Policies in Supabase:

companies nur lesbar/schreibbar für Role=company mit profiles.id = auth.uid()

candidates analog für Role=candidate

invitations nur company_id = auth.uid() oder candidate_id = auth.uid()

Admin (role='admin') bekommt Zugriff auf alle Tabellen