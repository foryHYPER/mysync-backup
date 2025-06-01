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
  IconSwimming, 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconEdit,
  IconEye,
  IconTrash,
  IconUsers,
  IconBuilding,
  IconStar,
  IconCalendar,
  IconSettings
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CandidatePool = {
  id: string;
  name: string;
  description?: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  status: "active" | "inactive" | "archived";
  candidate_count: number;
  max_candidates?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  companies_count: number;
  selections_count: number;
  created_by_name?: string;
};

type PoolMetrics = {
  totalPools: number;
  activePools: number;
  totalCandidates: number;
  totalCompanyAccess: number;
  totalSelections: number;
  thisMonthSelections: number;
};

export default function CandidatePoolsPage() {
  const [pools, setPools] = useState<CandidatePool[]>([]);
  const [filteredPools, setFilteredPools] = useState<CandidatePool[]>([]);
  const [metrics, setMetrics] = useState<PoolMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedPool, setSelectedPool] = useState<CandidatePool | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    filterPools();
  }, [pools, searchTerm, statusFilter, typeFilter]);

  async function loadPools() {
    try {
      setLoading(true);

      // Load pools with statistics
      const { data: poolsData, error: poolsError } = await supabase
        .from("candidate_pools")
        .select(`
          *,
          created_by_profile:profiles!candidate_pools_created_by_fkey(
            id,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (poolsError) throw poolsError;

      if (poolsData) {
        // Get additional statistics for each pool
        const enrichedPools = await Promise.all(
          poolsData.map(async (pool) => {
            // Get creator name from candidates or companies table based on role
            let creatorName = "Unbekannt";
            if (pool.created_by_profile) {
              try {
                if (pool.created_by_profile.role === 'candidate') {
                  const { data: candidateData } = await supabase
                    .from("candidates")
                    .select("first_name, last_name")
                    .eq("id", pool.created_by_profile.id)
                    .single();
                  
                  if (candidateData) {
                    creatorName = `${candidateData.first_name} ${candidateData.last_name}`;
                  }
                } else if (pool.created_by_profile.role === 'company') {
                  const { data: companyData } = await supabase
                    .from("companies")
                    .select("name, contact_name")
                    .eq("id", pool.created_by_profile.id)
                    .single();
                  
                  if (companyData) {
                    creatorName = companyData.contact_name || companyData.name || "Unbekannt";
                  }
                } else if (pool.created_by_profile.role === 'admin') {
                  creatorName = "Administrator";
                }
              } catch (error) {
                console.warn("Error getting creator name:", error);
              }
            }

            // Get candidate count for this pool
            const { count: candidateCount } = await supabase
              .from("pool_candidates")
              .select("*", { count: "exact", head: true })
              .eq("pool_id", pool.id);

            // Get company access count
            const { count: companiesCount } = await supabase
              .from("pool_company_access")
              .select("*", { count: "exact", head: true })
              .eq("pool_id", pool.id);

            // Get selections count
            const { count: selectionsCount } = await supabase
              .from("candidate_selections")
              .select("*", { count: "exact", head: true })
              .eq("pool_id", pool.id);

            return {
              ...pool,
              candidate_count: candidateCount || 0,
              created_by_name: creatorName,
              companies_count: companiesCount || 0,
              selections_count: selectionsCount || 0,
              tags: Array.isArray(pool.tags) ? pool.tags : []
            } as CandidatePool;
          })
        );

        setPools(enrichedPools);

        // Calculate metrics
        const totalPools = enrichedPools.length;
        const activePools = enrichedPools.filter(p => p.status === "active").length;
        const totalCandidates = enrichedPools.reduce((sum, p) => sum + p.candidate_count, 0);
        const totalCompanyAccess = enrichedPools.reduce((sum, p) => sum + p.companies_count, 0);
        const totalSelections = enrichedPools.reduce((sum, p) => sum + p.selections_count, 0);

        // Get this month's selections
        const { count: thisMonthSelections } = await supabase
          .from("candidate_selections")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        setMetrics({
          totalPools,
          activePools,
          totalCandidates,
          totalCompanyAccess,
          totalSelections,
          thisMonthSelections: thisMonthSelections || 0
        });
      }
    } catch (error) {
      console.error("Error loading pools:", error);
      toast.error("Fehler beim Laden der Pools");
    } finally {
      setLoading(false);
    }
  }

  function filterPools() {
    let filtered = pools;

    if (searchTerm) {
      filtered = filtered.filter(pool => 
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(pool => pool.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(pool => pool.pool_type === typeFilter);
    }

    setFilteredPools(filtered);
  }

  async function handlePoolAction(poolId: string, action: string) {
    try {
      switch (action) {
        case "activate":
          await supabase
            .from("candidate_pools")
            .update({ status: "active" })
            .eq("id", poolId);
          toast.success("Pool aktiviert");
          break;
        case "deactivate":
          await supabase
            .from("candidate_pools")
            .update({ status: "inactive" })
            .eq("id", poolId);
          toast.success("Pool deaktiviert");
          break;
        case "archive":
          await supabase
            .from("candidate_pools")
            .update({ status: "archived" })
            .eq("id", poolId);
          toast.success("Pool archiviert");
          break;
        case "delete":
          if (window.confirm("Sind Sie sicher, dass Sie diesen Pool löschen möchten?")) {
            await supabase
              .from("candidate_pools")
              .delete()
              .eq("id", poolId);
            toast.success("Pool gelöscht");
          }
          break;
      }
      loadPools();
    } catch (error) {
      console.error("Error performing pool action:", error);
      toast.error("Fehler beim Ausführen der Aktion");
    }
  }

  function getStatusBadge(status: CandidatePool["status"]) {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Aktiv</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "archived":
        return <Badge variant="outline">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeBadge(type: CandidatePool["pool_type"]) {
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

  const poolColumns: ColumnDef<CandidatePool>[] = [
    {
      accessorKey: "name",
      header: "Pool-Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "pool_type",
      header: "Typ",
      cell: ({ row }) => getTypeBadge(row.original.pool_type),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
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
      accessorKey: "companies_count",
      header: "Unternehmen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconBuilding className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.companies_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "selections_count",
      header: "Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconStar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.selections_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Erstellt",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(row.original.created_at).toLocaleDateString("de-DE")}
          </span>
          <span className="text-xs text-muted-foreground">
            von {row.original.created_by_name}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <IconSettings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconEye className="h-4 w-4 mr-2" />
                  Details ansehen
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pool Details - {row.original.name}</DialogTitle>
                  <DialogDescription>
                    Detaillierte Informationen über den Kandidatenpool
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Pool-Typ</label>
                      <div>{getTypeBadge(row.original.pool_type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div>{getStatusBadge(row.original.status)}</div>
                    </div>
                  </div>
                  
                  {row.original.description && (
                    <div>
                      <label className="text-sm font-medium">Beschreibung</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {row.original.description}
                      </p>
                    </div>
                  )}

                  {row.original.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.original.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.candidate_count}</p>
                      <p className="text-sm text-muted-foreground">Kandidaten</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.companies_count}</p>
                      <p className="text-sm text-muted-foreground">Unternehmen</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.selections_count}</p>
                      <p className="text-sm text-muted-foreground">Auswahlen</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href={`/dashboard/admin/pools/${row.original.id}`}>
              <DropdownMenuItem>
                <IconEdit className="h-4 w-4 mr-2" />
                Pool verwalten
              </DropdownMenuItem>
            </Link>
            
            <Link href={`/dashboard/admin/pools/${row.original.id}/candidates`}>
              <DropdownMenuItem>
                <IconUsers className="h-4 w-4 mr-2" />
                Kandidaten verwalten
              </DropdownMenuItem>
            </Link>
            
            {row.original.status === "active" ? (
              <DropdownMenuItem 
                onClick={() => handlePoolAction(row.original.id, "deactivate")}
              >
                Deaktivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => handlePoolAction(row.original.id, "activate")}
              >
                Aktivieren
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onClick={() => handlePoolAction(row.original.id, "archive")}
            >
              Archivieren
            </DropdownMenuItem>
            
            {row.original.pool_type !== "main" && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => handlePoolAction(row.original.id, "delete")}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Pool löschen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Pools</h1>
            <p className="text-muted-foreground">Lade Pool-Daten...</p>
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
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Pools</h1>
            <p className="text-muted-foreground">
              Verwalte Kandidaten-Pools und weise sie Unternehmen zu
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadPools}>
              <IconSearch className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Link href="/dashboard/admin/pools/create">
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Pool erstellen
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Pools</p>
                  <p className="text-2xl font-bold">{pools.length}</p>
                </div>
                <IconSwimming className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Pools</p>
                  <p className="text-2xl font-bold">
                    {pools.filter(p => p.status === "active").length}
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Kandidaten</p>
                  <p className="text-2xl font-bold">
                    {pools.reduce((sum, pool) => sum + pool.candidate_count, 0)}
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unternehmen</p>
                  <p className="text-2xl font-bold">
                    {pools.reduce((sum, pool) => sum + pool.companies_count, 0)}
                  </p>
                </div>
                <IconBuilding className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auswahlen</p>
                  <p className="text-2xl font-bold">
                    {pools.reduce((sum, pool) => sum + pool.selections_count, 0)}
                  </p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diesen Monat</p>
                  <p className="text-2xl font-bold">
                    {metrics?.thisMonthSelections || 0}
                  </p>
                </div>
                <IconCalendar className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Performance</CardTitle>
              <CardDescription>Top performing pools by selections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pools
                  .filter(p => p.status === "active")
                  .sort((a, b) => b.selections_count - a.selections_count)
                  .slice(0, 5)
                  .map((pool, index) => (
                    <div key={pool.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{pool.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pool.candidate_count} Kandidaten • {pool.companies_count} Unternehmen
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{pool.selections_count}</p>
                        <p className="text-sm text-muted-foreground">Auswahlen</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pool Types Distribution</CardTitle>
              <CardDescription>Verteilung der Pool-Typen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["main", "custom", "featured", "premium"].map((type) => {
                  const count = pools.filter(p => p.pool_type === type).length;
                  const percentage = pools.length > 0 ? (count / pools.length) * 100 : 0;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {type === "main" ? "Hauptpool" : 
                           type === "custom" ? "Custom" :
                           type === "featured" ? "Featured" : "Premium"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pool Status Overview</CardTitle>
              <CardDescription>Status-Verteilung aller Pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["active", "inactive", "archived"].map((status) => {
                  const count = pools.filter(p => p.status === status).length;
                  const percentage = pools.length > 0 ? (count / pools.length) * 100 : 0;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {status === "active" ? "Aktiv" : 
                           status === "inactive" ? "Inaktiv" : "Archiviert"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            status === "active" ? "bg-green-600" :
                            status === "inactive" ? "bg-yellow-600" : "bg-gray-600"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Kürzlich erstellte Pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pools
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((pool) => (
                    <div key={pool.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pool.name}</p>
                        <p className="text-sm text-muted-foreground">
                          von {pool.created_by_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(pool.created_at).toLocaleDateString("de-DE")}
                        </p>
                        {getStatusBadge(pool.status)}
                      </div>
                    </div>
                  ))}
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
                    placeholder="Pools suchen..."
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
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Typ filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="main">Hauptpool</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kandidaten-Pools</CardTitle>
            <CardDescription>
              Übersicht aller Kandidaten-Pools ({filteredPools.length} Pools)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={poolColumns} 
              data={filteredPools}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 