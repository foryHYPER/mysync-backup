"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CandidateMatch, MatchDetails } from "@/lib/services/matching";
import { MockMatchingService } from "@/lib/services/mock-matching";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Eye } from "lucide-react";

type MatchListProps = {
  type: "candidate" | "job";
  id: string;
  onStatusChange?: (matchId: string, status: string) => void;
};

export default function MatchList({ type, id, onStatusChange }: MatchListProps) {
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [candidates, setCandidates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const matchingService = new MockMatchingService();

  useEffect(() => {
    loadMatches();
  }, [id]);

  const loadMatches = async () => {
    if (!id) {
      setError("Keine ID angegeben");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Lade Matches für:", { type, id });
      const matches = type === "candidate"
        ? await matchingService.getCandidateMatches(id)
        : await matchingService.getJobPostingMatches(id);
      
      console.log("Geladene Matches:", matches);
      setMatches(matches);

      // Lade Kandidaten-Informationen für alle Matches
      if (type === "job") {
        const candidatePromises = matches.map(match => 
          matchingService.getCandidate(match.candidate_id)
        );
        const candidateResults = await Promise.all(candidatePromises);
        const candidateMap = candidateResults.reduce((acc, candidate, index) => {
          if (candidate) {
            acc[matches[index].candidate_id] = candidate;
          }
          return acc;
        }, {} as Record<string, any>);
        setCandidates(candidateMap);
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
      if (onStatusChange) {
        onStatusChange(matchId, status);
      }
      loadMatches(); // Aktualisiere die Liste
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status:", error);
    }
  };

  const getCandidateInfo = (match: CandidateMatch) => {
    const candidate = candidates[match.candidate_id];
    if (!candidate) return "Lade Kandidat...";
    return `${candidate.name} (${candidate.experience} Jahre Erfahrung)`;
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

  const renderMatchDetails = (details: MatchDetails) => (
    <div className="space-y-2 min-w-[200px]">
      <div className="grid grid-cols-2 gap-2 items-center">
        <span className="text-sm font-medium">Skills</span>
        <div className="flex items-center gap-2">
          <Progress value={details.skillMatches.reduce((acc, m) => acc + m.score, 0) / details.skillMatches.length} className="w-[100px]" />
          <span className="text-sm text-muted-foreground">
            {Math.round(details.skillMatches.reduce((acc, m) => acc + m.score, 0) / details.skillMatches.length)}%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 items-center">
        <span className="text-sm font-medium">Erfahrung</span>
        <div className="flex items-center gap-2">
          <Progress value={details.experienceMatch} className="w-[100px]" />
          <span className="text-sm text-muted-foreground">
            {Math.round(details.experienceMatch)}%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 items-center">
        <span className="text-sm font-medium">Location</span>
        <Badge variant={details.locationMatch ? "default" : "destructive"} className="w-fit">
          {details.locationMatch ? "Match" : "Kein Match"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 items-center">
        <span className="text-sm font-medium">Verfügbarkeit</span>
        <Badge variant={details.availabilityMatch ? "default" : "destructive"} className="w-fit">
          {details.availabilityMatch ? "Match" : "Kein Match"}
        </Badge>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-2">Lade Matches...</div>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-500">
          <div className="mb-2">{error}</div>
          <Button variant="outline" onClick={loadMatches} className="mt-2">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          Keine Matches gefunden
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Kandidat</TableHead>
            <TableHead className="w-[150px]">Match Score</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="font-medium">
                {type === "job" ? getCandidateInfo(match) : "Stelle"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={match.match_score} className="w-[100px]" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {Math.round(match.match_score)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {renderMatchDetails(match.match_details)}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(match.status)} whitespace-nowrap`}>
                  {getStatusText(match.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Menü öffnen</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(match.id, "reviewed")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Als geprüft markieren
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(match.id, "contacted")}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Als kontaktiert markieren
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(match.id, "rejected")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Ablehnen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 