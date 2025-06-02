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
import { useProfile } from "@/context/ProfileContext";
import { 
  IconSwimming, 
  IconUsers, 
  IconStar,
  IconEye,
  IconHeart,
  IconFilter,
  IconSearch,
  IconCalendar,
  IconTrendingUp,
  IconAward,
  IconClock,
  IconChevronRight,
  IconAlertTriangle
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type AssignedPool = {
  id: string;
  pool_id: string;
  pool_name: string;
  pool_description?: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  access_level: "view" | "select" | "contact";
  candidate_count: number;
  max_candidates?: number;
  assigned_at: string;
  expires_at?: string;
  selection_count: number;
  utilization?: number;
  featured_candidates?: number;
  last_accessed?: string;
};

type PoolStats = {
  totalPools: number;
  totalCandidates: number;
  totalSelections: number;
  averageUtilization: number;
  expiringPools: number;
  featuredPools: number;
  accessLevelDistribution: { level: string; count: number }[];
  poolTypeDistribution: { type: string; count: number }[];
};

export default function CompanyPoolsPage() {
  const [assignedPools, setAssignedPools] = useState<AssignedPool[]>([]);
  const [filteredPools, setFilteredPools] = useState<AssignedPool[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const profile = useProfile();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.id) {
      loadAssignedPools();
    }
  }, [profile?.id]);

  useEffect(() => {
    filterPools();
  }, [assignedPools, searchTerm, typeFilter, accessFilter]);

  async function loadAssignedPools() {
    try {
      setLoading(true);

      // Load pools assigned to the current company
      const { data: poolAccess, error: accessError } = await supabase
        .from("pool_company_access")
        .select(`
          *,
          pool:candidate_pools(
            id,
            name,
            description,
            pool_type,
            max_candidates
          )
        `)
        .eq("company_id", profile?.id)
        .order("granted_at", { ascending: false });

      if (accessError) throw accessError;

      if (poolAccess) {
        // Get pool details and candidate counts for each pool access
        const enrichedPools = await Promise.all(
          poolAccess.map(async (access) => {
            try {
              if (!access.pool) {
                console.warn(`Pool with ID ${access.pool_id} not found, skipping...`);
                return null;
              }

              // Get candidate count
              const { count: candidateCount } = await supabase
                .from("pool_candidates")
                .select("*", { count: "exact", head: true })
                .eq("pool_id", access.pool_id);

              // Get featured candidates count
              const { count: featuredCount } = await supabase
                .from("pool_candidates")
                .select("*", { count: "exact", head: true })
                .eq("pool_id", access.pool_id)
                .eq("featured", true);

              // Get selection count for this company
              const { count: selectionCount } = await supabase
                .from("candidate_selections")
                .select("*", { count: "exact", head: true })
                .eq("company_id", profile?.id)
                .eq("pool_id", access.pool_id);

              // Calculate utilization if max_candidates is set
              const utilization = access.pool.max_candidates 
                ? Math.round((candidateCount || 0) / access.pool.max_candidates * 100)
                : undefined;

              return {
                id: access.id,
                pool_id: access.pool_id,
                pool_name: access.pool.name,
                pool_description: access.pool.description,
                pool_type: access.pool.pool_type || "custom",
                access_level: access.access_level,
                candidate_count: candidateCount || 0,
                max_candidates: access.pool.max_candidates,
                assigned_at: access.granted_at,
                expires_at: access.expires_at,
                selection_count: selectionCount || 0,
                utilization,
                featured_candidates: featuredCount || 0,
                last_accessed: access.granted_at
              } as AssignedPool;
            } catch (error) {
              console.error(`Error processing pool ${access.pool_id}:`, error);
              return null;
            }
          })
        );

        // Filter out null values (failed pool loads)
        const validPools = enrichedPools.filter(pool => pool !== null) as AssignedPool[];
        setAssignedPools(validPools);
        calculateStats(validPools);
      }
    } catch (error) {
      console.error("Error loading assigned pools:", error);
      toast.error("Fehler beim Laden der verfügbaren Pools");
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(pools: AssignedPool[]) {
    const totalPools = pools.length;
    const totalCandidates = pools.reduce((sum, pool) => sum + pool.candidate_count, 0);
    const totalSelections = pools.reduce((sum, pool) => sum + pool.selection_count, 0);
    
    // Calculate average utilization (only for pools with limits)
    const poolsWithLimits = pools.filter(p => p.max_candidates);
    const averageUtilization = poolsWithLimits.length > 0
      ? Math.round(poolsWithLimits.reduce((sum, pool) => sum + (pool.utilization || 0), 0) / poolsWithLimits.length)
      : 0;

    // Count expiring pools (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringPools = pools.filter(pool => 
      pool.expires_at && 
      new Date(pool.expires_at) <= thirtyDaysFromNow
    ).length;

    const featuredPools = pools.filter(pool => pool.pool_type === "featured").length;

    // Access level distribution
    const accessLevelDistribution = [
      { level: "Anzeigen", count: pools.filter(p => p.access_level === "view").length },
      { level: "Auswählen", count: pools.filter(p => p.access_level === "select").length },
      { level: "Kontaktieren", count: pools.filter(p => p.access_level === "contact").length }
    ].filter(item => item.count > 0);

    // Pool type distribution
    const poolTypeDistribution = [
      { type: "Hauptpool", count: pools.filter(p => p.pool_type === "main").length },
      { type: "Featured", count: pools.filter(p => p.pool_type === "featured").length },
      { type: "Premium", count: pools.filter(p => p.pool_type === "premium").length },
      { type: "Custom", count: pools.filter(p => p.pool_type === "custom").length }
    ].filter(item => item.count > 0);

    setStats({
      totalPools,
      totalCandidates,
      totalSelections,
      averageUtilization,
      expiringPools,
      featuredPools,
      accessLevelDistribution,
      poolTypeDistribution
    });
  }

  function filterPools() {
    let filtered = assignedPools;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pool =>
        pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.pool_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(pool => pool.pool_type === typeFilter);
    }

    // Access filter
    if (accessFilter !== "all") {
      filtered = filtered.filter(pool => pool.access_level === accessFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.pool_name.localeCompare(b.pool_name);
        case "candidates":
          return b.candidate_count - a.candidate_count;
        case "selections":
          return b.selection_count - a.selection_count;
        case "access_level":
          const accessOrder = { "contact": 3, "select": 2, "view": 1 };
          return (accessOrder[b.access_level] || 0) - (accessOrder[a.access_level] || 0);
        case "expires":
          if (!a.expires_at && !b.expires_at) return 0;
          if (!a.expires_at) return 1;
          if (!b.expires_at) return -1;
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredPools(filtered);
  }

  function getPoolTypeBadge(type: AssignedPool["pool_type"]) {
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

  function getAccessLevelBadge(level: AssignedPool["access_level"]) {
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

  function getUtilizationColor(utilization?: number) {
    if (!utilization) return "text-muted-foreground";
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 80) return "text-orange-600";
    if (utilization >= 60) return "text-yellow-600";
    return "text-green-600";
  }

  const poolColumns: ColumnDef<AssignedPool>[] = [
    {
      accessorKey: "pool_name",
      header: "Pool",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.pool_name}</div>
          <div className="flex items-center gap-2 mt-1">
            {getPoolTypeBadge(row.original.pool_type)}
            {getAccessLevelBadge(row.original.access_level)}
          </div>
          {row.original.pool_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {row.original.pool_description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "candidate_count",
      header: "Kandidaten",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <IconUsers className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.candidate_count}</span>
            {row.original.max_candidates && (
              <span className="text-muted-foreground">/ {row.original.max_candidates}</span>
            )}
          </div>
          {row.original.utilization && (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="w-20 bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      row.original.utilization >= 90 ? 'bg-red-500' :
                      row.original.utilization >= 80 ? 'bg-orange-500' :
                      row.original.utilization >= 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(row.original.utilization, 100)}%` }}
                  />
                </div>
                <span className={`text-xs ${getUtilizationColor(row.original.utilization)}`}>
                  {row.original.utilization}%
                </span>
              </div>
            </div>
          )}
          {(row.original.featured_candidates || 0) > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <IconStar className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                {row.original.featured_candidates} Featured
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "selection_count",
      header: "Meine Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconHeart className="h-4 w-4 text-red-500" />
          <span className="font-medium">{row.original.selection_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "expires_at",
      header: "Zugang",
      cell: ({ row }) => {
        if (!row.original.expires_at) {
          return (
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Unbegrenzt</span>
            </div>
          );
        }
        
        const expiryDate = new Date(row.original.expires_at);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className={daysUntilExpiry <= 7 ? "text-red-600 font-medium" : ""}>
                {expiryDate.toLocaleDateString("de-DE")}
              </span>
            </div>
            {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <IconAlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">
                  {daysUntilExpiry} Tage verbleibend
                </span>
              </div>
            )}
            {daysUntilExpiry <= 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                Abgelaufen
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
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Pools werden geladen...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Pools</h1>
            <p className="text-muted-foreground">
              Ihre verfügbaren Pools und deren Kandidaten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadAssignedPools()}>
              <IconTrendingUp className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
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
                  </div>
                  <IconHeart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Featured Pools</p>
                    <p className="text-2xl font-bold">{stats.featuredPools}</p>
                    {stats.expiringPools > 0 && (
                      <p className="text-xs text-orange-600">
                        {stats.expiringPools} laufen bald ab
                      </p>
                    )}
                  </div>
                  <IconAward className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="pools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pools">
              <IconSwimming className="h-4 w-4 mr-2" />
              Pool-Übersicht ({filteredPools.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <IconTrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pools">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ihre Pools</CardTitle>
                    <CardDescription>
                      Verwalten Sie Ihre Zugriffe auf Kandidaten-Pools
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex items-center gap-2 flex-1">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pool suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Pool-Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Typen</SelectItem>
                      <SelectItem value="main">Hauptpool</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={accessFilter} onValueChange={setAccessFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Zugriff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Zugriffe</SelectItem>
                      <SelectItem value="view">Anzeigen</SelectItem>
                      <SelectItem value="select">Auswählen</SelectItem>
                      <SelectItem value="contact">Kontaktieren</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sortieren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="candidates">Kandidaten</SelectItem>
                      <SelectItem value="selections">Auswahlen</SelectItem>
                      <SelectItem value="access_level">Zugriffslevel</SelectItem>
                      <SelectItem value="expires">Ablaufdatum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pools Table */}
                {filteredPools.length > 0 ? (
                  <DataTable 
                    columns={poolColumns} 
                    data={filteredPools}
                  />
                ) : (
                  <div className="text-center py-8">
                    <IconSwimming className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm || typeFilter !== "all" || accessFilter !== "all" 
                        ? "Keine Pools gefunden" 
                        : "Keine Pools verfügbar"
                      }
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || typeFilter !== "all" || accessFilter !== "all"
                        ? "Versuchen Sie, Ihre Filter zu ändern oder zu entfernen."
                        : "Sie haben noch keinen Zugriff auf Kandidaten-Pools."
                      }
                    </p>
                    {!(searchTerm || typeFilter !== "all" || accessFilter !== "all") && (
                      <Button variant="outline">
                        Administrator kontaktieren
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Access Level Distribution */}
              {stats && stats.accessLevelDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Zugriffslevel-Verteilung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.accessLevelDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.level}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ 
                                  width: `${(item.count / stats.totalPools) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pool Type Distribution */}
              {stats && stats.poolTypeDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pool-Typ Verteilung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.poolTypeDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ 
                                  width: `${(item.count / stats.totalPools) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Utilization Overview */}
              {stats && stats.averageUtilization > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pool-Auslastung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {stats.averageUtilization}%
                      </div>
                      <p className="text-muted-foreground">
                        Durchschnittliche Auslastung
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expiring Access */}
              {stats && stats.expiringPools > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconClock className="h-5 w-5 text-orange-500" />
                      Ablaufende Zugriffe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {stats.expiringPools}
                      </div>
                      <p className="text-muted-foreground">
                        Pool(s) laufen in 30 Tagen ab
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 