"use client";

import { useState, useMemo, useEffect } from "react";
import { getColumns, MatchTableItem } from "./columns";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { MockMatchingService } from "@/lib/services/mock-matching";
import { useProfile } from "@/context/ProfileContext";

// Mock-Daten für Job-Postings
const mockJobPostings = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    company: "TechCorp GmbH",
    location: "Berlin",
    requirements: {
      requiredSkills: ["JavaScript", "React", "TypeScript"],
      preferredSkills: ["Node.js", "AWS"],
      experience: 5
    }
  },
  {
    id: "job-2",
    title: "Full Stack Developer",
    company: "Digital Solutions AG",
    location: "München",
    requirements: {
      requiredSkills: ["Java", "Spring", "SQL"],
      preferredSkills: ["Docker", "AWS"],
      experience: 3
    }
  },
  {
    id: "job-3",
    title: "DevOps Engineer",
    company: "Cloud Systems GmbH",
    location: "Hamburg",
    requirements: {
      requiredSkills: ["Python", "Docker", "AWS"],
      preferredSkills: ["Kubernetes", "Terraform"],
      experience: 4
    }
  },
  {
    id: "job-4",
    title: "Backend Developer",
    company: "Software Solutions GmbH",
    location: "Frankfurt",
    requirements: {
      requiredSkills: ["Java", "Spring Boot", "PostgreSQL"],
      preferredSkills: ["Docker", "Kubernetes"],
      experience: 3
    }
  },
  {
    id: "job-5",
    title: "Mobile Developer",
    company: "AppWorks GmbH",
    location: "Berlin",
    requirements: {
      requiredSkills: ["Swift", "Kotlin", "React Native"],
      preferredSkills: ["Firebase", "AWS"],
      experience: 2
    }
  }
];

const PAGE_SIZE = 5;

export default function CandidateMatchesPage() {
  const profile = useProfile();
  const [matches, setMatches] = useState<MatchTableItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [details, setDetails] = useState<MatchTableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Erstelle eine neue Instanz des MatchingService
  const matchingService = useMemo(() => new MockMatchingService(), []);

  useEffect(() => {
    let isMounted = true;

    if (!profile?.id) {
      return;
    }

    (async () => {
      try {
        matchingService.initializeProfile(profile.id);
        const candidateMatches = await matchingService.getCandidateMatches(profile.id);
        if (!isMounted) return;
        
        // Transformiere Matches mit den Mock-Job-Posting-Informationen
        const tableMatches = candidateMatches.map(match => {
          const jobInfo = mockJobPostings.find(job => job.id === match.job_posting_id) || {
            title: "Unbekannte Position",
            company: "Unbekanntes Unternehmen"
          };

          return {
            id: match.id,
            company: jobInfo.company,
            job_title: jobInfo.title,
            match_score: match.match_score,
            match_details: match.match_details,
            status: match.status,
          };
        });

        setMatches(tableMatches);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError("Fehler beim Laden der Matches");
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profile?.id, matchingService]);

  const filtered = useMemo(() =>
    matches.filter(
      (match) =>
        match.company.toLowerCase().includes(search.toLowerCase()) ||
        match.job_title.toLowerCase().includes(search.toLowerCase())
    ),
    [search, matches]
  );

  const paged = useMemo(() =>
    filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const handleShowDetails = (match: MatchTableItem) => {
    setDetails(match);
  };

  const handleUpdateStatus = async (matchId: string, status: string) => {
    try {
      await matchingService.updateMatchStatus(
        matchId,
        status as "pending" | "reviewed" | "contacted" | "rejected"
      );
      toast.success("Status erfolgreich aktualisiert");
      // Reload matches
      const candidateMatches = await matchingService.getCandidateMatches(profile.id);
      const tableMatches = candidateMatches.map(match => {
        const jobInfo = mockJobPostings.find(job => job.id === match.job_posting_id) || {
          title: "Unbekannte Position",
          company: "Unbekanntes Unternehmen"
        };
        return {
          id: match.id,
          company: jobInfo.company,
          job_title: jobInfo.title,
          match_score: match.match_score,
          match_details: match.match_details,
          status: match.status,
        };
      });
      setMatches(tableMatches);
      setDetails(null);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status:", error);
      toast.error("Fehler beim Aktualisieren des Status");
    }
  };

  const handleDialogClose = () => {
    setDetails(null);
  };

  if (!profile?.id) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div>Lade Profil...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div>Lade Matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Toaster />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Passende Stellen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  <Input
                    placeholder="Suche nach Unternehmen oder Position..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="max-w-xs"
                  />
                </div>
                <DataTable 
                  columns={getColumns(handleShowDetails, handleUpdateStatus)} 
                  data={paged} 
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-4">
                <span>
                  Seite {page + 1} von {pageCount || 1}
                </span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Zurück
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Weiter
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!details} onOpenChange={open => { if (!open) handleDialogClose(); }}>
        <DialogContent className="transition-all duration-300">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zum Match.
            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold">Unternehmen</div>
                  <div>{details.company}</div>
                </div>
                <div>
                  <div className="font-semibold">Position</div>
                  <div>{details.job_title}</div>
                </div>
                <div>
                  <div className="font-semibold">Match Score</div>
                  <div className="flex items-center gap-2">
                    <Progress value={details.match_score} className="w-[100px]" />
                    <span>{Math.round(details.match_score)}%</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Status</div>
                  <Badge className={details.status === "pending" ? "bg-yellow-500" : 
                    details.status === "reviewed" ? "bg-blue-500" :
                    details.status === "contacted" ? "bg-green-500" : "bg-red-500"}>
                    {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold">Match Details</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium">Skills</div>
                    <Progress value={details.match_details.skillMatches.reduce((acc, m) => acc + m.score, 0) / details.match_details.skillMatches.length} />
                    <div className="text-sm text-gray-500 mt-1">
                      {details.match_details.skillMatches.map(m => `${m.skill} (${Math.round(m.score)}%)`).join(", ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Erfahrung</div>
                    <Progress value={details.match_details.experienceMatch} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Standort</div>
                    <Badge variant={details.match_details.locationMatch ? "default" : "destructive"}>
                      {details.match_details.locationMatch ? "Match" : "Kein Match"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Verfügbarkeit</div>
                    <Badge variant={details.match_details.availabilityMatch ? "default" : "destructive"}>
                      {details.match_details.availabilityMatch ? "Match" : "Kein Match"}
                    </Badge>
                  </div>
                </div>
              </div>

              {details.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => handleUpdateStatus(details.id, "reviewed")}
                  >
                    Als geprüft markieren
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleUpdateStatus(details.id, "rejected")}
                  >
                    Ablehnen
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 