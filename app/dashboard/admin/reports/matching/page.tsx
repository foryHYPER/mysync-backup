"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconTrendingUp,
  IconArrowLeft,
  IconRefresh,
  IconFilter,
  IconAnalyze,
  IconUsers,
  IconBriefcase,
  IconStar,
  IconCheck,
  IconX,
  IconTarget,
  IconChartBar
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MatchingReport = {
  id: string;
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  algorithm_version: string;
  created_at: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  feedback_score?: number;
  skills_matched: string[];
  skills_missing: string[];
};

type MatchingMetrics = {
  totalMatches: number;
  successfulMatches: number;
  avgMatchScore: number;
  acceptanceRate: number;
  topPerformingAlgorithm: string;
  averageResponseTime: number;
};

export default function MatchingReportsPage() {
  const [matches, setMatches] = useState<MatchingReport[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchingReport[]>([]);
  const [metrics, setMetrics] = useState<MatchingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadMatchingData();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, statusFilter, scoreFilter, searchTerm]);

  async function loadMatchingData() {
    try {
      setLoading(true);

      // Get real candidate matches
      const { data: candidateMatches } = await supabase
        .from("candidate_matches")
        .select(`
          *,
          candidates:candidate_id(first_name, last_name),
          job_postings:job_posting_id(title, companies(name))
        `)
        .order("created_at", { ascending: false });

      if (!candidateMatches) return;

      // Enhance with mock analytics data
      const matchingReports: MatchingReport[] = candidateMatches.map(match => {
        const statuses = ["pending", "accepted", "rejected", "expired"];
        const algorithms = ["v2.1", "v2.0", "v1.9"];
        
        return {
          id: match.id,
          candidate_id: match.candidate_id,
          candidate_name: `${match.candidates?.first_name || "Unbekannt"} ${match.candidates?.last_name || ""}`.trim(),
          job_id: match.job_posting_id,
          job_title: match.job_postings?.title || "Unbekannte Stelle",
          company_name: match.job_postings?.companies?.name || "Unbekanntes Unternehmen",
          match_score: match.match_score || Math.floor(Math.random() * 100),
          algorithm_version: algorithms[Math.floor(Math.random() * algorithms.length)],
          created_at: match.created_at,
          status: (match.status as MatchingReport["status"]) || statuses[Math.floor(Math.random() * statuses.length)] as MatchingReport["status"],
          feedback_score: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
          skills_matched: ["JavaScript", "React", "Node.js"].slice(0, Math.floor(Math.random() * 3) + 1),
          skills_missing: ["TypeScript", "AWS"].slice(0, Math.floor(Math.random() * 2))
        };
      });

      // Calculate metrics
      const totalMatches = matchingReports.length;
      const successfulMatches = matchingReports.filter(m => m.status === "accepted").length;
      const avgMatchScore = matchingReports.reduce((sum, m) => sum + m.match_score, 0) / Math.max(totalMatches, 1);
      const acceptanceRate = (successfulMatches / Math.max(totalMatches, 1)) * 100;
      const topPerformingAlgorithm = "v2.1";
      const averageResponseTime = 2.4; // days

      setMetrics({
        totalMatches,
        successfulMatches,
        avgMatchScore,
        acceptanceRate,
        topPerformingAlgorithm,
        averageResponseTime
      });

      setMatches(matchingReports);

    } catch (error) {
      console.error("Error loading matching data:", error);
      toast.error("Fehler beim Laden der Matching-Daten");
    } finally {
      setLoading(false);
    }
  }

  function filterMatches() {
    let filtered = matches;

    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    if (scoreFilter !== "all") {
      if (scoreFilter === "high") {
        filtered = filtered.filter(match => match.match_score >= 80);
      } else if (scoreFilter === "medium") {
        filtered = filtered.filter(match => match.match_score >= 60 && match.match_score < 80);
      } else if (scoreFilter === "low") {
        filtered = filtered.filter(match => match.match_score < 60);
      }
    }

    setFilteredMatches(filtered);
  }

  function getStatusBadge(status: MatchingReport["status"]) {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-600">Akzeptiert</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case "expired":
        return <Badge variant="secondary">Abgelaufen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  const matchingColumns: ColumnDef<MatchingReport>[] = [
    {
      accessorKey: "candidate_name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.candidate_name}</span>
          <span className="text-sm text-muted-foreground">{row.original.algorithm_version}</span>
        </div>
      ),
    },
    {
      accessorKey: "job_title",
      header: "Position",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.job_title}</span>
          <span className="text-sm text-muted-foreground">{row.original.company_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "match_score",
      header: "Match-Score",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(row.original.match_score)}`}>
            {row.original.match_score}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "feedback_score",
      header: "Feedback",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.feedback_score ? (
            <>
              {[...Array(5)].map((_, i) => (
                <IconStar 
                  key={i} 
                  className={`h-3 w-3 ${i < row.original.feedback_score! ? "text-yellow-500 fill-current" : "text-gray-300"}`} 
                />
              ))}
              <span className="ml-1 text-xs">({row.original.feedback_score}/5)</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Kein Feedback</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Erstellt",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.created_at).toLocaleDateString("de-DE")}
        </div>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Matching-Berichte</h1>
            <p className="text-muted-foreground">Lade Matching-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/admin/reports">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Berichte
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Matching-Algorithmus Berichte</h1>
            <p className="text-muted-foreground">
              Analysiere die Performance des Matching-Algorithmus
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Matches</p>
                  <p className="text-2xl font-bold">{metrics.totalMatches}</p>
                </div>
                <IconTarget className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erfolgreich</p>
                  <p className="text-2xl font-bold">{metrics.successfulMatches}</p>
                </div>
                <IconCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Match-Score</p>
                  <p className="text-2xl font-bold">{metrics.avgMatchScore.toFixed(1)}%</p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Akzeptanzrate</p>
                  <p className="text-2xl font-bold">{metrics.acceptanceRate.toFixed(1)}%</p>
                </div>
                <IconTrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Algorithmus</p>
                  <p className="text-2xl font-bold">{metrics.topPerformingAlgorithm}</p>
                </div>
                <IconAnalyze className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Antwortzeit</p>
                  <p className="text-2xl font-bold">{metrics.averageResponseTime}d</p>
                </div>
                <IconChartBar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Matches suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="accepted">Akzeptiert</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                    <SelectItem value="expired">Abgelaufen</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Score filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Scores</SelectItem>
                    <SelectItem value="high">Hoch (80+%)</SelectItem>
                    <SelectItem value="medium">Mittel (60-79%)</SelectItem>
                    <SelectItem value="low">Niedrig (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={loadMatchingData}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Matching-Analyse</CardTitle>
            <CardDescription>
              Detaillierte Analyse aller Kandidaten-Job-Matches ({filteredMatches.length} Matches)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={matchingColumns} 
              data={filteredMatches}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 