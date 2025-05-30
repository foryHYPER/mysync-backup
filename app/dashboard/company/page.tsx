"use client"

import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { Database } from "@/lib/database.types";

type JobPosting = {
  id: string;
  title: string;
  location: string;
  status: string;
  match_count: string;
  created_at: string;
  candidate_count: string;
};

type JobPostingWithRelations = Database['public']['Tables']['job_postings']['Row'] & {
  _count: {
    candidate_matches: number;
  };
  candidate_matches: {
    status: string;
  }[];
};

const companyColumns: ColumnDef<JobPosting>[] = [
  { accessorKey: "title", header: "Position" },
  { accessorKey: "location", header: "Standort" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "match_count", header: "Matches" },
  { accessorKey: "candidate_count", header: "Aktive Kandidaten" },
  { accessorKey: "created_at", header: "Erstellt am" },
];

export default function CompanyDashboard() {
  const profile = useProfile();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      try {
        // Lade die Stellenanzeigen der Firma
        const { data: posts, error } = await supabase
          .from("job_postings")
          .select(`
            *,
            _count {
              candidate_matches
            },
            candidate_matches (
              status
            )
          `)
          .eq("company_id", profile.id)
          .order("created_at", { ascending: false })
          .returns<JobPostingWithRelations[]>();

        if (error) throw error;

        if (posts) {
          const formattedData: JobPosting[] = posts.map((post) => ({
            id: post.id,
            title: post.title,
            location: post.location || "Remote",
            status: getStatusText(post.status),
            match_count: post._count.candidate_matches.toString(),
            candidate_count: getActiveCandidatesCount(post.candidate_matches),
            created_at: new Date(post.created_at).toLocaleDateString("de-DE"),
          }));
          setJobPostings(formattedData);
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
      case "draft": return "Entwurf";
      case "active": return "Aktiv";
      case "paused": return "Pausiert";
      case "closed": return "Geschlossen";
      default: return status;
    }
  };

  const getActiveCandidatesCount = (matches: { status: string }[]) => {
    // Zählt nur Kandidaten mit aktiven Status (nicht rejected)
    return matches.filter(match => 
      match.status !== "rejected"
    ).length.toString();
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
            columns={companyColumns} 
            data={loading ? [] : jobPostings} 
          />
        </div>
      </div>
    </div>
  );
} 