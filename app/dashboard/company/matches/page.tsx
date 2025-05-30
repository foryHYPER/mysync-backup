"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useProfile } from "@/context/ProfileContext";
import { MatchingService } from "@/lib/services/matching";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchList from "@/components/matching/MatchList";

export default function CompanyMatchesPage() {
  const profile = useProfile();
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobPostings, setJobPostings] = useState<{ id: string; title: string }[]>([]);
  const matchingService = useMemo(() => new MatchingService(), []);

  const loadJobPostings = useCallback(async () => {
    if (!profile.id) return;

    try {
      const jobs = await matchingService.getCompanyJobPostings(profile.id);
      if (jobs.length > 0) {
        setJobPostings(jobs);
        setSelectedJobId(jobs[0].id);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Stellen:", error);
      toast.error("Fehler beim Laden der Stellen");
    }
  }, [profile.id, matchingService]);

  useEffect(() => {
    loadJobPostings();
  }, [loadJobPostings]);

  const handleRefreshMatches = async () => {
    if (!selectedJobId) return;
    
    setLoading(true);
    try {
      await matchingService.matchJobPosting(selectedJobId);
      toast.success("Matches wurden aktualisiert");
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Matches:", error);
      toast.error("Fehler beim Aktualisieren der Matches");
    }
    setLoading(false);
  };

  if (!profile.id) {
    return <div>Lade Profil...</div>;
  }

  if (jobPostings.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <Toaster />
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Keine offenen Stellen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Sie müssen zuerst eine offene Stelle erstellen, um Matches zu sehen.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>Kandidaten-Matches</CardTitle>
                  <Select
                    value={selectedJobId || ""}
                    onValueChange={setSelectedJobId}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Stelle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleRefreshMatches} 
                  disabled={loading || !selectedJobId}
                >
                  {loading ? "Aktualisiere..." : "Matches aktualisieren"}
                </Button>
              </CardHeader>
              <CardContent>
                {selectedJobId && (
                  <MatchList 
                    type="job" 
                    id={selectedJobId}
                    onStatusChange={(matchId: string, status: string) => {
                      toast.success(`Status wurde auf "${status}" aktualisiert`);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 