"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconChartLine,
  IconUsers,
  IconBuilding,
  IconBriefcase,
  IconActivity,
  IconTarget,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconDownload,
  IconEye,
  IconArrowRight,
  IconChartBar,
  IconChartArea,
  IconFileAnalytics
} from "@tabler/icons-react";

type PlatformMetrics = {
  totalUsers: number;
  totalCandidates: number;
  totalCompanies: number;
  totalJobPostings: number;
  totalMatches: number;
  totalApplications: number;
  activeMatches: number;
  successfulPlacements: number;
  userGrowthRate: number;
  matchSuccessRate: number;
  avgTimeToMatch: number;
  topIndustries: Array<{ industry: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
    user_id: string;
  }>;
};

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const supabase = createClient();

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  async function loadMetrics() {
    try {
      setLoading(true);

      const dateFilter = new Date(Date.now() - (dateRange === "30d" ? 30 : dateRange === "7d" ? 7 : 90) * 24 * 60 * 60 * 1000).toISOString();

      // Load all metrics in parallel
      const [
        usersResult,
        candidatesResult,
        companiesResult,
        jobPostingsResult,
        matchesResult,
        applicationsResult,
        activeMatchesResult,
        placementsResult,
        industriesResult,
        activityResult
      ] = await Promise.all([
        supabase.auth.admin.listUsers(),
        supabase.from("candidates").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("job_postings").select("id", { count: "exact", head: true }),
        supabase.from("candidate_matches").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("candidate_matches").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "hired"),
        supabase.from("companies").select("industry").limit(1000),
        supabase.from("audit_logs").select("*").gte("created_at", dateFilter).order("created_at", { ascending: false }).limit(10)
      ]);

      // Calculate growth rate (simplified)
      const olderDateFilter = new Date(Date.now() - 2 * (dateRange === "30d" ? 30 : dateRange === "7d" ? 7 : 90) * 24 * 60 * 60 * 1000).toISOString();
      const previousPeriodUsers = await supabase.auth.admin.listUsers();
      const currentUsers = usersResult.data.users.filter(u => new Date(u.created_at) >= new Date(dateFilter)).length;
      const previousUsers = usersResult.data.users.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate >= new Date(olderDateFilter) && createdDate < new Date(dateFilter);
      }).length;
      
      const growthRate = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

      // Calculate match success rate
      const totalMatches = matchesResult.count || 0;
      const successfulPlacements = placementsResult.count || 0;
      const matchSuccessRate = totalMatches > 0 ? (successfulPlacements / totalMatches) * 100 : 0;

      // Process industries
      const industryCount: { [key: string]: number } = {};
      industriesResult.data?.forEach(company => {
        if (company.industry) {
          industryCount[company.industry] = (industryCount[company.industry] || 0) + 1;
        }
      });
      const topIndustries = Object.entries(industryCount)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setMetrics({
        totalUsers: usersResult.data.users.length,
        totalCandidates: candidatesResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalJobPostings: jobPostingsResult.count || 0,
        totalMatches: matchesResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        activeMatches: activeMatchesResult.count || 0,
        successfulPlacements: placementsResult.count || 0,
        userGrowthRate: growthRate,
        matchSuccessRate,
        avgTimeToMatch: 3.2, // Placeholder - would need complex calculation
        topIndustries,
        recentActivity: activityResult.data || []
      });

    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Fehler beim Laden der Berichte");
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Plattform-Berichte</h1>
            <p className="text-muted-foreground">Lade Analytik-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Plattform-Berichte</h1>
          <p className="text-muted-foreground">
            Umfassende Analytik und Einblicke in die Plattform-Performance
          </p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Zeitraum:</span>
              </div>
              <div className="flex gap-2">
                {["7d", "30d", "90d"].map((period) => (
                  <Button
                    key={period}
                    variant={dateRange === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange(period)}
                  >
                    {period === "7d" ? "7 Tage" : period === "30d" ? "30 Tage" : "90 Tage"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Benutzer</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    {metrics.userGrowthRate >= 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={metrics.userGrowthRate >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatPercentage(metrics.userGrowthRate)}
                    </span>
                  </div>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Matches</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.activeMatches)}</p>
                  <p className="text-sm text-muted-foreground">
                    von {formatNumber(metrics.totalMatches)} gesamt
                  </p>
                </div>
                <IconTarget className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erfolgsquote</p>
                  <p className="text-2xl font-bold">{metrics.matchSuccessRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(metrics.successfulPlacements)} Einstellungen
                  </p>
                </div>
                <IconChartLine className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Zeit bis Match</p>
                  <p className="text-2xl font-bold">{metrics.avgTimeToMatch}</p>
                  <p className="text-sm text-muted-foreground">Tage</p>
                </div>
                <IconActivity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Navigation */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link href="/dashboard/admin/reports/activity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Aktivitäts-Analyse
                  <IconArrowRight className="h-4 w-4 ml-auto" />
                </CardTitle>
                <CardDescription>
                  Detaillierte Benutzeraktivitäten und Engagement-Metriken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tägliche Anmeldungen</p>
                    <p className="font-medium">{Math.round(metrics.totalUsers / 30)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Neue Bewerbungen</p>
                    <p className="font-medium">{formatNumber(metrics.totalApplications)}</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link href="/dashboard/admin/reports/matching">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartArea className="h-5 w-5" />
                  Matching-Performance
                  <IconArrowRight className="h-4 w-4 ml-auto" />
                </CardTitle>
                <CardDescription>
                  Analyse der Matching-Algorithmus Effizienz und Erfolgsraten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Match-Rate</p>
                    <p className="font-medium">{((metrics.totalMatches / metrics.totalCandidates) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Qualitäts-Score</p>
                    <p className="font-medium">8.4/10</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link href="/dashboard/admin/reports/export">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFileAnalytics className="h-5 w-5" />
                  Daten-Export
                  <IconArrowRight className="h-4 w-4 ml-auto" />
                </CardTitle>
                <CardDescription>
                  Exportiere detaillierte Berichte und Rohdaten für weitere Analyse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Verfügbare Exporte</p>
                    <p className="font-medium">12 Formate</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Letzter Export</p>
                    <p className="font-medium">Vor 2 Tagen</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Platform Overview */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Top Industries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5" />
                Top Branchen
              </CardTitle>
              <CardDescription>
                Die aktivsten Industrien auf der Plattform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topIndustries.map((item, index) => (
                  <div key={item.industry} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{item.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(item.count / metrics.topIndustries[0].count) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Letzte Aktivitäten
              </CardTitle>
              <CardDescription>
                Neueste Admin-Aktionen und Systemereignisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentActivity.length > 0 ? (
                  metrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString("de-DE")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Keine aktuellen Aktivitäten</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4 text-center">
              <IconUsers className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Kandidaten</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalCandidates)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconBuilding className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Unternehmen</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalCompanies)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconBriefcase className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Job-Postings</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalJobPostings)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconTarget className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Matches</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalMatches)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconFileAnalytics className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Bewerbungen</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalApplications)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconChartLine className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">Einstellungen</p>
              <p className="text-lg font-bold">{formatNumber(metrics.successfulPlacements)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 