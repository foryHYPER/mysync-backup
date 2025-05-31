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
  IconUserCheck,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconEye,
  IconAlertTriangle,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcase,
  IconRefresh,
  IconFilter,
  IconCalendar,
  IconStar,
  IconFlag,
  IconShield,
  IconTarget,
  IconTrendingUp
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

type CandidateQuality = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_level: string;
  skills: string[];
  status: "active" | "inactive" | "under_review" | "flagged";
  quality_score: number;
  profile_completeness: number;
  verification_status: "verified" | "pending" | "failed";
  red_flags: string[];
  last_activity: string;
  created_at: string;
  resume_quality: "excellent" | "good" | "needs_improvement" | "poor";
  match_success_rate: number;
  employer_feedback_score: number;
};

type QualityMetrics = {
  totalCandidates: number;
  verifiedCandidates: number;
  flaggedCandidates: number;
  averageQualityScore: number;
  highQualityProfiles: number;
  pendingVerification: number;
};

export default function CandidateQualityPage() {
  const [candidates, setCandidates] = useState<CandidateQuality[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateQuality[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateQuality | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadQualityData();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, statusFilter, qualityFilter, searchTerm]);

  async function loadQualityData() {
    try {
      setLoading(true);

      // Load candidates data
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!candidatesData) return;

      // Mock quality data enhancement - in real app, this would come from a quality assessment system
      const qualityCandidates: CandidateQuality[] = candidatesData.map(candidate => {
        const qualityScore = Math.floor(Math.random() * 100) + 1;
        const profileCompleteness = Math.floor(Math.random() * 100) + 1;
        const redFlags = [];
        
        // Generate random red flags for some candidates
        if (Math.random() > 0.7) {
          const possibleFlags = [
            "Unvollständige Kontaktdaten",
            "Verdächtige Arbeitserfahrung", 
            "Keine Verifizierung möglich",
            "Inkonsistente Angaben",
            "Fehlende Referenzen"
          ];
          redFlags.push(possibleFlags[Math.floor(Math.random() * possibleFlags.length)]);
        }

        const statuses = ["active", "inactive", "under_review", "flagged"];
        const verificationStatuses = ["verified", "pending", "failed"];
        const resumeQualities = ["excellent", "good", "needs_improvement", "poor"];

        return {
          id: candidate.id,
          first_name: candidate.first_name || "Unbekannt",
          last_name: candidate.last_name || "",
          email: candidate.email || "Keine E-Mail",
          phone: candidate.phone,
          location: candidate.location,
          experience_level: candidate.experience_level || "Nicht angegeben",
          skills: candidate.skills || [],
          status: statuses[Math.floor(Math.random() * statuses.length)] as CandidateQuality["status"],
          quality_score: qualityScore,
          profile_completeness: profileCompleteness,
          verification_status: verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)] as CandidateQuality["verification_status"],
          red_flags: redFlags,
          last_activity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: candidate.created_at,
          resume_quality: resumeQualities[Math.floor(Math.random() * resumeQualities.length)] as CandidateQuality["resume_quality"],
          match_success_rate: Math.floor(Math.random() * 100),
          employer_feedback_score: Math.floor(Math.random() * 5) + 1
        };
      });

      // Calculate metrics
      const totalCandidates = qualityCandidates.length;
      const verifiedCandidates = qualityCandidates.filter(c => c.verification_status === "verified").length;
      const flaggedCandidates = qualityCandidates.filter(c => c.status === "flagged" || c.red_flags.length > 0).length;
      const averageQualityScore = qualityCandidates.reduce((sum, c) => sum + c.quality_score, 0) / Math.max(totalCandidates, 1);
      const highQualityProfiles = qualityCandidates.filter(c => c.quality_score >= 80).length;
      const pendingVerification = qualityCandidates.filter(c => c.verification_status === "pending").length;

      setMetrics({
        totalCandidates,
        verifiedCandidates,
        flaggedCandidates,
        averageQualityScore,
        highQualityProfiles,
        pendingVerification
      });

      setCandidates(qualityCandidates);

    } catch (error) {
      console.error("Error loading quality data:", error);
      toast.error("Fehler beim Laden der Qualitätsdaten");
    } finally {
      setLoading(false);
    }
  }

  function filterCandidates() {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    if (qualityFilter !== "all") {
      if (qualityFilter === "high") {
        filtered = filtered.filter(candidate => candidate.quality_score >= 80);
      } else if (qualityFilter === "low") {
        filtered = filtered.filter(candidate => candidate.quality_score < 60);
      } else if (qualityFilter === "flagged") {
        filtered = filtered.filter(candidate => candidate.red_flags.length > 0);
      }
    }

    setFilteredCandidates(filtered);
  }

  async function handleCandidateAction(candidateId: string, action: "verify" | "flag" | "approve" | "reject") {
    try {
      let updates: any = {};
      
      switch (action) {
        case "verify":
          updates = { verification_status: "verified", status: "active" };
          break;
        case "flag":
          updates = { status: "flagged" };
          break;
        case "approve":
          updates = { status: "active", verification_status: "verified" };
          break;
        case "reject":
          updates = { status: "inactive", verification_status: "failed" };
          break;
      }

      await supabase
        .from("candidates")
        .update(updates)
        .eq("id", candidateId);

      toast.success(`Kandidat erfolgreich ${action === "verify" ? "verifiziert" : action === "flag" ? "markiert" : action === "approve" ? "genehmigt" : "abgelehnt"}`);
      loadQualityData(); // Reload data
      setSelectedCandidate(null);

    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Fehler beim Aktualisieren des Kandidaten");
    }
  }

  function getStatusBadge(status: CandidateQuality["status"]) {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Aktiv</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "under_review":
        return <Badge variant="outline">In Prüfung</Badge>;
      case "flagged":
        return <Badge variant="destructive">Markiert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getVerificationBadge(status: CandidateQuality["verification_status"]) {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-600">Verifiziert</Badge>;
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>;
      case "failed":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getQualityColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  function getResumeQualityBadge(quality: CandidateQuality["resume_quality"]) {
    switch (quality) {
      case "excellent":
        return <Badge variant="default" className="bg-green-600">Ausgezeichnet</Badge>;
      case "good":
        return <Badge variant="default" className="bg-blue-600">Gut</Badge>;
      case "needs_improvement":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Verbesserungsbedarf</Badge>;
      case "poor":
        return <Badge variant="destructive">Mangelhaft</Badge>;
      default:
        return <Badge variant="outline">{quality}</Badge>;
    }
  }

  const qualityColumns: ColumnDef<CandidateQuality>[] = [
    {
      accessorKey: "name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.first_name} {row.original.last_name}</span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "quality_score",
      header: "Qualitäts-Score",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getQualityColor(row.original.quality_score)}`}>
            {row.original.quality_score}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      ),
    },
    {
      accessorKey: "verification_status",
      header: "Verifizierung",
      cell: ({ row }) => getVerificationBadge(row.original.verification_status),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "red_flags",
      header: "Probleme",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.red_flags.length > 0 ? (
            <>
              <IconFlag className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{row.original.red_flags.length}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Keine</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "last_activity",
      header: "Letzte Aktivität",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.last_activity).toLocaleDateString("de-DE")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCandidate(row.original)}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconCheck className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCandidateAction(row.original.id, "verify")}>
                Verifizieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCandidateAction(row.original.id, "flag")}>
                Markieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCandidateAction(row.original.id, "approve")}>
                Genehmigen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCandidateAction(row.original.id, "reject")}>
                Ablehnen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Qualitätskontrolle</h1>
            <p className="text-muted-foreground">Lade Qualitätsdaten...</p>
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
          <Link href="/dashboard/admin/candidates">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Kandidaten
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Kandidaten-Qualitätskontrolle</h1>
            <p className="text-muted-foreground">
              Überprüfe und verwalte die Qualität von Kandidatenprofilen
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Kandidaten</p>
                  <p className="text-2xl font-bold">{metrics.totalCandidates}</p>
                </div>
                <IconUserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verifiziert</p>
                  <p className="text-2xl font-bold">{metrics.verifiedCandidates}</p>
                </div>
                <IconShield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Markiert</p>
                  <p className="text-2xl font-bold">{metrics.flaggedCandidates}</p>
                </div>
                <IconFlag className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Qualitäts-Score</p>
                  <p className="text-2xl font-bold">{metrics.averageQualityScore.toFixed(1)}</p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hochqualitativ</p>
                  <p className="text-2xl font-bold">{metrics.highQualityProfiles}</p>
                </div>
                <IconTrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wartend</p>
                  <p className="text-2xl font-bold">{metrics.pendingVerification}</p>
                </div>
                <IconAlertTriangle className="h-8 w-8 text-orange-600" />
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
                    placeholder="Kandidaten suchen..."
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
                    <SelectItem value="under_review">In Prüfung</SelectItem>
                    <SelectItem value="flagged">Markiert</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Qualität filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Qualitäten</SelectItem>
                    <SelectItem value="high">Hoch (80+)</SelectItem>
                    <SelectItem value="low">Niedrig (&lt;60)</SelectItem>
                    <SelectItem value="flagged">Mit Problemen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={loadQualityData}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kandidaten-Qualitätsbewertung</CardTitle>
            <CardDescription>
              Verwalte Kandidatenprofile und Qualitätsstandards ({filteredCandidates.length} Kandidaten)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={qualityColumns} 
              data={filteredCandidates}
            />
          </CardContent>
        </Card>

        {/* Candidate Details Modal */}
        {selectedCandidate && (
          <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconUserCheck className="h-5 w-5" />
                  {selectedCandidate.first_name} {selectedCandidate.last_name}
                  {getStatusBadge(selectedCandidate.status)}
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Qualitätsbewertung und Profilinformationen
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Candidate Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Kandidateninformationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCandidate.email}</span>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCandidate.phone}</span>
                      </div>
                    )}
                    {selectedCandidate.location && (
                      <div className="flex items-center gap-2">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCandidate.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Erfahrung: {selectedCandidate.experience_level}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Red Flags */}
                  {selectedCandidate.red_flags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-red-600">Probleme</h4>
                      <div className="space-y-1">
                        {selectedCandidate.red_flags.map((flag, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                            <IconAlertTriangle className="h-4 w-4" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quality Assessment */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Qualitätsbewertung</h3>
                  
                  {/* Quality Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Qualitäts-Score</span>
                      <span className={`text-lg font-bold ${getQualityColor(selectedCandidate.quality_score)}`}>
                        {selectedCandidate.quality_score}/100
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          selectedCandidate.quality_score >= 80 ? "bg-green-600" : 
                          selectedCandidate.quality_score >= 60 ? "bg-yellow-600" : "bg-red-600"
                        }`}
                        style={{ width: `${selectedCandidate.quality_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Profile Completeness */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Profil-Vollständigkeit</span>
                      <span className="text-sm">{selectedCandidate.profile_completeness}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${selectedCandidate.profile_completeness}%` }}
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verifizierungsstatus</span>
                      {getVerificationBadge(selectedCandidate.verification_status)}
                    </div>
                  </div>

                  {/* Resume Quality */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lebenslauf-Qualität</span>
                      {getResumeQualityBadge(selectedCandidate.resume_quality)}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Performance-Metriken</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Match-Erfolgsrate</span>
                        <span className="font-medium">{selectedCandidate.match_success_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Arbeitgeber-Bewertung</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <IconStar 
                              key={i} 
                              className={`h-3 w-3 ${i < selectedCandidate.employer_feedback_score ? "text-yellow-500 fill-current" : "text-gray-300"}`} 
                            />
                          ))}
                          <span className="ml-1 text-xs">({selectedCandidate.employer_feedback_score}/5)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span>Registriert: {new Date(selectedCandidate.created_at).toLocaleDateString("de-DE")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconTarget className="h-4 w-4 text-muted-foreground" />
                        <span>Letzte Aktivität: {new Date(selectedCandidate.last_activity).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleCandidateAction(selectedCandidate.id, "verify")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <IconShield className="h-4 w-4 mr-2" />
                      Verifizieren
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleCandidateAction(selectedCandidate.id, "flag")}
                    >
                      <IconFlag className="h-4 w-4 mr-2" />
                      Markieren
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 