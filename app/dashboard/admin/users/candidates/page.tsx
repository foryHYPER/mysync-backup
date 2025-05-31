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
import { 
  IconUserCheck, 
  IconSearch, 
  IconFilter,
  IconEdit,
  IconEye,
  IconMail,
  IconMapPin,
  IconStar,
  IconDownload,
  IconExternalLink,
  IconCalendar,
  IconBriefcase
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

type CandidateUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  last_sign_in_at?: string;
  location?: string;
  experience_level?: string;
  availability?: string;
  status?: string;
  skills: Array<{ id: string; name: string }>;
  resume_url?: string;
  total_matches: number;
  active_matches: number;
  avg_match_score?: number;
};

export default function CandidateUsersPage() {
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, statusFilter, experienceFilter, availabilityFilter]);

  async function loadCandidates() {
    try {
      setLoading(true);

      // Load candidate profiles with auth data
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const candidateAuthUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'candidate' || 
        user.app_metadata?.role === 'candidate'
      );

      // Load candidate data from candidates table
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select(`
          id, first_name, last_name, location, experience_level, 
          availability, status, created_at, skills, resume_url
        `)
        .in("id", candidateAuthUsers.map(u => u.id));

      if (!candidatesData) return;

      // Load match statistics for each candidate
      const candidatesWithStats = await Promise.all(
        candidatesData.map(async (candidate) => {
          const authUser = candidateAuthUsers.find(u => u.id === candidate.id);
          
          // Get match statistics
          const [totalMatchesResult, activeMatchesResult, matchScoresResult] = await Promise.all([
            supabase
              .from("candidate_matches")
              .select("id", { count: "exact", head: true })
              .eq("candidate_id", candidate.id),
            supabase
              .from("candidate_matches")
              .select("id", { count: "exact", head: true })
              .eq("candidate_id", candidate.id)
              .eq("status", "pending"),
            supabase
              .from("candidate_matches")
              .select("match_score")
              .eq("candidate_id", candidate.id)
          ]);

          // Calculate average match score
          const matchScores = matchScoresResult.data?.map(m => m.match_score) || [];
          const avgMatchScore = matchScores.length > 0 
            ? matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length 
            : undefined;

          return {
            ...candidate,
            email: authUser?.email || "Unbekannt",
            last_sign_in_at: authUser?.last_sign_in_at,
            total_matches: totalMatchesResult.count || 0,
            active_matches: activeMatchesResult.count || 0,
            avg_match_score: avgMatchScore,
            skills: candidate.skills || [],
          };
        })
      );

      setCandidates(candidatesWithStats);
    } catch (error) {
      console.error("Error loading candidates:", error);
      toast.error("Fehler beim Laden der Kandidaten");
    } finally {
      setLoading(false);
    }
  }

  function filterCandidates() {
    let filtered = candidates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    // Experience filter
    if (experienceFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.experience_level === experienceFilter);
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.availability === availabilityFilter);
    }

    setFilteredCandidates(filtered);
  }

  async function handleCandidateAction(candidateId: string, action: "activate" | "deactivate" | "email" | "delete") {
    try {
      switch (action) {
        case "activate":
        case "deactivate":
          const newStatus = action === "activate" ? "active" : "inactive";
          await supabase
            .from("candidates")
            .update({ status: newStatus })
            .eq("id", candidateId);
          toast.success(`Kandidat ${action === "activate" ? "aktiviert" : "deaktiviert"}`);
          loadCandidates();
          break;
        case "email":
          toast.info("E-Mail-Funktion noch nicht implementiert");
          break;
        case "delete":
          // This would require careful cascade deletion
          toast.info("Löschfunktion noch nicht implementiert");
          break;
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Fehler bei der Kandidatenaktion");
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unbekannt</Badge>;
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status === "active" ? "Aktiv" : "Inaktiv"}
      </Badge>
    );
  };

  const getExperienceBadge = (level?: string) => {
    if (!level) return <Badge variant="outline">Nicht angegeben</Badge>;
    const levelMap = {
      "entry": "Berufseinsteiger",
      "junior": "Junior",
      "mid": "Erfahren", 
      "senior": "Senior",
      "expert": "Experte"
    };
    return <Badge variant="outline">{levelMap[level as keyof typeof levelMap] || level}</Badge>;
  };

  const getAvailabilityBadge = (availability?: string) => {
    if (!availability) return <Badge variant="outline">Nicht angegeben</Badge>;
    const availabilityMap = {
      "immediately": "Sofort verfügbar",
      "1_month": "In 1 Monat",
      "3_months": "In 3 Monaten",
      "negotiable": "Verhandelbar"
    };
    return <Badge variant="secondary">{availabilityMap[availability as keyof typeof availabilityMap] || availability}</Badge>;
  };

  const candidateColumns: ColumnDef<CandidateUser>[] = [
    {
      accessorKey: "name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
          {row.original.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <IconMapPin className="h-3 w-3" />
              {row.original.location}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "experience_level",
      header: "Erfahrung",
      cell: ({ row }) => getExperienceBadge(row.original.experience_level),
    },
    {
      accessorKey: "availability",
      header: "Verfügbarkeit",
      cell: ({ row }) => getAvailabilityBadge(row.original.availability),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.skills.slice(0, 2).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill.name}
            </Badge>
          ))}
          {row.original.skills.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.skills.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "total_matches",
      header: "Performance",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{row.original.total_matches} Matches</span>
          <span className="text-muted-foreground">{row.original.active_matches} aktiv</span>
          {row.original.avg_match_score && (
            <div className="flex items-center gap-1">
              <IconStar className="h-3 w-3 text-yellow-500" />
              <span className="text-xs">{row.original.avg_match_score.toFixed(1)}%</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Beigetreten",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.original.created_at).toLocaleDateString("de-DE")}</span>
          <span className="text-muted-foreground">
            {row.original.last_sign_in_at 
              ? `Zuletzt: ${new Date(row.original.last_sign_in_at).toLocaleDateString("de-DE")}`
              : "Nie eingeloggt"
            }
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
              <IconEdit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconEye className="h-4 w-4 mr-2" />
                  Profile ansehen
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Kandidatenprofil - {row.original.first_name} {row.original.last_name}
                  </DialogTitle>
                  <DialogDescription>
                    Vollständige Kandidateninformationen und Statistiken
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-muted-foreground">
                        {row.original.first_name} {row.original.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="text-sm text-muted-foreground">{row.original.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Standort</label>
                      <p className="text-sm text-muted-foreground">{row.original.location || "Nicht angegeben"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Erfahrungslevel</label>
                      <p className="text-sm text-muted-foreground">{row.original.experience_level || "Nicht angegeben"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Verfügbarkeit</label>
                      <p className="text-sm text-muted-foreground">{row.original.availability || "Nicht angegeben"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground">{row.original.status || "Unbekannt"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {row.original.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {row.original.resume_url && (
                    <div>
                      <label className="text-sm font-medium">Lebenslauf</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="outline" size="sm" asChild>
                          <a href={row.original.resume_url} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink className="h-4 w-4 mr-2" />
                            Lebenslauf öffnen
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.total_matches}</p>
                      <p className="text-sm text-muted-foreground">Gesamt Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.active_matches}</p>
                      <p className="text-sm text-muted-foreground">Aktive Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {row.original.avg_match_score ? row.original.avg_match_score.toFixed(1) + "%" : "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">Match-Score</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenuItem onClick={() => handleCandidateAction(row.original.id, "email")}>
              <IconMail className="h-4 w-4 mr-2" />
              E-Mail senden
            </DropdownMenuItem>
            
            {row.original.status === "active" ? (
              <DropdownMenuItem 
                onClick={() => handleCandidateAction(row.original.id, "deactivate")}
              >
                Deaktivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => handleCandidateAction(row.original.id, "activate")}
              >
                Aktivieren
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleCandidateAction(row.original.id, "delete")}
            >
              Kandidat löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Benutzer</h1>
          <p className="text-muted-foreground">
            Verwaltung aller Benutzer mit Kandidaten-Rolle im System
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Kandidaten</p>
                  <p className="text-2xl font-bold">{candidates.length}</p>
                </div>
                <IconUserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Kandidaten</p>
                  <p className="text-2xl font-bold">
                    {candidates.filter(c => c.status === "active").length}
                  </p>
                </div>
                <IconStar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mit Lebenslauf</p>
                  <p className="text-2xl font-bold">
                    {candidates.filter(c => c.resume_url).length}
                  </p>
                </div>
                <IconDownload className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Matches</p>
                  <p className="text-2xl font-bold">
                    {candidates.length > 0 
                      ? Math.round(candidates.reduce((sum, c) => sum + c.total_matches, 0) / candidates.length)
                      : 0
                    }
                  </p>
                </div>
                <IconBriefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Name, E-Mail, Ort, Skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Erfahrung wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Level</SelectItem>
                  <SelectItem value="entry">Berufseinsteiger</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Erfahren</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="expert">Experte</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Verfügbarkeit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="immediately">Sofort</SelectItem>
                  <SelectItem value="1_month">1 Monat</SelectItem>
                  <SelectItem value="3_months">3 Monate</SelectItem>
                  <SelectItem value="negotiable">Verhandelbar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kandidaten-Benutzer ({filteredCandidates.length})</CardTitle>
            <CardDescription>
              Alle Benutzerkonten mit Kandidaten-Rolle und deren Profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={candidateColumns} 
              data={filteredCandidates}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 