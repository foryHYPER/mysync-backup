import { CandidateMatch, MatchDetails, SkillMatch } from "./matching";

// Mock-Skills
const mockSkills = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C#", 
  "SQL", "MongoDB", "Docker", "AWS", "Azure", "DevOps", "Agile", "Scrum"
];

// Mock-Kandidaten
export const mockCandidates = [
  {
    id: "candidate-1",
    name: "Max Mustermann",
    email: "max@example.com",
    experience: 5,
    location: "Berlin",
    availability: "Ab sofort",
    status: "active",
    candidate_skills: [
      { skill_id: "skill-1", level: 5, skills: { name: "JavaScript" } },
      { skill_id: "skill-2", level: 4, skills: { name: "React" } },
      { skill_id: "skill-3", level: 3, skills: { name: "Node.js" } },
      { skill_id: "skill-4", level: 2, skills: { name: "Python" } }
    ]
  },
  {
    id: "candidate-2",
    name: "Anna Schmidt",
    email: "anna@example.com",
    experience: 3,
    location: "München",
    availability: "2024-04-01",
    status: "active",
    candidate_skills: [
      { skill_id: "skill-5", level: 4, skills: { name: "Java" } },
      { skill_id: "skill-6", level: 5, skills: { name: "Spring" } },
      { skill_id: "skill-7", level: 3, skills: { name: "SQL" } },
      { skill_id: "skill-8", level: 2, skills: { name: "Docker" } }
    ]
  },
  {
    id: "candidate-3",
    name: "Tom Weber",
    email: "tom@example.com",
    experience: 7,
    location: "Hamburg",
    availability: "Ab sofort",
    status: "active",
    candidate_skills: [
      { skill_id: "skill-9", level: 5, skills: { name: "Python" } },
      { skill_id: "skill-10", level: 4, skills: { name: "AWS" } },
      { skill_id: "skill-11", level: 5, skills: { name: "DevOps" } },
      { skill_id: "skill-12", level: 3, skills: { name: "Docker" } }
    ]
  }
];

// Mock-Stellen
export const mockJobPostings = [
  {
    id: "job-1",
    company_id: "company-1",
    title: "Senior Frontend Developer",
    status: "open",
    requirements: {
      requiredSkills: [
        { name: "JavaScript", level: 4, required: true },
        { name: "React", level: 4, required: true },
        { name: "TypeScript", level: 3, required: true }
      ],
      preferredSkills: [
        { name: "Node.js", level: 2, required: false },
        { name: "AWS", level: 1, required: false }
      ],
      experience: 3,
      location: "Berlin",
      remote: true
    }
  },
  {
    id: "job-2",
    company_id: "company-1",
    title: "Backend Developer Java",
    status: "open",
    requirements: {
      requiredSkills: [
        { name: "Java", level: 4, required: true },
        { name: "Spring", level: 3, required: true },
        { name: "SQL", level: 3, required: true }
      ],
      preferredSkills: [
        { name: "Docker", level: 2, required: false },
        { name: "AWS", level: 2, required: false }
      ],
      experience: 2,
      location: "München",
      remote: false
    }
  },
  {
    id: "job-3",
    company_id: "company-1",
    title: "DevOps Engineer",
    status: "open",
    requirements: {
      requiredSkills: [
        { name: "Python", level: 3, required: true },
        { name: "Docker", level: 4, required: true },
        { name: "AWS", level: 3, required: true }
      ],
      preferredSkills: [
        { name: "Kubernetes", level: 2, required: false },
        { name: "Terraform", level: 2, required: false }
      ],
      experience: 4,
      location: "Hamburg",
      remote: true
    }
  }
];

// Mock-Matches
export const mockMatches: CandidateMatch[] = [
  {
    id: "match-1",
    candidate_id: "candidate-1",
    job_posting_id: "job-1",
    match_score: 85,
    match_details: {
      skillMatches: [
        { skill: "JavaScript", required: true, level: 4, match: true, score: 100 },
        { skill: "React", required: true, level: 4, match: true, score: 100 },
        { skill: "TypeScript", required: true, level: 3, match: true, score: 100 },
        { skill: "Node.js", required: false, level: 2, match: true, score: 50 },
        { skill: "AWS", required: false, level: 1, match: false, score: 0 }
      ],
      experienceMatch: 100,
      locationMatch: true,
      availabilityMatch: true,
      totalScore: 85
    },
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "match-2",
    candidate_id: "candidate-2",
    job_posting_id: "job-2",
    match_score: 90,
    match_details: {
      skillMatches: [
        { skill: "Java", required: true, level: 4, match: true, score: 100 },
        { skill: "Spring", required: true, level: 3, match: true, score: 100 },
        { skill: "SQL", required: true, level: 3, match: true, score: 100 },
        { skill: "Docker", required: false, level: 2, match: true, score: 50 },
        { skill: "AWS", required: false, level: 2, match: false, score: 0 }
      ],
      experienceMatch: 100,
      locationMatch: true,
      availabilityMatch: false,
      totalScore: 90
    },
    status: "reviewed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "match-3",
    candidate_id: "candidate-3",
    job_posting_id: "job-3",
    match_score: 95,
    match_details: {
      skillMatches: [
        { skill: "Python", required: true, level: 3, match: true, score: 100 },
        { skill: "Docker", required: true, level: 4, match: true, score: 100 },
        { skill: "AWS", required: true, level: 3, match: true, score: 100 },
        { skill: "Kubernetes", required: false, level: 2, match: false, score: 0 },
        { skill: "Terraform", required: false, level: 2, match: false, score: 0 }
      ],
      experienceMatch: 100,
      locationMatch: true,
      availabilityMatch: true,
      totalScore: 95
    },
    status: "contacted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock-Service für Testdaten
export class MockDataService {
  private static instance: MockDataService;
  private candidates = mockCandidates;
  private jobPostings = mockJobPostings;
  private matches = mockMatches;
  private userMappings = new Map<string, string>(); // Maps real user IDs to mock IDs

  private constructor() {}

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Benutzer-Mapping Methoden
  public hasUserMapping(userId: string): boolean {
    return this.userMappings.has(userId);
  }

  public getMockCandidates() {
    return this.candidates;
  }

  public addUserMapping(userId: string, mockCandidateId: string) {
    this.userMappings.set(userId, mockCandidateId);
  }

  // Initialisiere Mapping für einen Benutzer
  initializeUserMapping(userId: string, role: string) {
    if (this.userMappings.has(userId)) return;

    if (role === "candidate") {
      // Wähle einen zufälligen Kandidaten für diesen Benutzer
      const randomCandidate = this.candidates[Math.floor(Math.random() * this.candidates.length)];
      this.userMappings.set(userId, randomCandidate.id);
    } else if (role === "client" || role === "company") {
      // Alle Stellen gehören zum Unternehmen des Benutzers
      this.userMappings.set(userId, "company-1");
    }
  }

  // Kandidaten-Methoden
  getCandidate(id: string) {
    const mockId = this.userMappings.get(id) || id;
    return this.candidates.find(c => c.id === mockId);
  }

  getCandidates() {
    return this.candidates;
  }

  // Stellen-Methoden
  getJobPosting(id: string) {
    return this.jobPostings.find(j => j.id === id);
  }

  getJobPostings(companyId: string) {
    // Wenn es eine echte Benutzer-ID ist, verwende die Mock-Unternehmens-ID
    const mockCompanyId = this.userMappings.get(companyId) || companyId;
    return this.jobPostings.filter(j => j.company_id === mockCompanyId);
  }

  // Match-Methoden
  getCandidateMatches(candidateId: string) {
    // Wenn es eine echte Benutzer-ID ist, verwende die Mock-Kandidaten-ID
    const mockCandidateId = this.userMappings.get(candidateId) || candidateId;
    return this.matches.filter(m => m.candidate_id === mockCandidateId);
  }

  getJobPostingMatches(jobPostingId: string) {
    return this.matches.filter(m => m.job_posting_id === jobPostingId);
  }

  updateMatchStatus(matchId: string, status: "pending" | "reviewed" | "contacted" | "rejected") {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      match.status = status;
      match.updated_at = new Date().toISOString();
      return match;
    }
    return null;
  }
} 