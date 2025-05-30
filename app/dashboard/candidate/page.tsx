"use client"

import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

type DashboardStats = {
  totalApplications: number;
  activeApplications: number;
  averageMatchScore: number;
  interviewInvitations: number;
  topMatchScore: number;
  responseRate: number;
};

const candidateColumns: ColumnDef<Application>[] = [
  { 
    accessorKey: "company_name", 
    header: "Unternehmen",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("company_name")}</div>
    )
  },
  { 
    accessorKey: "job_title", 
    header: "Position",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">{row.getValue("job_title")}</div>
    )
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors = {
        "Ausstehend": "bg-yellow-100 text-yellow-800",
        "Geprüft": "bg-blue-100 text-blue-800",
        "Kontaktiert": "bg-green-100 text-green-800",
        "Abgelehnt": "bg-red-100 text-red-800"
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
      );
    }
  },
  { 
    accessorKey: "match_score", 
    header: "Match %",
    cell: ({ row }) => {
      const score = parseInt(row.getValue("match_score"));
      const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
      return (
        <div className={`font-medium ${color}`}>{row.getValue("match_score")}</div>
      );
    }
  },
  { 
    accessorKey: "created_at", 
    header: "Erstellt am",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("created_at")}</div>
    )
  },
  { 
    accessorKey: "location", 
    header: "Standort",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("location")}</div>
    )
  },
];

export default function CandidateDashboard() {
  const profile = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    averageMatchScore: 0,
    interviewInvitations: 0,
    topMatchScore: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 5;
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

          // Calculate dashboard stats
          const totalApps = matches.length;
          const activeApps = matches.filter(m => m.status === "pending" || m.status === "reviewed").length;
          const avgScore = matches.reduce((acc, m) => acc + m.match_score, 0) / totalApps;
          const invitations = matches.filter(m => m.status === "contacted").length;
          const topScore = Math.max(...matches.map(m => m.match_score));
          const responses = matches.filter(m => m.status !== "pending").length;
          const responseRate = (responses / totalApps) * 100;

          setStats({
            totalApplications: totalApps,
            activeApplications: activeApps,
            averageMatchScore: Math.round(avgScore),
            interviewInvitations: invitations,
            topMatchScore: Math.round(topScore),
            responseRate: Math.round(responseRate)
          });
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

  const paginatedData = applications.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(applications.length / pageSize);

  return (
    <main className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück! Hier finden Sie eine Übersicht Ihrer Bewerbungen und Statistiken.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Bewerbungen</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeApplications > 0 ? "+2" : "0"} seit letztem Monat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschnittlicher Match</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageMatchScore}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageMatchScore > 0 ? "+5%" : "0%"} seit letztem Monat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interview-Einladungen</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviewInvitations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.interviewInvitations > 0 ? "+1" : "0"} seit letztem Monat
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Match-Entwicklung</CardTitle>
            <CardDescription>
              Entwicklung Ihrer Match-Scores über die Zeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive />
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Bewerbungen</CardTitle>
            <CardDescription>
              Übersicht und Status Ihrer aktuellen Bewerbungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <input
                type="text"
                placeholder="Suchen..."
                className="h-9 rounded-md border px-3 text-sm font-medium text-[#000000] placeholder:text-[#000000] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <select 
                className="h-9 rounded-md border px-3 text-sm font-medium text-[#000000] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all" className="font-medium text-[#000000]">Alle Bewerbungen</option>
                <option value="pending" className="font-medium text-[#000000]">Ausstehend</option>
                <option value="reviewed" className="font-medium text-[#000000]">In Prüfung</option>
                <option value="contacted" className="font-medium text-[#000000]">Kontaktiert</option>
                <option value="rejected" className="font-medium text-[#000000]">Abgelehnt</option>
              </select>
            </div>
            <DataTable 
              columns={candidateColumns} 
              data={loading ? [] : paginatedData}
            />
            {!loading && applications.length > 0 && (
              <div className="mt-6 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="font-medium text-white bg-primary hover:bg-primary/90"
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pageCount - 1}
                  className="font-medium text-white bg-primary hover:bg-primary/90"
                >
                  Weiter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 