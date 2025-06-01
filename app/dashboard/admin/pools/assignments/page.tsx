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
  IconUsers, 
  IconSwimming,
  IconSearch,
  IconFilter,
  IconUserPlus,
  IconTrash,
  IconStar,
  IconBuilding,
  IconCalendar,
  IconSettings,
  IconEye,
  IconPlus,
  IconArrowLeft,
  IconChartBar
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
import { useRouter } from "next/navigation";

type PoolAssignment = {
  id: string;
  pool_id: string;
  pool_name: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_position?: string;
  assigned_at: string;
  assigned_by_name: string;
  priority: number;
  featured: boolean;
  status: "active" | "inactive" | "removed";
  notes?: string;
  selection_count: number;
};

type AssignmentMetrics = {
  totalAssignments: number;
  activeAssignments: number;
  featuredAssignments: number;
  assignmentsThisWeek: number;
  assignmentsThisMonth: number;
  topPools: { pool_name: string; count: number }[];
};

export default function PoolAssignmentsPage() {
  const [assignments, setAssignments] = useState<PoolAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<PoolAssignment[]>([]);
  const [metrics, setMetrics] = useState<AssignmentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [poolFilter, setPoolFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [pools, setPools] = useState<{ id: string; name: string; type: string }[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadAssignments();
    loadPools();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, poolFilter, statusFilter, featuredFilter]);

  async function loadPools() {
    try {
      const { data, error } = await supabase
        .from("candidate_pools")
        .select("id, name, pool_type")
        .order("name");

      if (error) throw error;
      if (data) {
        setPools(data.map(p => ({ id: p.id, name: p.name, type: p.pool_type })));
      }
    } catch (error) {
      console.error("Error loading pools:", error);
    }
  }

  async function loadAssignments() {
    try {
      setLoading(true);

      // Load all assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("pool_candidates")
        .select(`
          *,
          pool:candidate_pools(
            name,
            pool_type
          ),
          candidate:candidates(
            first_name,
            last_name,
            email
          )
        `)
        .order("added_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (assignmentsData) {
        // Get selection counts for each assignment
        const enrichedAssignments = await Promise.all(
          assignmentsData.map(async (assignment) => {
            const { count: selectionCount } = await supabase
              .from("candidate_selections")
              .select("*", { count: "exact", head: true })
              .eq("candidate_id", assignment.candidate_id)
              .eq("pool_id", assignment.pool_id);

            // Get the name of who added this assignment
            let assigned_by_name = "Unbekannt";
            if (assignment.added_by) {
              // First check if it's a candidate
              const { data: candidateData } = await supabase
                .from("candidates")
                .select("first_name, last_name")
                .eq("id", assignment.added_by)
                .single();

              if (candidateData) {
                assigned_by_name = `${candidateData.first_name} ${candidateData.last_name}`;
              } else {
                // Check if it's a company
                const { data: companyData } = await supabase
                  .from("companies")
                  .select("contact_name")
                  .eq("id", assignment.added_by)
                  .single();

                if (companyData) {
                  assigned_by_name = companyData.contact_name || "Unternehmen";
                } else {
                  // Must be admin
                  assigned_by_name = "Administrator";
                }
              }
            }

            return {
              id: assignment.id,
              pool_id: assignment.pool_id,
              pool_name: assignment.pool?.name || "Unbekannt",
              pool_type: assignment.pool?.pool_type || "custom",
              candidate_id: assignment.candidate_id,
              candidate_name: assignment.candidate 
                ? `${assignment.candidate.first_name} ${assignment.candidate.last_name}`
                : "Unbekannt",
              candidate_email: assignment.candidate?.email || "",
              candidate_position: undefined,
              assigned_at: assignment.added_at,
              assigned_by_name,
              priority: assignment.priority,
              featured: assignment.featured,
              status: "active", // pool_candidates doesn't have status, defaulting to active
              notes: assignment.notes,
              selection_count: selectionCount || 0
            } as PoolAssignment;
          })
        );

        setAssignments(enrichedAssignments);

        // Calculate metrics
        const totalAssignments = enrichedAssignments.length;
        const activeAssignments = enrichedAssignments.filter(a => a.status === "active").length;
        const featuredAssignments = enrichedAssignments.filter(a => a.featured && a.status === "active").length;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const assignmentsThisWeek = enrichedAssignments.filter(
          a => new Date(a.assigned_at) > oneWeekAgo
        ).length;

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const assignmentsThisMonth = enrichedAssignments.filter(
          a => new Date(a.assigned_at) > oneMonthAgo
        ).length;

        // Get top pools by assignment count
        const poolCounts: { [key: string]: number } = {};
        enrichedAssignments.forEach(assignment => {
          if (assignment.status === "active") {
            poolCounts[assignment.pool_name] = (poolCounts[assignment.pool_name] || 0) + 1;
          }
        });

        const topPools = Object.entries(poolCounts)
          .map(([pool_name, count]) => ({ pool_name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setMetrics({
          totalAssignments,
          activeAssignments,
          featuredAssignments,
          assignmentsThisWeek,
          assignmentsThisMonth,
          topPools
        });
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error("Fehler beim Laden der Zuweisungen");
    } finally {
      setLoading(false);
    }
  }

  function filterAssignments() {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.pool_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (poolFilter !== "all") {
      filtered = filtered.filter(assignment => assignment.pool_id === poolFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    if (featuredFilter !== "all") {
      const isFeatured = featuredFilter === "true";
      filtered = filtered.filter(assignment => assignment.featured === isFeatured);
    }

    setFilteredAssignments(filtered);
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (!window.confirm("Möchten Sie diese Zuweisung entfernen?")) return;

    try {
      const { error } = await supabase
        .from("pool_candidates")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Zuweisung entfernt");
      loadAssignments();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Fehler beim Entfernen der Zuweisung");
    }
  }

  async function handleToggleFeatured(assignmentId: string, featured: boolean) {
    try {
      const { error } = await supabase
        .from("pool_candidates")
        .update({ featured: !featured })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(featured ? "Featured-Status entfernt" : "Als Featured markiert");
      loadAssignments();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast.error("Fehler beim Ändern des Featured-Status");
    }
  }

  function getStatusBadge(status: PoolAssignment["status"]) {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Aktiv</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "removed":
        return <Badge variant="destructive">Entfernt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeBadge(type: PoolAssignment["pool_type"]) {
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

  const assignmentColumns: ColumnDef<PoolAssignment>[] = [
    {
      accessorKey: "candidate_name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.candidate_name}</span>
          <span className="text-sm text-muted-foreground">{row.original.candidate_email}</span>
          {row.original.candidate_position && (
            <span className="text-xs text-muted-foreground">{row.original.candidate_position}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "pool_name",
      header: "Pool",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link 
            href={`/dashboard/admin/pools/${row.original.pool_id}`}
            className="font-medium hover:underline"
          >
            {row.original.pool_name}
          </Link>
          <div className="mt-1">
            {getTypeBadge(row.original.pool_type)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "priority",
      header: "Priorität",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.priority}</span>
          {row.original.featured && (
            <IconStar className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "selection_count",
      header: "Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconStar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.selection_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_at",
      header: "Zugewiesen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(row.original.assigned_at).toLocaleDateString("de-DE")}
          </span>
          <span className="text-xs text-muted-foreground">
            von {row.original.assigned_by_name}
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
            <Link href={`/dashboard/admin/pools/${row.original.pool_id}`}>
              <DropdownMenuItem>
                <IconEye className="h-4 w-4 mr-2" />
                Pool ansehen
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem 
              onClick={() => handleToggleFeatured(row.original.id, row.original.featured)}
            >
              <IconStar className="h-4 w-4 mr-2" />
              {row.original.featured ? "Featured entfernen" : "Als Featured markieren"}
            </DropdownMenuItem>
            {row.original.status === "active" && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => handleRemoveAssignment(row.original.id)}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Zuweisung entfernen
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
            <h1 className="text-3xl font-bold tracking-tight">Pool-Zuweisungen</h1>
            <p className="text-muted-foreground">Lade Zuweisungsdaten...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Pool-Zuweisungen</h1>
            <p className="text-muted-foreground">
              Verwalte alle Kandidaten-Pool-Zuweisungen im System
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard/admin/pools">
              <Button variant="outline">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Zurück zu Pools
              </Button>
            </Link>
            <Button onClick={() => router.push("/dashboard/admin/pools")}>
              <IconUserPlus className="h-4 w-4 mr-2" />
              Neue Zuweisung
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Zuweisungen</p>
                  <p className="text-2xl font-bold">{metrics.totalAssignments}</p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Zuweisungen</p>
                  <p className="text-2xl font-bold">{metrics.activeAssignments}</p>
                </div>
                <IconSwimming className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold">{metrics.featuredAssignments}</p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diese Woche</p>
                  <p className="text-2xl font-bold">{metrics.assignmentsThisWeek}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diesen Monat</p>
                  <p className="text-2xl font-bold">{metrics.assignmentsThisMonth}</p>
                </div>
                <IconChartBar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Pools Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Pools nach Zuweisungen</CardTitle>
            <CardDescription>
              Pools mit den meisten aktiven Kandidaten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topPools.map((pool, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pool.pool_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(pool.count / metrics.topPools[0]?.count) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {pool.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Kandidaten oder Pools suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={poolFilter} onValueChange={setPoolFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pool filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Pools</SelectItem>
                    {pools.map((pool) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="removed">Entfernt</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Featured filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Nur Featured</SelectItem>
                    <SelectItem value="false">Nicht Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pool-Zuweisungen</CardTitle>
            <CardDescription>
              Übersicht aller Kandidaten-Pool-Zuweisungen ({filteredAssignments.length} Zuweisungen)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={assignmentColumns} 
              data={filteredAssignments}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 