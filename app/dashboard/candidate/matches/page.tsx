"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CandidateMatch } from "@/lib/services/matching";
import { MatchingService } from "@/lib/services/matching";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Building2, DollarSign, Calendar, Briefcase } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type JobPosting = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  salary_range: string | null;
  requirements: Record<string, unknown>;
  companies: {
    name: string;
    logo: string | null;
  } | null;
};

type JobPostingsMap = Record<string, JobPosting>;

export default function CandidateMatchesPage() {
  const profile = useProfile();
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const matchingService = useMemo(() => new MatchingService(), []);
  const supabase = useMemo(() => createClient(), []);

  const loadMatches = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);
    try {
      console.log("Lade Matches für Kandidat:", profile.id);
      const candidateMatches = await matchingService.getCandidateMatches(profile.id);
      console.log("Geladene Matches:", candidateMatches);
      setMatches(candidateMatches);

      // Lade Job-Posting-Informationen für alle Matches
      const jobIds = candidateMatches.map(m => m.job_posting_id);
      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from("job_postings")
          .select(`
            *,
            companies(name, logo)
          `)
          .in("id", jobIds);
        
        if (jobs) {
          const jobMap = jobs.reduce((acc, job) => {
            acc[job.id] = job as JobPosting;
            return acc;
          }, {} as JobPostingsMap);
          setJobPostings(jobMap);
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Matches:", error);
      setError("Fehler beim Laden der Matches. Bitte versuchen Sie es später erneut.");
    }
    setLoading(false);
  }, [profile?.id, matchingService, supabase]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleStatusChange = async (matchId: string, status: string) => {
    try {
      await matchingService.updateMatchStatus(
        matchId,
        status as "pending" | "reviewed" | "contacted" | "rejected"
      );
      loadMatches(); // Aktualisiere die Liste
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "reviewed": return "bg-blue-500";
      case "contacted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Ausstehend";
      case "reviewed": return "Geprüft";
      case "contacted": return "Kontaktiert";
      case "rejected": return "Abgelehnt";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-2">Lade Matches...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-500">
          <div className="mb-2">{error}</div>
          <Button variant="outline" onClick={loadMatches}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Matches gefunden</h3>
            <p className="text-muted-foreground">
              Aktuell gibt es keine passenden Stellenangebote für Ihr Profil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transformiere Matches mit den Job-Posting-Informationen
  const enrichedMatches = matches.map(match => {
    const jobInfo = jobPostings[match.job_posting_id] || {
      title: "Stelle wird geladen...",
      description: "",
      company: { name: "Unbekannt" },
      location: "Unbekannt",
      salary_range: "Nicht angegeben",
      requirements: {}
    };

    return {
      ...match,
      jobInfo
    };
  });

  return (
    <main className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Job-Matches</h1>
        <p className="text-muted-foreground">
          Basierend auf Ihrem Profil haben wir {matches.length} passende Stellen gefunden.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="text-muted-foreground">Lade Matches...</div>
          </div>
        </div>
      ) : error ? (
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="text-red-500 text-lg">{error}</div>
            <Button 
              variant="outline" 
              onClick={loadMatches}
              className="font-medium text-[#000000]"
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Matches gefunden</h3>
            <p className="text-muted-foreground">
              Aktuell gibt es keine passenden Stellenangebote für Ihr Profil.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrichedMatches.map((match) => {
            const jobInfo = match.jobInfo;
            const matchScore = Math.round(match.match_score);
            const skillMatches = match.match_details.skillMatches.filter(s => s.match).length;
            const totalSkills = match.match_details.skillMatches.length;
            
            return (
              <Card key={match.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {jobInfo.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="line-clamp-1">{jobInfo.companies?.name || "Unbekannt"}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`${getStatusColor(match.status)} text-white px-2.5 py-0.5 text-xs font-medium`}
                    >
                      {getStatusText(match.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Match-Score</span>
                      <span className="text-sm font-semibold">{matchScore}%</span>
                    </div>
                    <Progress 
                      value={matchScore} 
                      className={`h-2 ${matchScore >= 80 ? "bg-green-500" : matchScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="line-clamp-1">{jobInfo.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="line-clamp-1">{jobInfo.salary_range || "Nicht angegeben"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{format(new Date(match.created_at), "dd. MMM yyyy", { locale: de })}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">Match-Details</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Skills:</span>
                        <span className="text-muted-foreground">{skillMatches}/{totalSkills}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Erfahrung:</span>
                        <span className="text-muted-foreground">{Math.round(match.match_details.experienceMatch)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Standort:</span>
                        <span className={match.match_details.locationMatch ? "text-green-600" : "text-red-600"}>
                          {match.match_details.locationMatch ? "✓" : "✗"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Verfügbar:</span>
                        <span className={match.match_details.availabilityMatch ? "text-green-600" : "text-red-600"}>
                          {match.match_details.availabilityMatch ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {jobInfo.description && (
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {jobInfo.description}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 font-medium text-white bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Hier könnte eine Bewerbungsfunktion implementiert werden
                      }}
                    >
                      Bewerben
                    </Button>
                    <Button 
                      size="sm"
                      className="font-medium text-white bg-secondary hover:bg-secondary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Hier könnte eine Detailansicht implementiert werden
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
} 