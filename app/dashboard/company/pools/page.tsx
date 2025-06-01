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
  IconHeartFilled,
  IconFilter,
  IconSearch
} from "@tabler/icons-react";
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

type AssignedPool = {
  id: string;
  pool_id: string;
  pool_name: string;
  pool_description?: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  access_level: "view" | "select" | "contact";
  candidate_count: number;
  assigned_at: string;
  expires_at?: string;
  selection_count: number;
};

type PoolCandidate = {
  id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  skills: string[];
  priority: number;
  featured: boolean;
  assigned_at: string;
  isSelected: boolean;
  selectionType?: "interested" | "shortlisted" | "contacted" | "rejected";
  rating?: number;
};

export default function CompanyPoolsPage() {
  const [assignedPools, setAssignedPools] = useState<AssignedPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<AssignedPool | null>(null);
  const [poolCandidates, setPoolCandidates] = useState<PoolCandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<PoolCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [selectionFilter, setSelectionFilter] = useState<string>("all");
  const [viewingCandidates, setViewingCandidates] = useState(false);
  const profile = useProfile();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      loadAssignedPools();
    }
  }, [profile]);

  useEffect(() => {
    filterCandidates();
  }, [poolCandidates, searchTerm, skillFilter, selectionFilter]);

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
            pool_type
          )
        `)
        .eq("company_id", profile?.company_id)
        .order("granted_at", { ascending: false });

      if (accessError) throw accessError;

      if (poolAccess) {
        // Get candidate counts and selection counts for each pool
        const enrichedPools = await Promise.all(
          poolAccess.map(async (access) => {
            // Get candidate count
            const { count: candidateCount } = await supabase
              .from("pool_candidates")
              .select("*", { count: "exact", head: true })
              .eq("pool_id", access.pool_id);

            // Get selection count for this company
            const { count: selectionCount } = await supabase
              .from("candidate_selections")
              .select("*", { count: "exact", head: true })
              .eq("company_id", profile?.company_id)
              .eq("pool_id", access.pool_id);

            return {
              id: access.id,
              pool_id: access.pool_id,
              pool_name: access.pool?.name || "Unbekannt",
              pool_description: access.pool?.description,
              pool_type: access.pool?.pool_type || "custom",
              access_level: access.access_level,
              candidate_count: candidateCount || 0,
              assigned_at: access.granted_at,
              expires_at: access.expires_at,
              selection_count: selectionCount || 0
            } as AssignedPool;
          })
        );

        setAssignedPools(enrichedPools);
      }
    } catch (error) {
      console.error("Error loading assigned pools:", error);
      toast.error("Fehler beim Laden der verfügbaren Pools");
    } finally {
      setLoading(false);
    }
  }

  async function loadPoolCandidates(pool: AssignedPool) {
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from("pool_candidates")
        .select(`
          *,
          candidate:candidates(
            id,
            first_name,
            last_name,
            email,
            skills
          )
        `)
        .eq("pool_id", pool.pool_id)
        .order("priority", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (assignments) {
        // Get existing selections for this company
        const { data: selections, error: selectionsError } = await supabase
          .from("candidate_selections")
          .select("candidate_id, selection_type, rating")
          .eq("company_id", profile?.company_id)
          .eq("pool_id", pool.pool_id);

        if (selectionsError) throw selectionsError;

        const selectionsMap = new Map(
          selections?.map(s => [s.candidate_id, { type: s.selection_type, rating: s.rating }]) || []
        );

        const enrichedCandidates = assignments.map(assignment => {
          const selection = selectionsMap.get(assignment.candidate_id);
          return {
            id: assignment.id,
            candidate_id: assignment.candidate_id,
            first_name: assignment.candidate?.first_name || "",
            last_name: assignment.candidate?.last_name || "",
            email: assignment.candidate?.email || "",
            current_position: undefined,
            skills: Array.isArray(assignment.candidate?.skills) ? assignment.candidate.skills : [],
            priority: assignment.priority,
            featured: assignment.featured,
            assigned_at: assignment.added_at,
            isSelected: !!selection,
            selectionType: selection?.type,
            rating: selection?.rating
          } as PoolCandidate;
        });

        setPoolCandidates(enrichedCandidates);
      }
    } catch (error) {
      console.error("Error loading pool candidates:", error);
      toast.error("Fehler beim Laden der Kandidaten");
    }
  }

  function filterCandidates() {
    let filtered = poolCandidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (skillFilter !== "all") {
      filtered = filtered.filter(candidate => 
        candidate.skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()))
      );
    }

    if (selectionFilter !== "all") {
      if (selectionFilter === "selected") {
        filtered = filtered.filter(candidate => candidate.isSelected);
      } else if (selectionFilter === "unselected") {
        filtered = filtered.filter(candidate => !candidate.isSelected);
      } else {
        filtered = filtered.filter(candidate => candidate.selectionType === selectionFilter);
      }
    }

    setFilteredCandidates(filtered);
  }

  async function handleCandidateSelection(candidate: PoolCandidate, selectionType: "interested" | "shortlisted" | "rejected") {
    try {
      if (candidate.isSelected) {
        // Update existing selection
        const { error } = await supabase
          .from("candidate_selections")
          .update({ 
            selection_type: selectionType,
            updated_at: new Date().toISOString()
          })
          .eq("company_id", profile?.company_id)
          .eq("candidate_id", candidate.candidate_id)
          .eq("pool_id", selectedPool?.pool_id);

        if (error) throw error;
      } else {
        // Create new selection
        const { error } = await supabase
          .from("candidate_selections")
          .insert({
            company_id: profile?.company_id,
            candidate_id: candidate.candidate_id,
            pool_id: selectedPool?.pool_id,
            selected_by: profile?.id,
            selection_type: selectionType
          });

        if (error) throw error;
      }

      toast.success("Auswahl aktualisiert");
      
      // Reload candidates to reflect changes
      if (selectedPool) {
        loadPoolCandidates(selectedPool);
      }
      
    } catch (error) {
      console.error("Error updating candidate selection:", error);
      toast.error("Fehler beim Aktualisieren der Auswahl");
    }
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

  function getSelectionBadge(candidate: PoolCandidate) {
    if (!candidate.isSelected) return null;
    
    switch (candidate.selectionType) {
      case "interested":
        return <Badge variant="default" className="bg-green-600">Interessiert</Badge>;
      case "shortlisted":
        return <Badge variant="default" className="bg-blue-600">Shortlist</Badge>;
      case "contacted":
        return <Badge variant="default" className="bg-purple-600">Kontaktiert</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">Ausgewählt</Badge>;
    }
  }

  const poolColumns: ColumnDef<AssignedPool>[] = [
    {
      accessorKey: "pool_name",
      header: "Pool-Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.pool_name}</span>
          {row.original.pool_description && (
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {row.original.pool_description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "pool_type",
      header: "Typ",
      cell: ({ row }) => getPoolTypeBadge(row.original.pool_type),
    },
    {
      accessorKey: "access_level",
      header: "Zugriffslevel",
      cell: ({ row }) => getAccessLevelBadge(row.original.access_level),
    },
    {
      accessorKey: "candidate_count",
      header: "Kandidaten",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.candidate_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "selection_count",
      header: "Meine Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconHeart className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.selection_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_at",
      header: "Zugewiesenen",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.assigned_at).toLocaleDateString("de-DE")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <Link href={`/dashboard/company/pools/${row.original.pool_id}`}>
          <Button size="sm">
            <IconEye className="h-4 w-4 mr-2" />
            Pool durchsuchen
          </Button>
        </Link>
      ),
    },
  ];

  const candidateColumns: ColumnDef<PoolCandidate>[] = [
    {
      accessorKey: "name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {row.original.first_name} {row.original.last_name}
              </span>
              {row.original.featured && (
                <IconStar className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {row.original.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "selection",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getSelectionBadge(row.original)}
          {!row.original.isSelected && (
            <Badge variant="outline" className="text-xs">Neu</Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        if (selectedPool?.access_level === "view") {
          return <span className="text-sm text-muted-foreground">Nur Ansicht</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={row.original.selectionType === "interested" ? "default" : "outline"}
              onClick={() => handleCandidateSelection(row.original, "interested")}
            >
              <IconHeart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={row.original.selectionType === "shortlisted" ? "default" : "outline"}
              onClick={() => handleCandidateSelection(row.original, "shortlisted")}
            >
              <IconStar className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Pools</h1>
            <p className="text-muted-foreground">Lade verfügbare Pools...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Pools</h1>
          <p className="text-muted-foreground">
            Durchsuchen Sie die Ihnen zugewiesenen Kandidaten-Pools und wählen Sie interessante Kandidaten aus
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verfügbare Pools</p>
                  <p className="text-2xl font-bold">{assignedPools.length}</p>
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
                  <p className="text-2xl font-bold">
                    {assignedPools.reduce((sum, pool) => sum + pool.candidate_count, 0)}
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
                  <p className="text-sm text-muted-foreground">Meine Auswahlen</p>
                  <p className="text-2xl font-bold">
                    {assignedPools.reduce((sum, pool) => sum + pool.selection_count, 0)}
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
                  <p className="text-sm text-muted-foreground">Premium Pools</p>
                  <p className="text-2xl font-bold">
                    {assignedPools.filter(p => p.pool_type === "premium" || p.pool_type === "featured").length}
                  </p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zugewiesene Pools</CardTitle>
            <CardDescription>
              Pools, auf die Sie Zugriff haben ({assignedPools.length} Pools)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={poolColumns} 
              data={assignedPools}
            />
          </CardContent>
        </Card>

        {/* Candidates Dialog */}
        <Dialog open={viewingCandidates} onOpenChange={setViewingCandidates}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Kandidaten in {selectedPool?.pool_name}
              </DialogTitle>
              <DialogDescription>
                {selectedPool?.pool_description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kandidaten suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={selectionFilter} onValueChange={setSelectionFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="unselected">Noch nicht ausgewählt</SelectItem>
                    <SelectItem value="selected">Ausgewählt</SelectItem>
                    <SelectItem value="interested">Interessiert</SelectItem>
                    <SelectItem value="shortlisted">Shortlist</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Candidates Table */}
              <DataTable 
                columns={candidateColumns} 
                data={filteredCandidates}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 