import { CandidateMatch, MatchingService } from "./matching";
import { MockDataService } from "./mock-data";

export class MockMatchingService extends MatchingService {
  private mockData = MockDataService.getInstance();

  constructor() {
    super();
  }

  // Public Methode zur Initialisierung des Profils
  public initializeProfile(userId: string) {
    // Wenn noch kein Mapping existiert, erstelle eines
    if (!this.mockData.hasUserMapping(userId)) {
      // Wähle einen zufälligen Mock-Kandidaten
      const mockCandidates = this.mockData.getMockCandidates();
      const randomCandidate = mockCandidates[Math.floor(Math.random() * mockCandidates.length)];
      this.mockData.addUserMapping(userId, randomCandidate.id);
    }
  }

  // Überschreibe die Methoden des MatchingService mit Mock-Implementierungen
  async matchCandidate(candidateId: string): Promise<CandidateMatch[]> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hole alle Matches für den Kandidaten
    return this.mockData.getCandidateMatches(candidateId);
  }

  async matchJobPosting(jobPostingId: string): Promise<CandidateMatch[]> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hole alle Matches für die Stelle
    return this.mockData.getJobPostingMatches(jobPostingId);
  }

  async updateMatchStatus(
    matchId: string,
    status: "pending" | "reviewed" | "contacted" | "rejected"
  ): Promise<CandidateMatch | null> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockData.updateMatchStatus(matchId, status);
  }

  async getCandidateMatches(candidateId: string): Promise<CandidateMatch[]> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockData.getCandidateMatches(candidateId);
  }

  async getJobPostingMatches(jobPostingId: string): Promise<CandidateMatch[]> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockData.getJobPostingMatches(jobPostingId);
  }

  async getCompanyJobPostings(companyId: string): Promise<{ id: string; title: string }[]> {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockData.getJobPostings(companyId).map(job => ({
      id: job.id,
      title: job.title
    }));
  }

  async getCandidate(candidateId: string) {
    // Simuliere eine Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockData.getCandidate(candidateId);
  }
} 