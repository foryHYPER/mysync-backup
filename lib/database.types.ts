export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      job_postings: {
        Row: {
          id: string
          title: string
          location: string | null
          status: string
          created_at: string
          company_id: string
          description: string | null
          requirements: string | null
          salary_range: string | null
          employment_type: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          location?: string | null
          status: string
          created_at?: string
          company_id: string
          description?: string | null
          requirements?: string | null
          salary_range?: string | null
          employment_type?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          location?: string | null
          status?: string
          created_at?: string
          company_id?: string
          description?: string | null
          requirements?: string | null
          salary_range?: string | null
          employment_type?: string | null
          updated_at?: string | null
        }
      }
      candidate_matches: {
        Row: {
          id: string
          candidate_id: string
          job_posting_id: string
          status: string
          match_score: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          job_posting_id: string
          status: string
          match_score: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          job_posting_id?: string
          status?: string
          match_score?: number
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 