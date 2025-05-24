"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CandidateMatch } from "@/lib/services/matching";
import { MatchingService } from "@/lib/services/matching";
import { createClient } from "@/lib/supabase/client";
import { FileText, MapPin, Building2, DollarSign, Calendar, Briefcase } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useMemo } from "react";

export default function CandidateMatchesPage() {
  const profile = useProfile();
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [jobPostings, setJobPostings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<CandidateMatch | null>(null);
  const matchingService = useMemo(() => new MatchingService(), []);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    loadMatches();
  }, [profile]);

  const loadMatches = async () => {
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
            acc[job.id] = job;
            return acc;
          }, {} as Record<string, any>);
          setJobPostings(jobMap);
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Matches:", error);
      setError("Fehler beim Laden der Matches. Bitte versuchen Sie es später erneut.");
    }
    setLoading(false);
  };

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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ihre Job-Matches</h1>
        <p className="text-muted-foreground">
          Basierend auf Ihrem Profil haben wir {matches.length} passende Stellen gefunden.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrichedMatches.map((match) => {
          const jobInfo = match.jobInfo;
          
          return (
            <Card key={match.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedMatch(match)}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{jobInfo.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{jobInfo.companies?.name || "Unbekannt"}</span>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(match.status)} text-white`}>
                    {getStatusText(match.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Progress value={match.match_score} className="w-24" />
                    <span className="text-sm font-semibold">{Math.round(match.match_score)}%</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{jobInfo.location || "Remote"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{jobInfo.salary_range || "Nicht angegeben"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Erstellt: {format(new Date(match.created_at), "dd. MMM yyyy", { locale: de })}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Match-Details:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Skills: {match.match_details.skillMatches.filter(s => s.match).length}/{match.match_details.skillMatches.length}</div>
                    <div>Erfahrung: {Math.round(match.match_details.experienceMatch)}%</div>
                    <div>Standort: {match.match_details.locationMatch ? "✓" : "✗"}</div>
                    <div>Verfügbar: {match.match_details.availabilityMatch ? "✓" : "✗"}</div>
                  </div>
                </div>

                {jobInfo.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {jobInfo.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Hier könnte eine Bewerbungsfunktion implementiert werden
                    }}
                  >
                    Bewerben
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(match.id, "rejected");
                    }}
                  >
                    Ablehnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 