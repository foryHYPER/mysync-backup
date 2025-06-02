"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { 
  IconSwimming, 
  IconUsers, 
  IconStar,
  IconEye,
  IconHeart,
  IconCalendar,
  IconTrendingUp,
  IconActivity,
  IconAward,
  IconBuilding
} from "@tabler/icons-react";

type PoolAccess = {
  id: string;
  pool_id: string;
  pool_name: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  access_level: "view" | "select" | "contact";
  candidate_count: number;
  max_candidates?: number;
  my_selections: number;
  expires_at?: string;
  last_activity?: string;
};

type DashboardStats = {
  totalPools: number;
  totalCandidates: number;
  totalSelections: number;
  thisMonthSelections: number;
  activeConversations: number;
  expiringAccess: number;
};

const poolColumns: ColumnDef<PoolAccess>[] = [
  {
    accessorKey: "pool_name",
    header: "Pool-Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div>
          <div className="font-medium">{row.original.pool_name}</div>
          <div className="flex items-center gap-2 mt-1">
            {getPoolTypeBadge(row.original.pool_type)}
            {getAccessLevelBadge(row.original.access_level)}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "candidate_count",
    header: "Kandidaten",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconUsers className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.candidate_count}</span>
        {row.original.max_candidates && (
          <span className="text-muted-foreground">/ {row.original.max_candidates}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "my_selections",
    header: "Meine Auswahlen",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconHeart className="h-4 w-4 text-red-500" />
        <span className="font-medium">{row.original.my_selections}</span>
      </div>
    ),
  },
  {
    accessorKey: "expires_at",
    header: "Zugang läuft ab",
    cell: ({ row }) => {
      if (!row.original.expires_at) {
        return <span className="text-muted-foreground">Unbegrenzt</span>;
      }
      
      const expiryDate = new Date(row.original.expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className={daysUntilExpiry <= 7 ? "text-red-600 font-medium" : ""}>
            {expiryDate.toLocaleDateString("de-DE")}
          </span>
          {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
            <Badge variant="destructive" className="text-xs">
              {daysUntilExpiry} Tage
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aktionen",
    cell: ({ row }) => (
      <Link href={`/dashboard/company/pools/${row.original.pool_id}`}>
        <Button variant="outline" size="sm">
          <IconEye className="h-4 w-4 mr-2" />
          Pool öffnen
        </Button>
      </Link>
    ),
  },
];

function getPoolTypeBadge(type: PoolAccess["pool_type"]) {
  switch (type) {
    case "main":
      return <Badge variant="default" className="bg-blue-600">Hauptpool</Badge>;
    case "featured":
      return <Badge variant="default" className="bg-purple-600">Featured</Badge>;
    case "premium":
      return <Badge variant="default" className="bg-yellow-600">Premium</Badge>;
    case "custom":
      return <Badge variant="outline">Custom</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getAccessLevelBadge(level: PoolAccess["access_level"]) {
  switch (level) {
    case "contact":
      return <Badge variant="default" className="bg-green-600">Kontaktieren</Badge>;
    case "select":
      return <Badge variant="default" className="bg-blue-600">Auswählen</Badge>;
    case "view":
      return <Badge variant="outline">Anzeigen</Badge>;
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
}

export default function CompanyDashboard() {
  const profile = useProfile();
  const [poolAccess, setPoolAccess] = useState<PoolAccess[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData();
    }
  }, [profile?.id]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load pool access
      const { data: poolAccessData, error: accessError } = await supabase
        .from("pool_company_access")
        .select(`
          *,
          pool:candidate_pools(
            id,
            name,
            pool_type,
            max_candidates
          )
        `)
        .eq("company_id", profile?.id)
        .order("granted_at", { ascending: false });

      if (accessError) throw accessError;

      if (poolAccessData) {
        const enrichedPools = await Promise.all(
          poolAccessData.map(async (access) => {
            if (!access.pool) return null;

            // Get candidate count
            const { count: candidateCount } = await supabase
              .from("pool_candidates")
              .select("*", { count: "exact", head: true })
              .eq("pool_id", access.pool_id);

            // Get my selections count
            const { count: selectionsCount } = await supabase
              .from("candidate_selections")
              .select("*", { count: "exact", head: true })
              .eq("company_id", profile?.id)
              .eq("pool_id", access.pool_id);

            return {
              id: access.id,
              pool_id: access.pool_id,
              pool_name: access.pool.name,
              pool_type: access.pool.pool_type || "custom",
              access_level: access.access_level,
              candidate_count: candidateCount || 0,
              max_candidates: access.pool.max_candidates,
              my_selections: selectionsCount || 0,
              expires_at: access.expires_at,
              last_activity: access.granted_at
            } as PoolAccess;
          })
        );

        const validPools = enrichedPools.filter(pool => pool !== null) as PoolAccess[];
        setPoolAccess(validPools);

        // Calculate dashboard statistics
        await loadStats(validPools);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Fehler beim Laden der Dashboard-Daten");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(pools: PoolAccess[]) {
    try {
      const totalPools = pools.length;
      const totalCandidates = pools.reduce((sum, pool) => sum + pool.candidate_count, 0);
      const totalSelections = pools.reduce((sum, pool) => sum + pool.my_selections, 0);

      // Get selections from this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { count: thisMonthSelections } = await supabase
        .from("candidate_selections")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile?.id)
        .gte("created_at", oneMonthAgo.toISOString());

      // Count expiring access (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringAccess = pools.filter(pool => 
        pool.expires_at && 
        new Date(pool.expires_at) <= thirtyDaysFromNow
      ).length;

      setStats({
        totalPools,
        totalCandidates,
        totalSelections,
        thisMonthSelections: thisMonthSelections || 0,
        activeConversations: 0, // TODO: Implement when messaging system is ready
        expiringAccess
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard wird geladen...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Willkommen, {profile?.contact_name || "Unternehmen"}
          </h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre verfügbaren Kandidaten-Pools und Aktivitäten
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verfügbare Pools</p>
                    <p className="text-2xl font-bold">{stats.totalPools}</p>
                  </div>
                  <IconSwimming className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamt Kandidaten</p>
                    <p className="text-2xl font-bold">{stats.totalCandidates}</p>
                  </div>
                  <IconUsers className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Meine Auswahlen</p>
                    <p className="text-2xl font-bold">{stats.totalSelections}</p>
                    <p className="text-xs text-muted-foreground">
                      +{stats.thisMonthSelections} diesen Monat
                    </p>
                  </div>
                  <IconHeart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ablaufende Zugriffe</p>
                    <p className="text-2xl font-bold">{stats.expiringAccess}</p>
                    <p className="text-xs text-muted-foreground">
                      In den nächsten 30 Tagen
                    </p>
                  </div>
                  <IconCalendar className={`h-8 w-8 ${stats.expiringAccess > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Ihre Kandidaten-Pools</h2>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Zugriffe auf Kandidaten-Pools und deren Berechtigungen
            </p>
          </div>
          <Link href="/dashboard/company/pools">
            <Button>
              <IconSwimming className="h-4 w-4 mr-2" />
              Alle Pools anzeigen
            </Button>
          </Link>
        </div>

        {/* Pools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pool-Übersicht</CardTitle>
            <CardDescription>
              {poolAccess.length > 0 
                ? `Sie haben Zugriff auf ${poolAccess.length} Pool(s)`
                : "Sie haben noch keinen Zugriff auf Pools"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {poolAccess.length > 0 ? (
              <DataTable 
                columns={poolColumns} 
                data={poolAccess}
              />
            ) : (
              <div className="text-center py-8">
                <IconSwimming className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Pools verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Sie haben noch keinen Zugriff auf Kandidaten-Pools. 
                  Kontaktieren Sie den Administrator für Zugriff.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/company/contact">
                    Administrator kontaktieren
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {stats && stats.thisMonthSelections > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Ihre Aktivität
              </CardTitle>
              <CardDescription>
                Zusammenfassung Ihrer Pool-Aktivitäten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <IconTrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{stats.thisMonthSelections} Auswahlen</p>
                    <p className="text-sm text-muted-foreground">Diesen Monat</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <IconAward className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium">
                      {poolAccess.filter(p => p.pool_type === "featured").length} Featured Pools
                    </p>
                    <p className="text-sm text-muted-foreground">Premium Zugang</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <IconBuilding className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {poolAccess.filter(p => p.access_level === "contact").length} Kontakt-Zugriffe
                    </p>
                    <p className="text-sm text-muted-foreground">Vollzugriff</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 