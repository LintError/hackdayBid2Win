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
      events: {
        Row: {
          id: string
          slug: string
          name: string
          timezone: string
          join_code_hash: string
          status: 'draft' | 'registration_open' | 'live' | 'paused' | 'ended' | 'finalized'
          starts_at: string | null
          ends_at: string | null
          rules: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          timezone: string
          join_code_hash: string
          status?: 'draft' | 'registration_open' | 'live' | 'paused' | 'ended' | 'finalized'
          starts_at?: string | null
          ends_at?: string | null
          rules?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          timezone?: string
          join_code_hash?: string
          status?: 'draft' | 'registration_open' | 'live' | 'paused' | 'ended' | 'finalized'
          starts_at?: string | null
          ends_at?: string | null
          rules?: Json
          settings?: Json
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string
          role: 'admin' | 'judge' | 'participant'
          is_active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          role?: 'admin' | 'judge' | 'participant'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          display_name?: string
          role?: 'admin' | 'judge' | 'participant'
          is_active?: boolean
        }
      }
      participants: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          display_name: string
          status: 'active' | 'disqualified' | 'withdrawn'
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          display_name: string
          status?: 'active' | 'disqualified' | 'withdrawn'
          joined_at?: string
        }
        Update: {
          display_name?: string
          status?: 'active' | 'disqualified' | 'withdrawn'
        }
      }
      rounds: {
        Row: {
          id: string
          event_id: string
          type: 'quiz' | 'bug_hunt'
          title: string
          status: 'draft' | 'scheduled' | 'live' | 'paused' | 'ended' | 'finalized'
          sequence: number
          starts_at: string | null
          deadline_at: string | null
          paused_at: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          type: 'quiz' | 'bug_hunt'
          title: string
          status?: 'draft' | 'scheduled' | 'live' | 'paused' | 'ended' | 'finalized'
          sequence: number
          starts_at?: string | null
          deadline_at?: string | null
          settings?: Json
        }
        Update: {
          title?: string
          status?: 'draft' | 'scheduled' | 'live' | 'paused' | 'ended' | 'finalized'
          sequence?: number
          starts_at?: string | null
          deadline_at?: string | null
          paused_at?: string | null
          settings?: Json
        }
      }
      quiz_questions: {
        Row: {
          id: string
          round_id: string
          prompt: string
          question_type: 'single_select'
          points: number
          duration_seconds: number
          sequence: number
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          prompt: string
          question_type?: 'single_select'
          points?: number
          duration_seconds?: number
          sequence: number
        }
        Update: {
          prompt?: string
          question_type?: 'single_select'
          points?: number
          duration_seconds?: number
          sequence?: number
          published_at?: string | null
        }
      }
      quiz_options: {
        Row: {
          id: string
          question_id: string
          label: string
          sequence: number
          is_correct: boolean
        }
        Insert: {
          id?: string
          question_id: string
          label: string
          sequence: number
          is_correct: boolean
        }
        Update: {
          label?: string
          sequence?: number
          is_correct?: boolean
        }
      }
      quiz_answers: {
        Row: {
          id: string
          question_id: string
          participant_id: string
          option_id: string
          received_at: string
          accepted: boolean
          points_awarded: number
          idempotency_key: string
        }
        Insert: {
          id?: string
          question_id: string
          participant_id: string
          option_id: string
          accepted?: boolean
          points_awarded?: number
          idempotency_key: string
        }
        Update: {
          accepted?: boolean
          points_awarded?: number
        }
      }
      bug_challenges: {
        Row: {
          id: string
          round_id: string
          title: string
          prompt: string
          language: string
          starter_code: string
          submission_type: 'patch' | 'explanation' | 'both'
          deadline_at: string | null
          rubric: Json
          judge_notes: string | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          title: string
          prompt: string
          language: string
          starter_code: string
          submission_type: 'patch' | 'explanation' | 'both'
          deadline_at?: string | null
          rubric?: Json
          judge_notes?: string | null
        }
        Update: {
          title?: string
          prompt?: string
          language?: string
          starter_code?: string
          submission_type?: 'patch' | 'explanation' | 'both'
          deadline_at?: string | null
          rubric?: Json
          judge_notes?: string | null
          published_at?: string | null
        }
      }
      bug_submissions: {
        Row: {
          id: string
          challenge_id: string
          participant_id: string
          submission_text: string
          explanation: string
          received_at: string
          status: 'submitted' | 'under_review' | 'scored' | 'disqualified'
          content_hash: string
        }
        Insert: {
          id?: string
          challenge_id: string
          participant_id: string
          submission_text: string
          explanation: string
        }
        Update: {
          status?: 'submitted' | 'under_review' | 'scored' | 'disqualified'
        }
      }
      judge_assignments: {
        Row: {
          id: string
          challenge_id: string
          judge_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          judge_user_id: string
        }
        Update: {}
      }
      judgements: {
        Row: {
          id: string
          submission_id: string
          judge_user_id: string
          rubric_scores: Json
          total_score: number
          rationale: string
          status: 'provisional' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          judge_user_id: string
          rubric_scores: Json
          total_score: number
          rationale: string
          status?: 'provisional' | 'approved' | 'rejected'
        }
        Update: {
          total_score?: number
          rationale?: string
          status?: 'provisional' | 'approved' | 'rejected'
        }
      }
      score_ledger: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          source_type: string
          source_id: string
          points_delta: number
          reason: string
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          source_type: string
          source_id: string
          points_delta: number
          reason: string
          actor_id?: string | null
        }
        Update: {}
      }
      prizes: {
        Row: {
          id: string
          event_id: string
          name: string
          category: string
          inventory_count: number
          rules: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          category: string
          inventory_count: number
          rules?: Json
        }
        Update: {
          inventory_count?: number
          rules?: Json
        }
      }
      prize_awards: {
        Row: {
          id: string
          prize_id: string
          participant_id: string
          approved_by: string
          status: 'reserved' | 'awarded' | 'handed_over' | 'cancelled'
          awarded_at: string | null
          handed_over_at: string | null
          notes_private: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prize_id: string
          participant_id: string
          approved_by: string
          status?: 'reserved' | 'awarded' | 'handed_over' | 'cancelled'
          notes_private?: string | null
        }
        Update: {
          status?: 'reserved' | 'awarded' | 'handed_over' | 'cancelled'
          awarded_at?: string | null
          handed_over_at?: string | null
          notes_private?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          event_id: string | null
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          before_json: Json | null
          after_json: Json | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          before_json?: Json | null
          after_json?: Json | null
          reason?: string | null
        }
        Update: {}
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: 'admin' | 'judge' | 'participant'
      event_status: 'draft' | 'registration_open' | 'live' | 'paused' | 'ended' | 'finalized'
      round_status: 'draft' | 'scheduled' | 'live' | 'paused' | 'ended' | 'finalized'
      round_type: 'quiz' | 'bug_hunt'
      participant_status: 'active' | 'disqualified' | 'withdrawn'
      question_type: 'single_select'
      submission_type: 'patch' | 'explanation' | 'both'
      submission_status: 'submitted' | 'under_review' | 'scored' | 'disqualified'
      judgement_status: 'provisional' | 'approved' | 'rejected'
      prize_status: 'reserved' | 'awarded' | 'handed_over' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']
export type Round = Database['public']['Tables']['rounds']['Row']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type BugChallenge = Database['public']['Tables']['bug_challenges']['Row']
export type BugSubmission = Database['public']['Tables']['bug_submissions']['Row']
export type Judgement = Database['public']['Tables']['judgements']['Row']
export type ScoreLedgerEntry = Database['public']['Tables']['score_ledger']['Row']
export type Prize = Database['public']['Tables']['prizes']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']