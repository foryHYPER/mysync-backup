"use client"

import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  IconBriefcase, 
  IconChartAreaLine, 
  IconClock,
  IconTrendingUp,
  IconUsers,
  IconEye,
  IconMessage,
  IconStar,
  IconCalendar,
  IconTarget,
  IconActivity,
  IconTrendingDown,
  IconArrowRight
} from "@tabler/icons-react";
import { CandidateMatchChart } from "@/components/candidate-match-chart";
import { CandidateStatusChart } from "@/components/candidate-status-chart";
import { CandidateMonthlyChart } from "@/components/candidate-monthly-chart";
import { CandidateSuccessMetrics } from "@/components/candidate-success-metrics";

type Application = {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  match_score: string;
  created_at: string;
  location: string;
  raw_created_at: string;
  raw_match_score: number;
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
  thisWeekApplications: number;
  thisMonthApplications: number;
  matchTrend: 'up' | 'down' | 'neutral';
  skillsInDemand: string[];
  nextSteps: string[];
};

type ActivityItem = {
  id: string;
  type: 'match' | 'invitation' | 'response' | 'update';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'pending' | 'info';
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    averageMatchScore: 0,
    interviewInvitations: 0,
    topMatchScore: 0,
    responseRate: 0,
    thisWeekApplications: 0,
    thisMonthApplications: 0,
    matchTrend: 'neutral',
    skillsInDemand: [],
    nextSteps: []
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
            location: match.job_postings?.location || "Remote",
            raw_created_at: match.created_at,
            raw_match_score: match.match_score
          }));
          setApplications(formattedData);

          // Enhanced dashboard stats calculation
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const totalApps = matches.length;
          const activeApps = matches.filter(m => m.status === "pending" || m.status === "reviewed").length;
          const avgScore = totalApps > 0 ? matches.reduce((acc, m) => acc + m.match_score, 0) / totalApps : 0;
          const invitations = matches.filter(m => m.status === "contacted").length;
          const topScore = totalApps > 0 ? Math.max(...matches.map(m => m.match_score)) : 0;
          const responses = matches.filter(m => m.status !== "pending").length;
          const responseRate = totalApps > 0 ? (responses / totalApps) * 100 : 0;
          
          const thisWeekApps = matches.filter(m => new Date(m.created_at) >= oneWeekAgo).length;
          const thisMonthApps = matches.filter(m => new Date(m.created_at) >= oneMonthAgo).length;
          
          // Calculate match trend
          const recentMatches = matches.filter(m => new Date(m.created_at) >= oneWeekAgo);
          const olderMatches = matches.filter(m => new Date(m.created_at) < oneWeekAgo && new Date(m.created_at) >= oneMonthAgo);
          const recentAvg = recentMatches.length > 0 ? recentMatches.reduce((acc, m) => acc + m.match_score, 0) / recentMatches.length : avgScore;
          const olderAvg = olderMatches.length > 0 ? olderMatches.reduce((acc, m) => acc + m.match_score, 0) / olderMatches.length : avgScore;
          
          let matchTrend: 'up' | 'down' | 'neutral' = 'neutral';
          if (recentAvg > olderAvg + 5) matchTrend = 'up';
          else if (recentAvg < olderAvg - 5) matchTrend = 'down';

          setStats({
            totalApplications: totalApps,
            activeApplications: activeApps,
            averageMatchScore: Math.round(avgScore),
            interviewInvitations: invitations,
            topMatchScore: Math.round(topScore),
            responseRate: Math.round(responseRate),
            thisWeekApplications: thisWeekApps,
            thisMonthApplications: thisMonthApps,
            matchTrend,
            skillsInDemand: ["React", "TypeScript", "Node.js"], // Mock data - could be enhanced with real analysis
            nextSteps: [
              "Profil aktualisieren",
              "Neue Skills hinzufügen", 
              "Portfolio erweitern"
            ]
          });

          // Generate activity timeline
          const activities: ActivityItem[] = matches.slice(0, 5).map((match, index) => ({
            id: match.id,
            type: match.status === 'contacted' ? 'invitation' : 'match',
            title: match.status === 'contacted' ? 'Interview-Einladung erhalten' : 'Neuer Job-Match',
            description: `${match.job_postings?.companies?.name} - ${match.job_postings?.title}`,
            time: new Date(match.created_at).toLocaleDateString("de-DE"),
            status: match.status === 'contacted' ? 'success' : match.status === 'pending' ? 'pending' : 'info'
          }));
          setActivities(activities);
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Willkommen zurück! Hier ist Ihre aktuelle Karriere-Übersicht.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <IconActivity className="h-4 w-4 mr-2" />
              Aktivitäten
            </Button>
            <Button size="sm">
              <IconTarget className="h-4 w-4 mr-2" />
              Profil optimieren
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Bewerbungen</p>
                  <p className="text-2xl font-bold">{stats.activeApplications}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      +{stats.thisWeekApplications} diese Woche
                    </Badge>
                  </div>
                </div>
                <IconBriefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Durchschn. Match</p>
                  <p className="text-2xl font-bold">{stats.averageMatchScore}%</p>
                  <div className="flex items-center mt-2">
                    {stats.matchTrend === 'up' ? (
                      <IconTrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : stats.matchTrend === 'down' ? (
                      <IconTrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      Trend: {stats.matchTrend === 'up' ? 'Steigend' : stats.matchTrend === 'down' ? 'Fallend' : 'Stabil'}
                    </span>
                  </div>
                </div>
                <IconChartAreaLine className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interview-Einladungen</p>
                  <p className="text-2xl font-bold">{stats.interviewInvitations}</p>
                  <div className="mt-2">
                    <Progress value={(stats.interviewInvitations / Math.max(stats.totalApplications, 1)) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.interviewInvitations / Math.max(stats.totalApplications, 1)) * 100)}% Erfolgsrate
                    </p>
                  </div>
                </div>
                <IconMessage className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Match-Score</p>
                  <p className="text-2xl font-bold">{stats.topMatchScore}%</p>
                  <div className="flex items-center mt-2">
                    <IconStar className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-muted-foreground">
                      Bester Match
                    </span>
                  </div>
                </div>
                <IconTarget className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline & Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Letzte Aktivitäten
              </CardTitle>
              <CardDescription>
                Ihre neuesten Bewerbungs-Updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconActivity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Aktivitäten vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrendingUp className="h-5 w-5" />
                Nächste Schritte
              </CardTitle>
              <CardDescription>
                Empfehlungen zur Optimierung Ihres Profils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{step}</span>
                    <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Skills im Trend</span>
                    <IconStar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {stats.skillsInDemand.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Match Score Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChartAreaLine className="h-5 w-5" />
                Match-Score Entwicklung
              </CardTitle>
              <CardDescription>
                Entwicklung Ihrer Match-Scores über die Zeit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <CandidateMatchChart data={applications} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconChartAreaLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Match-Daten verfügbar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Status-Verteilung
              </CardTitle>
              <CardDescription>
                Verteilung Ihrer Bewerbungsstatus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <CandidateStatusChart data={applications} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Status-Daten verfügbar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Progress & Interview Success */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Monatlicher Fortschritt
              </CardTitle>
              <CardDescription>
                Ihre Bewerbungsaktivität pro Monat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <CandidateMonthlyChart data={applications} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconCalendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine monatlichen Daten verfügbar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Rate Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Erfolgs-Metriken
              </CardTitle>
              <CardDescription>
                Ihre Bewerbungserfolg im Detail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateSuccessMetrics data={applications} stats={stats} />
            </CardContent>
          </Card>
        </div>

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
    </div>
  );
} 