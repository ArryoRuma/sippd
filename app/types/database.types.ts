export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
  public: {
    Tables: {
      funnel_events: {
        Row: {
          id: string
          user_id: string | null
          event_name: string
          source: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_name: string
          source?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_name?: string
          source?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          favorite_method: string | null
          onboarding_completed: boolean
          onboarding_step: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          favorite_method?: string | null
          onboarding_completed?: boolean
          onboarding_step?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          favorite_method?: string | null
          onboarding_completed?: boolean
          onboarding_step?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sipps: {
        Row: {
          id: string
          user_id: string
          roaster: string
          roast_type: string
          origin: string
          method: string
          aroma: number
          flavor: number
          acidity: number
          body: number
          aftertaste: number
          overall: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          roaster: string
          roast_type: string
          origin: string
          method: string
          aroma: number
          flavor: number
          acidity: number
          body: number
          aftertaste: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          roaster?: string
          roast_type?: string
          origin?: string
          method?: string
          aroma?: number
          flavor?: number
          acidity?: number
          body?: number
          aftertaste?: number
          created_at?: string
        }
        Relationships: []
      }
      wanna_sipps: {
        Row: {
          id: string
          user_id: string
          roaster: string
          roast_type: string | null
          origin: string | null
          method: string | null
          notes: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          roaster: string
          roast_type?: string | null
          origin?: string | null
          method?: string | null
          notes?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          roaster?: string
          roast_type?: string | null
          origin?: string | null
          method?: string | null
          notes?: string | null
          completed?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dashboard_activity: {
        Args: {
          p_days?: number | null
        }
        Returns: {
          day_date: string
          count: number
          average_score: number
        }[]
      }
      dashboard_method_mix: {
        Args: {
          p_limit?: number | null
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          method: string
          count: number
          average_score: number
          share: number
        }[]
      }
      dashboard_summary: {
        Args: {
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          total: number
          average_score: number
          completed_this_week: number
          recent_average: number
          previous_average: number
          top_roaster: string | null
          top_overall: number | null
          top_method: string | null
          recent_roaster: string | null
          recent_created_at: string | null
        }[]
      }
      dashboard_taste_profile: {
        Args: {
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          aroma: number
          flavor: number
          acidity: number
          body: number
          aftertaste: number
        }[]
      }
      dashboard_top_origins: {
        Args: {
          p_limit?: number | null
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          origin: string
          count: number
          average_score: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
