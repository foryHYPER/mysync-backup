"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconChartBar,
  IconUsers,
  IconActivity,
  IconLogin,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowLeft,
  IconEye,
  IconDownload,
  IconRefresh,
  IconClock,
  IconUserPlus,
  IconMail
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActivityMetrics = {
  totalSessions: number;
  avgSessionDuration: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  bounceRate: number;
  newUserSignups: number;
  returningUsers: number;
  peakHours: Array<{ hour: number; count: number }>;
  userTypeActivity: {
    candidates: number;
    companies: number;
    admins: number;
  };
  topPages: Array<{ page: string; views: number; uniqueUsers: number }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
};

type UserActivity = {
  id: string;
  email: string;
  role: string;
  last_sign_in_at: string;
  sign_in_count: number;
  session_duration: number;
  pages_visited: number;
  actions_performed: number;
  status: "active" | "inactive";
};

export default function ActivityReportPage() {
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    loadActivityData();
  }, [dateRange, userTypeFilter]);

  async function loadActivityData() {
    try {
      setLoading(true);

      const dateFilter = new Date(Date.now() - (dateRange === "30d" ? 30 : dateRange === "7d" ? 7 : 90) * 24 * 60 * 60 * 1000).toISOString();

      // Load auth users for activity analysis
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      // Filter users by type if specified
      let filteredUsers = authUsers.users;
      if (userTypeFilter !== "all") {
        filteredUsers = authUsers.users.filter(user => 
          user.user_metadata?.role === userTypeFilter || 
          user.app_metadata?.role === userTypeFilter
        );
      }

      // Calculate basic metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dailyActiveUsers = authUsers.users.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= oneDayAgo
      ).length;

      const weeklyActiveUsers = authUsers.users.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= oneWeekAgo
      ).length;

      const monthlyActiveUsers = authUsers.users.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= oneMonthAgo
      ).length;

      const newUserSignups = authUsers.users.filter(user => 
        new Date(user.created_at) >= new Date(dateFilter)
      ).length;

      // Calculate user type activity
      const userTypeActivity = {
        candidates: authUsers.users.filter(u => 
          (u.user_metadata?.role === 'candidate' || u.app_metadata?.role === 'candidate') &&
          u.last_sign_in_at && new Date(u.last_sign_in_at) >= oneWeekAgo
        ).length,
        companies: authUsers.users.filter(u => 
          (u.user_metadata?.role === 'company' || u.app_metadata?.role === 'company') &&
          u.last_sign_in_at && new Date(u.last_sign_in_at) >= oneWeekAgo
        ).length,
        admins: authUsers.users.filter(u => 
          (u.user_metadata?.role === 'admin' || u.app_metadata?.role === 'admin') &&
          u.last_sign_in_at && new Date(u.last_sign_in_at) >= oneWeekAgo
        ).length,
      };

      // Generate mock peak hours data (in a real app, this would come from analytics)
      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: Math.floor(Math.random() * 50) + 10
      }));

      // Generate mock top pages data
      const topPages = [
        { page: "/dashboard", views: 1250, uniqueUsers: 420 },
        { page: "/jobs", views: 980, uniqueUsers: 380 },
        { page: "/candidates", views: 750, uniqueUsers: 290 },
        { page: "/profile", views: 650, uniqueUsers: 250 },
        { page: "/messages", views: 520, uniqueUsers: 180 }
      ];

      const activityMetrics: ActivityMetrics = {
        totalSessions: Math.floor(monthlyActiveUsers * 2.5),
        avgSessionDuration: 12.5, // minutes
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        bounceRate: 23.5,
        newUserSignups,
        returningUsers: monthlyActiveUsers - newUserSignups,
        peakHours,
        userTypeActivity,
        topPages,
        deviceStats: {
          desktop: 65,
          mobile: 30,
          tablet: 5
        }
      };

      // Process user activities for the table
      const userActivityData: UserActivity[] = filteredUsers.map(user => ({
        id: user.id,
        email: user.email || "Unbekannt",
        role: user.user_metadata?.role || user.app_metadata?.role || "unbekannt",
        last_sign_in_at: user.last_sign_in_at || user.created_at,
        sign_in_count: Math.floor(Math.random() * 50) + 1, // Mock data
        session_duration: Math.floor(Math.random() * 30) + 5, // Mock data
        pages_visited: Math.floor(Math.random() * 20) + 3, // Mock data
        actions_performed: Math.floor(Math.random() * 15) + 1, // Mock data
        status: user.last_sign_in_at && new Date(user.last_sign_in_at) >= oneWeekAgo ? "active" : "inactive"
      }));

      setMetrics(activityMetrics);
      setUserActivities(userActivityData);

    } catch (error) {
      console.error("Error loading activity data:", error);
      toast.error("Fehler beim Laden der Aktivitätsdaten");
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      candidate: { label: "Kandidat", variant: "default" as const },
      company: { label: "Unternehmen", variant: "secondary" as const },
      admin: { label: "Admin", variant: "destructive" as const }
    };
    const roleInfo = roleMap[role as keyof typeof roleMap] || { label: role, variant: "outline" as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status === "active" ? "Aktiv" : "Inaktiv"}
      </Badge>
    );
  };

  const userActivityColumns: ColumnDef<UserActivity>[] = [
    {
      accessorKey: "email",
      header: "Benutzer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.email}</span>
          <div className="mt-1">{getRoleBadge(row.original.role)}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Letzte Aktivität",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.original.last_sign_in_at).toLocaleDateString("de-DE")}</span>
          <span className="text-muted-foreground">
            {new Date(row.original.last_sign_in_at).toLocaleTimeString("de-DE", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sign_in_count",
      header: "Anmeldungen",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.sign_in_count}</span>
      ),
    },
    {
      accessorKey: "session_duration",
      header: "Ø Sitzungsdauer",
      cell: ({ row }) => (
        <span className="text-sm">{formatDuration(row.original.session_duration)}</span>
      ),
    },
    {
      accessorKey: "pages_visited",
      header: "Seiten besucht",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pages_visited}</span>
      ),
    },
    {
      accessorKey: "actions_performed",
      header: "Aktionen",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.actions_performed}</span>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Aktivitäts-Analyse</h1>
            <p className="text-muted-foreground">Lade Aktivitätsdaten...</p>
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
              Zurück zu Berichten
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Aktivitäts-Analyse</h1>
            <p className="text-muted-foreground">
              Detaillierte Benutzeraktivitäten und Engagement-Metriken
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Benutzertyp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Benutzer</SelectItem>
                    <SelectItem value="candidate">Kandidaten</SelectItem>
                    <SelectItem value="company">Unternehmen</SelectItem>
                    <SelectItem value="admin">Administratoren</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadActivityData}>
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Aktualisieren
                </Button>
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Activity Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Täglich aktive Benutzer</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.dailyActiveUsers)}</p>
                  <p className="text-sm text-muted-foreground">Letzte 24h</p>
                </div>
                <IconActivity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wöchentlich aktiv</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.weeklyActiveUsers)}</p>
                  <p className="text-sm text-muted-foreground">Letzte 7 Tage</p>
                </div>
                <IconUsers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neue Anmeldungen</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.newUserSignups)}</p>
                  <p className="text-sm text-muted-foreground">Im Zeitraum</p>
                </div>
                <IconUserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Sitzungsdauer</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.avgSessionDuration)}</p>
                  <p className="text-sm text-muted-foreground">Pro Besuch</p>
                </div>
                <IconClock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Type Activity & Top Pages */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChartBar className="h-5 w-5" />
                Aktivität nach Benutzertyp
              </CardTitle>
              <CardDescription>Wöchentlich aktive Benutzer pro Rolle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Kandidaten</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatNumber(metrics.userTypeActivity.candidates)}</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${(metrics.userTypeActivity.candidates / Math.max(...Object.values(metrics.userTypeActivity))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Unternehmen</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatNumber(metrics.userTypeActivity.companies)}</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{
                          width: `${(metrics.userTypeActivity.companies / Math.max(...Object.values(metrics.userTypeActivity))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Admins</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatNumber(metrics.userTypeActivity.admins)}</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{
                          width: `${(metrics.userTypeActivity.admins / Math.max(...Object.values(metrics.userTypeActivity))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" />
                Meist besuchte Seiten
              </CardTitle>
              <CardDescription>Top Seiten nach Aufrufen und eindeutigen Besuchern</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topPages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{page.page}</span>
                    </div>
                    <div className="flex flex-col text-right text-sm">
                      <span className="font-medium">{formatNumber(page.views)} Aufrufe</span>
                      <span className="text-muted-foreground">{formatNumber(page.uniqueUsers)} Benutzer</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <IconLogin className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gesamt Sitzungen</p>
              <p className="text-lg font-bold">{formatNumber(metrics.totalSessions)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconUsers className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Wiederkehrende Benutzer</p>
              <p className="text-lg font-bold">{formatNumber(metrics.returningUsers)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconActivity className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Absprungrate</p>
              <p className="text-lg font-bold">{metrics.bounceRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <IconChartBar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Desktop Nutzer</p>
              <p className="text-lg font-bold">{metrics.deviceStats.desktop}%</p>
            </CardContent>
          </Card>
        </div>

        {/* User Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzer-Aktivitätsdetails</CardTitle>
            <CardDescription>
              Detaillierte Aktivitätsmetriken für einzelne Benutzer ({userActivities.length} Benutzer)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={userActivityColumns} 
              data={userActivities}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 