export type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  profile_photo_url?: string;
  skills?: Array<{ id: string; name: string }>;
  created_at?: string;
  updated_at?: string;
};

export type CandidateFormValues = Omit<Candidate, 'id' | 'created_at' | 'updated_at'>; 