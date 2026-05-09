export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          axis_key: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          partner_id: string
          priority: Database["public"]["Enums"]["action_priority"]
          source: string
          status: Database["public"]["Enums"]["action_status"]
          target_level: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          axis_key: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          partner_id: string
          priority?: Database["public"]["Enums"]["action_priority"]
          source?: string
          status?: Database["public"]["Enums"]["action_status"]
          target_level?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          axis_key?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          partner_id?: string
          priority?: Database["public"]["Enums"]["action_priority"]
          source?: string
          status?: Database["public"]["Enums"]["action_status"]
          target_level?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          assessment_id: string | null
          axis_key: string | null
          content: Json
          created_at: string
          id: string
          model: string | null
          partner_id: string
        }
        Insert: {
          assessment_id?: string | null
          axis_key?: string | null
          content: Json
          created_at?: string
          id?: string
          model?: string | null
          partner_id: string
        }
        Update: {
          assessment_id?: string | null
          axis_key?: string | null
          content?: Json
          created_at?: string
          id?: string
          model?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          id: string
          overall: number
          partner_id: string | null
          scores: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          overall: number
          partner_id?: string | null
          scores: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          overall?: number
          partner_id?: string | null
          scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          axis_key: string
          completed_at: string
          id: string
          lesson_key: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          axis_key: string
          completed_at?: string
          id?: string
          lesson_key: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          axis_key?: string
          completed_at?: string
          id?: string
          lesson_key?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      partner_certification_sessions: {
        Row: {
          completed_at: string
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          session_number: number
          updated_at: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          session_number: number
          updated_at?: string
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          session_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_certification_sessions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_certification_sessions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          created_at: string
          description: string | null
          extracted_text: string | null
          filename: string
          id: string
          kind: string
          mime: string
          partner_id: string
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          filename: string
          id?: string
          kind?: string
          mime: string
          partner_id: string
          size_bytes?: number
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          filename?: string
          id?: string
          kind?: string
          mime?: string
          partner_id?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_intel_runs: {
        Row: {
          created_at: string
          id: string
          input_summary: string | null
          model: string
          output: Json
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_summary?: string | null
          model: string
          output: Json
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_summary?: string | null
          model?: string
          output?: Json
          partner_id?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_lead_activities: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          done_at: string | null
          due_date: string | null
          id: string
          kind: Database["public"]["Enums"]["lead_activity_kind"]
          lead_id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["lead_activity_kind"]
          lead_id: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["lead_activity_kind"]
          lead_id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_role: string | null
          created_at: string
          expertise_score: number | null
          fit_score: number | null
          id: string
          next_step_at: string | null
          notes: string | null
          owner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"] | null
          promoted_partner_id: string | null
          sales_score: number | null
          source: string | null
          status: Database["public"]["Enums"]["partner_lead_status"]
          total_score: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          expertise_score?: number | null
          fit_score?: number | null
          id?: string
          next_step_at?: string | null
          notes?: string | null
          owner_id: string
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          promoted_partner_id?: string | null
          sales_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["partner_lead_status"]
          total_score?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          expertise_score?: number | null
          fit_score?: number | null
          id?: string
          next_step_at?: string | null
          notes?: string | null
          owner_id?: string
          partner_type?: Database["public"]["Enums"]["partner_type"] | null
          promoted_partner_id?: string | null
          sales_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["partner_lead_status"]
          total_score?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_leads_promoted_partner_id_fkey"
            columns: ["promoted_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_metrics: {
        Row: {
          created_at: string
          deals_open: number | null
          deals_open_value: number | null
          deals_won: number | null
          deals_won_value: number | null
          id: string
          mrr: number | null
          notes: string | null
          partner_id: string
          period: string | null
          revenue: number | null
          trained_people: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deals_open?: number | null
          deals_open_value?: number | null
          deals_won?: number | null
          deals_won_value?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          partner_id: string
          period?: string | null
          revenue?: number | null
          trained_people?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          deals_open?: number | null
          deals_open_value?: number | null
          deals_won?: number | null
          deals_won_value?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          partner_id?: string
          period?: string | null
          revenue?: number | null
          trained_people?: number | null
          user_id?: string
        }
        Relationships: []
      }
      partner_stakeholders: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          partner_id: string
          position: string | null
          role: Database["public"]["Enums"]["stakeholder_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          partner_id: string
          position?: string | null
          role?: Database["public"]["Enums"]["stakeholder_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          partner_id?: string
          position?: string | null
          role?: Database["public"]["Enums"]["stakeholder_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          company: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          segment: string | null
          status: Database["public"]["Enums"]["partner_status"]
          tier: Database["public"]["Enums"]["partner_tier"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          partner_type?: Database["public"]["Enums"]["partner_type"]
          segment?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tier?: Database["public"]["Enums"]["partner_tier"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          partner_type?: Database["public"]["Enums"]["partner_type"]
          segment?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tier?: Database["public"]["Enums"]["partner_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"]
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          position: string | null
          total_xp: number
          updated_at: string
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"]
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          position?: string | null
          total_xp?: number
          updated_at?: string
        }
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"]
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          position?: string | null
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      list_pdm_roster: {
        Args: never
        Returns: {
          display_name: string
          id: string
        }[]
      }
    }
    Enums: {
      access_status: "pending" | "approved" | "rejected"
      action_priority: "low" | "medium" | "high"
      action_status: "todo" | "doing" | "done"
      app_role: "pdm" | "leadership" | "admin"
      lead_activity_kind: "task" | "call" | "email" | "meeting" | "note"
      partner_lead_status: "new" | "in_review" | "approved" | "rejected"
      partner_status: "active" | "nurturing" | "at_risk" | "paused" | "archived"
      partner_tier: "strategic" | "core" | "emerging" | "long_tail"
      partner_type: "referral" | "reseller" | "expert"
      stakeholder_role: "ceo" | "it" | "ae" | "marketing" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_status: ["pending", "approved", "rejected"],
      action_priority: ["low", "medium", "high"],
      action_status: ["todo", "doing", "done"],
      app_role: ["pdm", "leadership", "admin"],
      lead_activity_kind: ["task", "call", "email", "meeting", "note"],
      partner_lead_status: ["new", "in_review", "approved", "rejected"],
      partner_status: ["active", "nurturing", "at_risk", "paused", "archived"],
      partner_tier: ["strategic", "core", "emerging", "long_tail"],
      partner_type: ["referral", "reseller", "expert"],
      stakeholder_role: ["ceo", "it", "ae", "marketing", "other"],
    },
  },
} as const
