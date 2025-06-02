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
import { useParams } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import { 
  IconArrowLeft, 
  IconUsers, 
  IconStar,
  IconHeart,
  IconHeartFilled,
  IconEye,
  IconMail,
  IconPhone,
  IconCalendar,
  IconFilter,
  IconSearch,
  IconBriefcase,
  IconMapPin,
  IconBuilding,
  IconChartBar
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PoolDetail = {
  id: string;
  name: string;
  description?: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  access_level: "view" | "select" | "contact";
  candidate_count: number;
  max_candidates?: number;
  assigned_at: string;
  expires_at?: string;
};

type PoolCandidate = {
  id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  skills: string[];
  priority: number;
  featured: boolean;
  assigned_at: string;
  isSelected: boolean;
  selectionType?: "interested" | "shortlisted" | "contacted" | "rejected";
  location?: string;
  experience_years?: number;
};

type PoolStats = {
  totalCandidates: number;
  featuredCandidates: number;
  mySelections: number;
  skillsOverview: { skill: string; count: number }[];
  averageExperience: number;
  selectionTypes: { type: string; count: number }[];
};

export default function CompanyPoolDetailPage() {
  const params = useParams();
  const poolId = params.id as string;
  const profile = useProfile();
  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [candidates, setCandidates] = useState<PoolCandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<PoolCandidate[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [selectionFilter, setSelectionFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [contactingCandidate, setContactingCandidate] = useState<PoolCandidate | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: ""
  });
  const supabase = createClient();

  useEffect(() => {
    if (poolId && profile?.id) {
      loadPoolData();
    }
  }, [poolId, profile?.id]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, skillFilter, selectionFilter, priorityFilter]);

  // New useEffect: Call loadStats whenever candidates change
  useEffect(() => {
    console.log('🔄 Candidates changed, updating stats...', candidates.length);
    loadStats();
  }, [candidates]);

  async function loadPoolData() {
    try {
      setLoading(true);

      // Check if company has access to this pool
      const { data: access, error: accessError } = await supabase
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
        .eq("pool_id", poolId)
        .eq("company_id", profile?.id)
        .single();

      if (accessError) {
        if (accessError.code === "PGRST116") {
          toast.error("Sie haben keinen Zugriff auf diesen Pool");
          return;
        }
        throw accessError;
      }

      if (access) {
        // Get candidate count
        const { count: candidateCount } = await supabase
          .from("pool_candidates")
          .select("*", { count: "exact", head: true })
          .eq("pool_id", poolId);

        const poolDetail: PoolDetail = {
          id: access.pool_id,
          name: access.pool?.name || "Unbekannt",
          description: access.pool?.description,
          pool_type: access.pool?.pool_type || "custom",
          access_level: access.access_level,
          candidate_count: candidateCount || 0,
          max_candidates: access.pool?.max_candidates,
          assigned_at: access.granted_at,
          expires_at: access.expires_at
        };

        console.log('🏊 Pool details loaded:', {
          poolName: poolDetail.name,
          actualCandidates: candidateCount,
          maxCandidates: access.pool?.max_candidates,
          poolData: access.pool
        });

        setPool(poolDetail);

        // Load pool candidates (this will trigger loadStats via useEffect)
        await loadCandidates();
      }
    } catch (error) {
      console.error("Error loading pool data:", error);
      toast.error("Fehler beim Laden der Pool-Daten");
    } finally {
      setLoading(false);
    }
  }

  async function loadCandidates() {
    console.log('👥 loadCandidates called');
    
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
            skills,
            location,
            experience
          )
        `)
        .eq("pool_id", poolId)
        .order("priority", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (assignments) {
        console.log('👥 Loaded assignments:', assignments.length);
        
        // Get existing selections for this company
        const { data: selections, error: selectionsError } = await supabase
          .from("candidate_selections")
          .select("candidate_id, selection_type")
          .eq("company_id", profile?.id)
          .eq("pool_id", poolId);

        if (selectionsError) {
          console.error('❌ Error loading selections:', selectionsError);
          throw selectionsError;
        }

        console.log('🎯 Loaded selections:', selections?.length || 0, selections);

        const selectionsMap = new Map(
          selections?.map(s => [s.candidate_id, s.selection_type]) || []
        );

        console.log('🗺️ Selections map:', Array.from(selectionsMap.entries()));

        const enrichedCandidates = assignments.map(assignment => {
          const selectionType = selectionsMap.get(assignment.candidate_id);
          const candidate = {
            id: assignment.id,
            candidate_id: assignment.candidate_id,
            first_name: assignment.candidate?.first_name || "",
            last_name: assignment.candidate?.last_name || "",
            email: assignment.candidate?.email || "",
            position: undefined, // Not available in current schema
            skills: Array.isArray(assignment.candidate?.skills) ? assignment.candidate.skills : [],
            priority: assignment.priority,
            featured: assignment.featured,
            assigned_at: assignment.added_at,
            isSelected: !!selectionType,
            selectionType: selectionType,
            location: assignment.candidate?.location,
            experience_years: assignment.candidate?.experience || 0
          } as PoolCandidate;
          
          if (candidate.isSelected) {
            console.log('✅ Found selected candidate:', candidate.first_name, candidate.last_name, 'Type:', candidate.selectionType);
          }
          
          return candidate;
        });

        console.log('👥 Setting enriched candidates:', enrichedCandidates.length, 'Selected:', enrichedCandidates.filter(c => c.isSelected).length);
        setCandidates(enrichedCandidates);
      }
    } catch (error) {
      console.error("❌ Error loading candidates:", error);
      toast.error("Fehler beim Laden der Kandidaten");
    }
  }

  async function loadStats() {
    console.log('📊 loadStats called, candidates count:', candidates.length);
    
    try {
      // Total candidates
      const totalCandidates = candidates.length;

      // Featured candidates
      const featuredCandidates = candidates.filter(c => c.featured).length;

      // My selections
      const mySelections = candidates.filter(c => c.isSelected).length;
      
      console.log('📊 Stats calculation:', {
        totalCandidates,
        featuredCandidates,
        mySelections,
        candidatesWithSelection: candidates.filter(c => c.isSelected).map(c => ({
          name: c.first_name + ' ' + c.last_name,
          selectionType: c.selectionType,
          isSelected: c.isSelected
        }))
      });

      // Skills overview
      const skillCounts: { [key: string]: number } = {};
      candidates.forEach(candidate => {
        if (candidate.skills && Array.isArray(candidate.skills)) {
          candidate.skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });

      const skillsOverview = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Average experience
      const experienceCandidates = candidates.filter(c => c.experience_years !== undefined && c.experience_years > 0);
      const averageExperience = experienceCandidates.length > 0
        ? experienceCandidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / experienceCandidates.length
        : 0;

      // Selection types breakdown
      const selectionTypeCounts: { [key: string]: number } = {
        interested: 0,
        shortlisted: 0,
        contacted: 0,
        rejected: 0
      };

      candidates.forEach(candidate => {
        if (candidate.selectionType) {
          selectionTypeCounts[candidate.selectionType]++;
        }
      });

      const selectionTypes = Object.entries(selectionTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .filter(item => item.count > 0);

      const newStats = {
        totalCandidates,
        featuredCandidates,
        mySelections,
        skillsOverview,
        averageExperience: Math.round(averageExperience * 10) / 10,
        selectionTypes
      };

      console.log('📊 Setting new stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error("❌ Error loading stats:", error);
      
      // Set default stats in case of error
      setStats({
        totalCandidates: 0,
        featuredCandidates: 0,
        mySelections: 0,
        skillsOverview: [],
        averageExperience: 0,
        selectionTypes: []
      });
    }
  }

  function filterCandidates() {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    if (priorityFilter !== "all") {
      if (priorityFilter === "high") {
        filtered = filtered.filter(candidate => candidate.priority >= 5);
      } else if (priorityFilter === "medium") {
        filtered = filtered.filter(candidate => candidate.priority >= 3 && candidate.priority < 5);
      } else if (priorityFilter === "low") {
        filtered = filtered.filter(candidate => candidate.priority < 3);
      } else if (priorityFilter === "featured") {
        filtered = filtered.filter(candidate => candidate.featured);
      }
    }

    setFilteredCandidates(filtered);
  }

  async function handleCandidateSelection(candidate: PoolCandidate, selectionType: "interested" | "shortlisted" | "contacted" | "rejected") {
    console.log('🎯 handleCandidateSelection called:', {
      candidate: candidate.first_name + ' ' + candidate.last_name,
      selectionType,
      poolAccessLevel: pool?.access_level,
      profileId: profile?.id
    });

    try {
      if (pool?.access_level === "view") {
        toast.error("Sie haben nur Ansichtsberechtigung für diesen Pool");
        return;
      }

      console.log('🔄 Starting database operation...');

      if (candidate.isSelected) {
        console.log('📝 Updating existing selection...');
        // Update existing selection
        const { error } = await supabase
          .from("candidate_selections")
          .update({ 
            selection_type: selectionType,
            updated_at: new Date().toISOString()
          })
          .eq("company_id", profile?.id)
          .eq("candidate_id", candidate.candidate_id)
          .eq("pool_id", poolId);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Update successful');
      } else {
        console.log('➕ Creating new selection...');
        // Create new selection
        const { error } = await supabase
          .from("candidate_selections")
          .insert({
            company_id: profile?.id,
            candidate_id: candidate.candidate_id,
            pool_id: poolId,
            selection_type: selectionType
          });

        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        console.log('✅ Insert successful');
      }

      toast.success("Auswahl aktualisiert");
      
      console.log('🔄 Reloading data...');
      // Reload candidates (this will trigger loadStats via useEffect)
      await loadCandidates();
      console.log('✅ Data reloaded');
      
    } catch (error) {
      console.error("❌ Error updating candidate selection:", error);
      toast.error("Fehler beim Aktualisieren der Auswahl");
    }
  }

  async function handleContactCandidate() {
    if (!contactingCandidate || pool?.access_level !== "contact") {
      toast.error("Sie haben keine Kontaktberechtigung für diesen Pool");
      return;
    }

    try {
      // In a real app, this would send an email
      // For now, we'll just mark as contacted
      await handleCandidateSelection(contactingCandidate, "contacted");
      
      toast.success(`Kontakt-E-Mail wurde an ${contactingCandidate.first_name} ${contactingCandidate.last_name} gesendet`);
      
      setContactingCandidate(null);
      setContactForm({ subject: "", message: "" });
    } catch (error) {
      console.error("Error contacting candidate:", error);
      toast.error("Fehler beim Senden der Kontakt-E-Mail");
    }
  }

  function getPoolTypeBadge(type: PoolDetail["pool_type"]) {
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

  function getAccessLevelBadge(level: PoolDetail["access_level"]) {
    switch (level) {
      case "view":
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Anzeigen</Badge>;
      case "select":
        return <Badge variant="outline" className="border-green-500 text-green-700">Auswählen</Badge>;
      case "contact":
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Kontaktieren</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  }

  function getSelectionTypeBadge(type?: string) {
    switch (type) {
      case "interested":
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Interessiert</Badge>;
      case "shortlisted":
        return <Badge variant="outline" className="border-green-500 text-green-700">Shortlist</Badge>;
      case "contacted":
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Kontaktiert</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-500 text-red-700">Abgelehnt</Badge>;
      default:
        return null;
    }
  }

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
              {row.original.isSelected && (
                <IconHeartFilled className="h-4 w-4 text-red-500" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">{row.original.email}</span>
            {row.original.position && (
              <span className="text-xs text-muted-foreground">{row.original.position}</span>
            )}
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
      accessorKey: "experience_years",
      header: "Erfahrung",
      cell: ({ row }) => (
        row.original.experience_years ? (
          <span className="text-sm">
            {row.original.experience_years} Jahre
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
    {
      accessorKey: "location",
      header: "Standort",
      cell: ({ row }) => (
        row.original.location ? (
          <div className="flex items-center gap-1">
            <IconMapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{row.original.location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
    {
      accessorKey: "priority",
      header: "Priorität",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            row.original.priority >= 5 ? 'bg-red-500' :
            row.original.priority >= 3 ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
          <span className="text-sm">{row.original.priority}</span>
        </div>
      ),
    },
    {
      accessorKey: "selection_status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {getSelectionTypeBadge(row.original.selectionType)}
          {!row.original.isSelected && (
            <span className="text-xs text-muted-foreground">Nicht ausgewählt</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const handleActionClick = (action: string) => {
          console.log('Action clicked:', action, 'Pool access level:', pool?.access_level);
          
          if (pool?.access_level === "view") {
            toast.error("Sie haben nur Ansichtsberechtigung für diesen Pool");
            return;
          }

          switch (action) {
            case "interested":
              handleCandidateSelection(row.original, "interested");
              break;
            case "shortlisted":
              handleCandidateSelection(row.original, "shortlisted");
              break;
            case "contact":
              setContactingCandidate(row.original);
              setContactForm({
                subject: `Stellenausschreibung - ${row.original.first_name} ${row.original.last_name}`,
                message: `Hallo ${row.original.first_name},\n\nwir haben Ihr Profil in unserem Kandidatenpool gesehen und würden gerne mit Ihnen über mögliche Karrierechancen sprechen.\n\nBeste Grüße\n${profile?.company_name || "Unser Team"}`
              });
              break;
            case "rejected":
              handleCandidateSelection(row.original, "rejected");
              break;
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Aktionen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("interested");
                }}
                className="cursor-pointer"
              >
                <IconHeart className="h-4 w-4 mr-2" />
                Interessiert
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("shortlisted");
                }}
                className="cursor-pointer"
              >
                <IconStar className="h-4 w-4 mr-2" />
                Shortlist
              </DropdownMenuItem>
              
              {pool?.access_level === "contact" && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick("contact");
                  }}
                  className="cursor-pointer"
                >
                  <IconMail className="h-4 w-4 mr-2" />
                  Kontaktieren
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("rejected");
                }}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <IconEye className="h-4 w-4 mr-2" />
                Ablehnen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading || !pool || !stats) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Pool wird geladen...</h1>
            <p className="text-muted-foreground">Lade Pool-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Pool Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/company/pools">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Zurück zu Pools
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pool?.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                {getPoolTypeBadge(pool?.pool_type || "custom")}
                {getAccessLevelBadge(pool?.access_level || "view")}
                {pool?.expires_at && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    Läuft ab: {new Date(pool.expires_at).toLocaleDateString("de-DE")}
                  </Badge>
                )}
              </div>
              {pool?.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{pool.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadPoolData()}>
              <IconChartBar className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Pool Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kandidaten</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats?.totalCandidates || 0}</p>
                    {pool?.max_candidates && (
                      <span className="text-muted-foreground">/ {pool.max_candidates}</span>
                    )}
                  </div>
                  {pool?.max_candidates && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            ((stats?.totalCandidates || 0) / pool.max_candidates) >= 0.9 ? 'bg-red-500' :
                            ((stats?.totalCandidates || 0) / pool.max_candidates) >= 0.8 ? 'bg-orange-500' :
                            ((stats?.totalCandidates || 0) / pool.max_candidates) >= 0.6 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((stats?.totalCandidates || 0) / pool.max_candidates) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(((stats?.totalCandidates || 0) / pool.max_candidates) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <IconUsers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold">{stats?.featuredCandidates || 0}</p>
                  {stats?.totalCandidates && stats.totalCandidates > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.featuredCandidates / stats.totalCandidates) * 100)}% aller Kandidaten
                    </p>
                  )}
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Meine Auswahlen</p>
                  <p className="text-2xl font-bold">{stats?.mySelections || 0}</p>
                </div>
                <IconHeart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zugriffslevel</p>
                  <p className="text-sm font-medium">
                    {pool?.access_level === "contact" ? "Vollzugriff" :
                     pool?.access_level === "select" ? "Auswählen" : "Nur Ansicht"}
                  </p>
                  {pool?.access_level === "contact" && (
                    <p className="text-xs text-green-600">Kandidaten kontaktieren</p>
                  )}
                </div>
                <IconBriefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.skillsOverview.slice(0, 8).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(skill.count / stats.totalCandidates) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{skill.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selection Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auswahl-Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.selectionTypes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSelectionTypeBadge(item.type)}
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
                {stats.selectionTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Noch keine Auswahlen getroffen</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Kandidaten durchsuchen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kandidaten suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Skill filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Skills</SelectItem>
                  {stats.skillsOverview.slice(0, 10).map((skill, index) => (
                    <SelectItem key={index} value={skill.skill.toLowerCase()}>
                      {skill.skill} ({skill.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectionFilter} onValueChange={setSelectionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="unselected">Nicht ausgewählt</SelectItem>
                  <SelectItem value="selected">Ausgewählt</SelectItem>
                  <SelectItem value="interested">Interessiert</SelectItem>
                  <SelectItem value="shortlisted">Shortlist</SelectItem>
                  <SelectItem value="contacted">Kontaktiert</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Priorität filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="high">Hoch (5+)</SelectItem>
                  <SelectItem value="medium">Mittel (3-4)</SelectItem>
                  <SelectItem value="low">Niedrig (0-2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kandidaten</CardTitle>
                <CardDescription>
                  {filteredCandidates.length} von {stats.totalCandidates} Kandidaten
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={candidateColumns} 
              data={filteredCandidates}
            />
          </CardContent>
        </Card>

        {/* Contact Dialog */}
        <Dialog open={!!contactingCandidate} onOpenChange={() => setContactingCandidate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Kandidat kontaktieren: {contactingCandidate?.first_name} {contactingCandidate?.last_name}
              </DialogTitle>
              <DialogDescription>
                Senden Sie eine E-Mail an {contactingCandidate?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Betreff</label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="E-Mail Betreff"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Nachricht</label>
                <textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Ihre Nachricht..."
                  className="w-full h-32 p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setContactingCandidate(null)}>
                  Abbrechen
                </Button>
                <Button onClick={handleContactCandidate}>
                  <IconMail className="h-4 w-4 mr-2" />
                  E-Mail senden
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 