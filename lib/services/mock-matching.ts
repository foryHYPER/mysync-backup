import { CandidateMatch, MatchingService } from "./matching";
import { MockDataService } from "./mock-data";

export class MockMatchingService extends MatchingService {
  private mockData = MockDataService.getInstance();

  constructor() {
    super();
    this.initializeProfile();
  }

  private initializeProfile() {
    if (typeof window === 'undefined') return;

    try {
      const profileStr = localStorage.getItem('profile');
      if (!profileStr) {
        console.warn('Kein Profil im localStorage gefunden');
        return;
      }

      const profile = JSON.parse(profileStr);
      if (!profile.id || !profile.role) {
        console.warn('Profil im localStorage ist unvollständig:', profile);
        return;
      }

      console.log('Initialisiere Mock-Mapping für:', profile);
      this.mockData.initializeUserMapping(profile.id, profile.role);
    } catch (error) {
      console.error('Fehler beim Initialisieren des Profils:', error);
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