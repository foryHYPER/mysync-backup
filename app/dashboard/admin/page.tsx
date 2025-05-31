"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { 
  IconUsers, 
  IconBuilding, 
  IconUserCheck, 
  IconClipboardList,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconCalendar
} from "@tabler/icons-react";

type AdminStats = {
  totalUsers: number;
  totalCandidates: number;
  totalCompanies: number;
  totalAdmins: number;
  activeMatches: number;
  pendingInvitations: number;
  recentSignups: number;
  companiesNeedingApproval: number;
};

type RecentActivity = {
  id: string;
  action: string;
  table_name: string;
  user_email: string;
  created_at: string;
  record_id: string;
};

const activityColumns: ColumnDef<RecentActivity>[] = [
  { 
    accessorKey: "action", 
    header: "Aktion",
    cell: ({ row }) => (
      <Badge variant={
        row.original.action === "Erstellt" ? "default" : 
        row.original.action === "Aktualisiert" ? "secondary" : 
        "destructive"
      }>
        {row.original.action}
      </Badge>
    )
  },
  { accessorKey: "table_name", header: "Bereich" },
  { accessorKey: "user_email", header: "Benutzer" },
  { accessorKey: "created_at", header: "Zeitstempel" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCandidates: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    activeMatches: 0,
    pendingInvitations: 0,
    recentSignups: 0,
    companiesNeedingApproval: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);

        // Parallel data fetching for better performance
        const [
          { count: totalProfiles },
          { data: candidatesData },
          { data: companiesData },
          { data: adminsData },
          { count: activeMatches },
          { count: pendingInvitations },
          { data: auditLogs }
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("candidates").select("id, created_at"),
          supabase.from("companies").select("id, created_at, onboarding_status"),
          supabase.from("profiles").select("id").eq("role", "admin"),
          supabase.from("candidate_matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("invitations").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("audit_logs").select(`
            id, action, table_name, user_id, created_at, record_id
          `).order("created_at", { ascending: false }).limit(10)
        ]);

        // Calculate recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCandidates = candidatesData?.filter(c => 
          new Date(c.created_at) > sevenDaysAgo
        ).length || 0;
        const recentCompanies = companiesData?.filter(c => 
          new Date(c.created_at) > sevenDaysAgo
        ).length || 0;

        // Companies needing approval
        const needingApproval = companiesData?.filter(c => 
          c.onboarding_status === "not_started"
        ).length || 0;

        setStats({
          totalUsers: totalProfiles || 0,
          totalCandidates: candidatesData?.length || 0,
          totalCompanies: companiesData?.length || 0,
          totalAdmins: adminsData?.length || 0,
          activeMatches: activeMatches || 0,
          pendingInvitations: pendingInvitations || 0,
          recentSignups: recentCandidates + recentCompanies,
          companiesNeedingApproval: needingApproval,
        });

        // Format recent activity
        if (auditLogs) {
          const formattedActivity = auditLogs.map(log => ({
            id: log.id,
            action: getActionText(log.action),
            table_name: getTableText(log.table_name),
            user_email: log.user_id ? log.user_id.substring(0, 8) + "..." : "System",
            created_at: new Date(log.created_at).toLocaleString("de-DE"),
            record_id: log.record_id || "",
          }));
          setRecentActivity(formattedActivity);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Admin-Daten:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [supabase]);

  const getActionText = (action: string) => {
    switch (action) {
      case "create": return "Erstellt";
      case "update": return "Aktualisiert";
      case "delete": return "Gelöscht";
      default: return action;
    }
  };

  const getTableText = (table: string) => {
    switch (table) {
      case "profiles": return "Profile";
      case "companies": return "Unternehmen";
      case "candidates": return "Kandidaten";
      case "job_postings": return "Stellenanzeigen";
      case "invitations": return "Einladungen";
      case "candidate_matches": return "Matches";
      default: return table;
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    trendValue 
  }: {
    title: string;
    value: number;
    description: string;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : value.toLocaleString()}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && trendValue && (
            <Badge variant="outline" className="flex items-center gap-1">
              {trend === "up" ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
              {trendValue}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht über Ihr mySync-System und aktuelle Aktivitäten
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Gesamt Benutzer"
            value={stats.totalUsers}
            description="Alle registrierten Benutzer"
            icon={IconUsers}
            trend="up"
            trendValue={`+${stats.recentSignups} diese Woche`}
          />
          <StatCard
            title="Kandidaten"
            value={stats.totalCandidates}
            description="Aktive Kandidaten"
            icon={IconUserCheck}
          />
          <StatCard
            title="Unternehmen"
            value={stats.totalCompanies}
            description="Registrierte Unternehmen"
            icon={IconBuilding}
          />
          <StatCard
            title="Aktive Matches"
            value={stats.activeMatches}
            description="Wartende Matches"
            icon={IconActivity}
          />
        </div>

        {/* Action Items */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconClipboardList className="h-5 w-5" />
                Ausstehende Aktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Unternehmen genehmigen</span>
                <Badge variant={stats.companiesNeedingApproval > 0 ? "destructive" : "secondary"}>
                  {stats.companiesNeedingApproval}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Offene Einladungen</span>
                <Badge variant="outline">{stats.pendingInvitations}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Neue Anmeldungen</span>
                <Badge variant="outline">{stats.recentSignups}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Heute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("de-DE", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </div>
              <div className="text-2xl font-bold">{stats.recentSignups}</div>
              <div className="text-xs text-muted-foreground">
                Neue Registrierungen diese Woche
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors">
                Neuen Admin hinzufügen
              </button>
              <button className="w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors">
                Systembericht generieren
              </button>
              <button className="w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors">
                Backup erstellen
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconActivity className="h-5 w-5" />
              Letzte Systemaktivitäten
            </CardTitle>
            <CardDescription>
              Die neuesten Änderungen und Aktivitäten im System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={activityColumns} 
              data={recentActivity}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 