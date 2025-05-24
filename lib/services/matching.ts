import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

// Typen für das Matching-System
export type SkillMatch = {
  skill: string;
  required: boolean;
  level: number; // 1-5
  match: boolean;
  score: number;
};

export type MatchDetails = {
  skillMatches: SkillMatch[];
  experienceMatch: number; // 0-100
  locationMatch: boolean;
  availabilityMatch: boolean;
  totalScore: number; // 0-100
};

export type CandidateMatch = {
  id: string;
  candidate_id: string;
  job_posting_id: string;
  match_score: number;
  match_details: MatchDetails;
  status: "pending" | "reviewed" | "contacted" | "rejected";
  created_at: string;
  updated_at: string;
};

// Schema für Job-Anforderungen
const jobRequirementsSchema = z.object({
  requiredSkills: z.array(z.object({
    name: z.string(),
    level: z.number().min(1).max(5),
    required: z.boolean()
  })),
  preferredSkills: z.array(z.object({
    name: z.string(),
    level: z.number().min(1).max(5),
    required: z.boolean()
  })),
  experience: z.number().min(0),
  location: z.string().optional(),
  remote: z.boolean().optional()
});

// Matching-Service
export class MatchingService {
  private supabase = createClient();

  // Berechnet den Match-Score zwischen einem Kandidaten und einer Stelle
  private async calculateMatchScore(
    candidateId: string,
    jobPostingId: string
  ): Promise<{ score: number; details: MatchDetails }> {
    // Hole Kandidaten- und Job-Daten
    const { data: candidate } = await this.supabase
      .from("candidates")
      .select("*, candidate_skills(skill_id, level, skills(name))")
      .eq("id", candidateId)
      .single();

    const { data: jobPosting } = await this.supabase
      .from("job_postings")
      .select("*")
      .eq("id", jobPostingId)
      .single();

    if (!candidate || !jobPosting) {
      throw new Error("Kandidat oder Stelle nicht gefunden");
    }

    // Parse Job-Anforderungen
    const requirements = jobRequirementsSchema.parse(jobPosting.requirements);
    
    // Berechne Skill-Matches
    const skillMatches: SkillMatch[] = [];
    let totalSkillScore = 0;
    let requiredSkillsCount = 0;
    let matchedRequiredSkills = 0;

    // Verarbeite erforderliche Skills
    for (const reqSkill of requirements.requiredSkills) {
      const candidateSkill = candidate.candidate_skills?.find(
        (cs: any) => cs.skills.name.toLowerCase() === reqSkill.name.toLowerCase()
      );

      const match = candidateSkill && candidateSkill.level >= reqSkill.level;
      const score = match ? (candidateSkill.level / reqSkill.level) * 100 : 0;

      skillMatches.push({
        skill: reqSkill.name,
        required: true,
        level: reqSkill.level,
        match,
        score
      });

      if (reqSkill.required) {
        requiredSkillsCount++;
        if (match) matchedRequiredSkills++;
      }
      totalSkillScore += score;
    }

    // Verarbeite bevorzugte Skills
    for (const prefSkill of requirements.preferredSkills) {
      const candidateSkill = candidate.candidate_skills?.find(
        (cs: any) => cs.skills.name.toLowerCase() === prefSkill.name.toLowerCase()
      );

      const match = candidateSkill && candidateSkill.level >= prefSkill.level;
      const score = match ? (candidateSkill.level / prefSkill.level) * 50 : 0; // Bevorzugte Skills zählen weniger

      skillMatches.push({
        skill: prefSkill.name,
        required: false,
        level: prefSkill.level,
        match,
        score
      });

      totalSkillScore += score;
    }

    // Berechne Erfahrungs-Match
    const experienceMatch = Math.min(
      (candidate.experience || 0) / requirements.experience * 100,
      100
    );

    // Berechne Location-Match
    const locationMatch = !requirements.location || 
      (candidate.location && candidate.location.toLowerCase() === requirements.location.toLowerCase());

    // Berechne Availability-Match
    const availabilityMatch = candidate.availability === "Ab sofort" || 
      (candidate.availability && new Date(candidate.availability) <= new Date());

    // Berechne Gesamt-Score
    const totalScore = Math.min(
      (totalSkillScore / (requirements.requiredSkills.length + requirements.preferredSkills.length)) * 0.6 + // 60% Skills
      experienceMatch * 0.2 + // 20% Erfahrung
      (locationMatch ? 100 : 0) * 0.1 + // 10% Location
      (availabilityMatch ? 100 : 0) * 0.1, // 10% Verfügbarkeit
      100
    );

    return {
      score: totalScore,
      details: {
        skillMatches,
        experienceMatch,
        locationMatch,
        availabilityMatch,
        totalScore
      }
    };
  }

  // Führt das Matching für einen Kandidaten durch
  async matchCandidate(candidateId: string): Promise<CandidateMatch[]> {
    // Hole alle aktiven Stellen
    const { data: jobPostings } = await this.supabase
      .from("job_postings")
      .select("id")
      .eq("status", "open");

    if (!jobPostings) return [];

    const matches: CandidateMatch[] = [];

    // Berechne Matches für jede Stelle
    for (const job of jobPostings) {
      try {
        const { score, details } = await this.calculateMatchScore(candidateId, job.id);

        // Speichere Match in der Datenbank
        const { data: match } = await this.supabase
          .from("candidate_matches")
          .upsert({
            candidate_id: candidateId,
            job_posting_id: job.id,
            match_score: score,
            match_details: details,
            status: "pending"
          })
          .select()
          .single();

        if (match) matches.push(match);
      } catch (error) {
        console.error(`Fehler beim Matching für Stelle ${job.id}:`, error);
      }
    }

    return matches;
  }

  // Führt das Matching für eine Stelle durch
  async matchJobPosting(jobPostingId: string): Promise<CandidateMatch[]> {
    // Hole alle aktiven Kandidaten
    const { data: candidates } = await this.supabase
      .from("candidates")
      .select("id")
      .eq("status", "active");

    if (!candidates) return [];

    const matches: CandidateMatch[] = [];

    // Berechne Matches für jeden Kandidaten
    for (const candidate of candidates) {
      try {
        const { score, details } = await this.calculateMatchScore(candidate.id, jobPostingId);

        // Speichere Match in der Datenbank
        const { data: match } = await this.supabase
          .from("candidate_matches")
          .upsert({
            candidate_id: candidate.id,
            job_posting_id: jobPostingId,
            match_score: score,
            match_details: details,
            status: "pending"
          })
          .select()
          .single();

        if (match) matches.push(match);
      } catch (error) {
        console.error(`Fehler beim Matching für Kandidat ${candidate.id}:`, error);
      }
    }

    return matches;
  }

  // Aktualisiert den Status eines Matches
  async updateMatchStatus(
    matchId: string,
    status: "pending" | "reviewed" | "contacted" | "rejected"
  ): Promise<CandidateMatch | null> {
    const { data: match } = await this.supabase
      .from("candidate_matches")
      .update({ status })
      .eq("id", matchId)
      .select()
      .single();

    return match;
  }

  // Holt alle Matches für einen Kandidaten
  async getCandidateMatches(candidateId: string): Promise<CandidateMatch[]> {
    const { data: matches } = await this.supabase
      .from("candidate_matches")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("match_score", { ascending: false });

    return matches || [];
  }

  // Holt alle Matches für eine Stelle
  async getJobPostingMatches(jobPostingId: string): Promise<CandidateMatch[]> {
    const { data: matches } = await this.supabase
      .from("candidate_matches")
      .select("*")
      .eq("job_posting_id", jobPostingId)
      .order("match_score", { ascending: false });

    return matches || [];
  }

  // Holt alle offenen Stellen eines Unternehmens
  async getCompanyJobPostings(companyId: string): Promise<{ id: string; title: string }[]> {
    const { data } = await this.supabase
      .from("job_postings")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("status", "open");

    return data || [];
  }

  // Holt Kandidaten-Informationen
  async getCandidate(candidateId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from("candidates")
      .select(`
        *,
        candidate_skills(
          skill_id,
          level,
          skills(name)
        )
      `)
      .eq("id", candidateId)
      .single();

    if (error || !data) return null;
    
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      experience: data.experience || 0,
      skills: data.candidate_skills?.map((cs: any) => cs.skills.name) || [],
      location: data.location || "",
      availability: data.availability || ""
    };
  }
} 