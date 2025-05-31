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
  IconFileText,
  IconArrowLeft,
  IconDownload,
  IconEye,
  IconRefresh,
  IconFilter,
  IconCalendar,
  IconUser,
  IconBriefcase,
  IconStar,
  IconFileAnalytics,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconSearch
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

type Resume = {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  filename: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  last_updated: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  quality_score: number;
  skills_extracted: string[];
  experience_years: number;
  education_level: string;
  languages: string[];
  analysis_complete: boolean;
  reviewer_notes?: string;
  download_count: number;
  match_count: number;
};

type ResumeMetrics = {
  totalResumes: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  averageQualityScore: number;
  totalDownloads: number;
};

export default function ResumeManagementPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [metrics, setMetrics] = useState<ResumeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadResumeData();
  }, []);

  useEffect(() => {
    filterResumes();
  }, [resumes, statusFilter, qualityFilter, searchTerm]);

  async function loadResumeData() {
    try {
      setLoading(true);

      // Load candidates data for resume information
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!candidatesData) return;

      // Mock resume data - in real app, this would come from a resumes table
      const resumeData: Resume[] = candidatesData
        .filter(() => Math.random() > 0.3) // Some candidates have resumes
        .map(candidate => {
          const statuses = ["pending", "approved", "rejected", "under_review"];
          const qualityScore = Math.floor(Math.random() * 100) + 1;
          const educationLevels = ["Bachelor", "Master", "PhD", "Ausbildung", "Promotion"];
          const extractedSkills = [
            "JavaScript", "React", "Node.js", "Python", "Java", "TypeScript", 
            "SQL", "AWS", "Docker", "Git", "Agile", "Scrum"
          ];
          
          return {
            id: `resume-${candidate.id}`,
            candidate_id: candidate.id,
            candidate_name: `${candidate.first_name || "Unbekannt"} ${candidate.last_name || ""}`.trim(),
            candidate_email: candidate.email || "Keine E-Mail",
            filename: `${candidate.first_name || "resume"}_${candidate.last_name || "candidate"}_CV.pdf`,
            file_url: `/resumes/${candidate.id}/cv.pdf`,
            file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
            uploaded_at: candidate.created_at,
            last_updated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: statuses[Math.floor(Math.random() * statuses.length)] as Resume["status"],
            quality_score: qualityScore,
            skills_extracted: extractedSkills.slice(0, Math.floor(Math.random() * 8) + 2),
            experience_years: Math.floor(Math.random() * 20) + 1,
            education_level: educationLevels[Math.floor(Math.random() * educationLevels.length)],
            languages: ["Deutsch", "Englisch"].slice(0, Math.floor(Math.random() * 2) + 1),
            analysis_complete: Math.random() > 0.2,
            download_count: Math.floor(Math.random() * 50),
            match_count: Math.floor(Math.random() * 20)
          };
        });

      // Calculate metrics
      const totalResumes = resumeData.length;
      const pendingReview = resumeData.filter(r => r.status === "pending" || r.status === "under_review").length;
      const approved = resumeData.filter(r => r.status === "approved").length;
      const rejected = resumeData.filter(r => r.status === "rejected").length;
      const averageQualityScore = resumeData.reduce((sum, r) => sum + r.quality_score, 0) / Math.max(totalResumes, 1);
      const totalDownloads = resumeData.reduce((sum, r) => sum + r.download_count, 0);

      setMetrics({
        totalResumes,
        pendingReview,
        approved,
        rejected,
        averageQualityScore,
        totalDownloads
      });

      setResumes(resumeData);

    } catch (error) {
      console.error("Error loading resume data:", error);
      toast.error("Fehler beim Laden der Lebenslauf-Daten");
    } finally {
      setLoading(false);
    }
  }

  function filterResumes() {
    let filtered = resumes;

    if (searchTerm) {
      filtered = filtered.filter(resume => 
        resume.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.skills_extracted.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(resume => resume.status === statusFilter);
    }

    if (qualityFilter !== "all") {
      if (qualityFilter === "high") {
        filtered = filtered.filter(resume => resume.quality_score >= 80);
      } else if (qualityFilter === "low") {
        filtered = filtered.filter(resume => resume.quality_score < 60);
      } else if (qualityFilter === "unanalyzed") {
        filtered = filtered.filter(resume => !resume.analysis_complete);
      }
    }

    setFilteredResumes(filtered);
  }

  async function handleResumeAction(resumeId: string, action: "approve" | "reject" | "analyze" | "download") {
    try {
      switch (action) {
        case "approve":
          // Update resume status to approved
          toast.success("Lebenslauf genehmigt");
          break;
        case "reject":
          // Update resume status to rejected
          toast.success("Lebenslauf abgelehnt");
          break;
        case "analyze":
          // Trigger resume analysis
          toast.success("Analyse gestartet");
          break;
        case "download":
          // Track download and initiate download
          toast.success("Download gestartet");
          break;
      }
      
      loadResumeData(); // Reload data
      setSelectedResume(null);

    } catch (error) {
      console.error("Error performing resume action:", error);
      toast.error("Fehler bei der Aktion");
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getStatusBadge(status: Resume["status"]) {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>;
      case "under_review":
        return <Badge variant="secondary">In Prüfung</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Genehmigt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getQualityColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  const resumeColumns: ColumnDef<Resume>[] = [
    {
      accessorKey: "candidate_name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.candidate_name}</span>
          <span className="text-sm text-muted-foreground">{row.original.candidate_email}</span>
        </div>
      ),
    },
    {
      accessorKey: "filename",
      header: "Datei",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.filename}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(row.original.file_size)}</span>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "analysis_complete",
      header: "Analyse",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.analysis_complete ? (
            <>
              <IconCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Abgeschlossen</span>
            </>
          ) : (
            <>
              <IconAlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">Ausstehend</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: "uploaded_at",
      header: "Hochgeladen",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.uploaded_at).toLocaleDateString("de-DE")}
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
                onClick={() => setSelectedResume(row.original)}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleResumeAction(row.original.id, "download")}
          >
            <IconDownload className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFileAnalytics className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleResumeAction(row.original.id, "approve")}>
                Genehmigen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResumeAction(row.original.id, "reject")}>
                Ablehnen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResumeAction(row.original.id, "analyze")}>
                Analyse starten
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
            <h1 className="text-3xl font-bold tracking-tight">Lebenslauf-Verwaltung</h1>
            <p className="text-muted-foreground">Lade Lebenslauf-Daten...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Lebenslauf-Verwaltung</h1>
            <p className="text-muted-foreground">
              Verwalte und analysiere alle Kandidaten-Lebensläufe
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Lebensläufe</p>
                  <p className="text-2xl font-bold">{metrics.totalResumes}</p>
                </div>
                <IconFileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wartend</p>
                  <p className="text-2xl font-bold">{metrics.pendingReview}</p>
                </div>
                <IconAlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Genehmigt</p>
                  <p className="text-2xl font-bold">{metrics.approved}</p>
                </div>
                <IconCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abgelehnt</p>
                  <p className="text-2xl font-bold">{metrics.rejected}</p>
                </div>
                <IconX className="h-8 w-8 text-red-600" />
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
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="text-2xl font-bold">{metrics.totalDownloads}</p>
                </div>
                <IconDownload className="h-8 w-8 text-blue-600" />
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
                  <IconSearch className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Lebensläufe suchen..."
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
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="under_review">In Prüfung</SelectItem>
                    <SelectItem value="approved">Genehmigt</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
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
                    <SelectItem value="unanalyzed">Nicht analysiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={loadResumeData}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lebenslauf-Übersicht</CardTitle>
            <CardDescription>
              Verwalte alle Kandidaten-Lebensläufe und deren Analysen ({filteredResumes.length} Lebensläufe)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={resumeColumns} 
              data={filteredResumes}
            />
          </CardContent>
        </Card>

        {/* Resume Details Modal */}
        {selectedResume && (
          <Dialog open={!!selectedResume} onOpenChange={() => setSelectedResume(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  {selectedResume.filename}
                  {getStatusBadge(selectedResume.status)}
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Lebenslauf-Analyse und Informationen
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Resume Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Allgemeine Informationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedResume.candidate_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatFileSize(selectedResume.file_size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Hochgeladen: {new Date(selectedResume.uploaded_at).toLocaleDateString("de-DE")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconDownload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedResume.download_count} Downloads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedResume.match_count} Matches</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Extrahierte Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.skills_extracted.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Sprachen</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.languages.map((language, index) => (
                        <Badge key={index} variant="secondary">{language}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Analyse-Ergebnisse</h3>
                  
                  {/* Quality Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Qualitäts-Score</span>
                      <span className={`text-lg font-bold ${getQualityColor(selectedResume.quality_score)}`}>
                        {selectedResume.quality_score}/100
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          selectedResume.quality_score >= 80 ? "bg-green-600" : 
                          selectedResume.quality_score >= 60 ? "bg-yellow-600" : "bg-red-600"
                        }`}
                        style={{ width: `${selectedResume.quality_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Berufserfahrung</span>
                        <p className="text-muted-foreground">{selectedResume.experience_years} Jahre</p>
                      </div>
                      <div>
                        <span className="font-medium">Bildungsabschluss</span>
                        <p className="text-muted-foreground">{selectedResume.education_level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Analyse-Status</span>
                      {selectedResume.analysis_complete ? (
                        <Badge variant="default" className="bg-green-600">Abgeschlossen</Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">Ausstehend</Badge>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span>Hochgeladen: {new Date(selectedResume.uploaded_at).toLocaleDateString("de-DE")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconFileAnalytics className="h-4 w-4 text-muted-foreground" />
                        <span>Letzte Aktualisierung: {new Date(selectedResume.last_updated).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleResumeAction(selectedResume.id, "download")}
                      className="w-full"
                    >
                      <IconDownload className="h-4 w-4 mr-2" />
                      Lebenslauf herunterladen
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleResumeAction(selectedResume.id, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <IconCheck className="h-4 w-4 mr-2" />
                        Genehmigen
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleResumeAction(selectedResume.id, "reject")}
                      >
                        <IconX className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </div>
                    {!selectedResume.analysis_complete && (
                      <Button 
                        variant="outline"
                        onClick={() => handleResumeAction(selectedResume.id, "analyze")}
                        className="w-full"
                      >
                        <IconFileAnalytics className="h-4 w-4 mr-2" />
                        Analyse starten
                      </Button>
                    )}
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