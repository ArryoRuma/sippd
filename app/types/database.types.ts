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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
