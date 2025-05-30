"use client"

import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";

type Application = {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  match_score: string;
  created_at: string;
  location: string;
};

type RawMatch = {
  id: string;
  status: string;
  match_score: number;
  created_at: string;
  job_postings: {
    title: string;
    location: string | null;
    companies: {
      name: string;
    } | null;
  } | null;
};

const candidateColumns: ColumnDef<Application>[] = [
  { accessorKey: "company_name", header: "Unternehmen" },
  { accessorKey: "job_title", header: "Position" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "match_score", header: "Match %" },
  { accessorKey: "created_at", header: "Erstellt am" },
  { accessorKey: "location", header: "Standort" },
];

export default function CandidateDashboard() {
  const profile = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      try {
        // Lade die Matches/Bewerbungen des Kandidaten
        const { data: matches } = await supabase
          .from("candidate_matches")
          .select(`
            *,
            job_postings(
              title,
              location,
              companies(name)
            )
          `)
          .eq("candidate_id", profile.id)
          .order("created_at", { ascending: false });

        if (matches) {
          const formattedData: Application[] = matches.map((match: RawMatch) => ({
            id: match.id,
            company_name: match.job_postings?.companies?.name || "Unbekannt",
            job_title: match.job_postings?.title || "Unbekannte Position",
            status: getStatusText(match.status),
            match_score: `${Math.round(match.match_score)}%`,
            created_at: new Date(match.created_at).toLocaleDateString("de-DE"),
            location: match.job_postings?.location || "Remote"
          }));
          setApplications(formattedData);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, supabase]);

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Ausstehend";
      case "reviewed": return "Geprüft";
      case "contacted": return "Kontaktiert";
      case "rejected": return "Abgelehnt";
      default: return status;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable 
            columns={candidateColumns} 
            data={loading ? [] : applications} 
          />
        </div>
      </div>
    </div>
  );
} 