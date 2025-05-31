export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_text: string
          input_tokens: number
          metadata: Json
          model_id: string
          output_text: string | null
          output_tokens: number
          processing_time_ms: number | null
          project_id: string | null
          prompt_id: string | null
          session_id: string | null
          success: boolean
          total_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_text: string
          input_tokens?: number
          metadata?: Json
          model_id: string
          output_text?: string | null
          output_tokens?: number
          processing_time_ms?: number | null
          project_id?: string | null
          prompt_id?: string | null
          session_id?: string | null
          success?: boolean
          total_cost?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_text?: string
          input_tokens?: number
          metadata?: Json
          model_id?: string
          output_text?: string | null
          output_tokens?: number
          processing_time_ms?: number | null
          project_id?: string | null
          prompt_id?: string | null
          session_id?: string | null
          success?: boolean
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "system_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          code_snippets: Json | null
          content: string
          created_at: string | null
          file_references: Json | null
          id: string
          metadata: Json | null
          processing_time_ms: number | null
          role: string
          session_id: string | null
          suggestions: Json | null
          tokens_used: number | null
        }
        Insert: {
          code_snippets?: Json | null
          content: string
          created_at?: string | null
          file_references?: Json | null
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          role: string
          session_id?: string | null
          suggestions?: Json | null
          tokens_used?: number | null
        }
        Update: {
          code_snippets?: Json | null
          content?: string
          created_at?: string | null
          file_references?: Json | null
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          role?: string
          session_id?: string | null
          suggestions?: Json | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          capabilities: Json
          cost_per_input_token: number
          cost_per_output_token: number
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          max_tokens: number
          model_name: string
          provider: Database["public"]["Enums"]["ai_provider"]
          supports_streaming: boolean
          supports_vision: boolean
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          cost_per_input_token?: number
          cost_per_output_token?: number
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_name: string
          provider: Database["public"]["Enums"]["ai_provider"]
          supports_streaming?: boolean
          supports_vision?: boolean
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          cost_per_input_token?: number
          cost_per_output_token?: number
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_name?: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          supports_streaming?: boolean
          supports_vision?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_provider_configs: {
        Row: {
          api_endpoint: string
          created_at: string
          default_model_id: string | null
          id: string
          is_enabled: boolean
          provider: Database["public"]["Enums"]["ai_provider"]
          rate_limit_requests: number
          rate_limit_window_minutes: number
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          created_at?: string
          default_model_id?: string | null
          id?: string
          is_enabled?: boolean
          provider: Database["public"]["Enums"]["ai_provider"]
          rate_limit_requests?: number
          rate_limit_window_minutes?: number
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          created_at?: string
          default_model_id?: string | null
          id?: string
          is_enabled?: boolean
          provider?: Database["public"]["Enums"]["ai_provider"]
          rate_limit_requests?: number
          rate_limit_window_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_configs_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          context_data: Json | null
          created_at: string | null
          id: string
          model_id: string | null
          project_id: string | null
          session_name: string | null
          status: string | null
          total_cost: number
          total_tokens: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          project_id?: string | null
          session_name?: string | null
          status?: string | null
          total_cost?: number
          total_tokens?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          project_id?: string | null
          session_name?: string | null
          status?: string | null
          total_cost?: number
          total_tokens?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      build_jobs: {
        Row: {
          artifact_url: string | null
          build_command: string
          build_log: string | null
          completed_at: string | null
          created_at: string
          duration: number | null
          id: string
          project_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          artifact_url?: string | null
          build_command?: string
          build_log?: string | null
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          project_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          artifact_url?: string | null
          build_command?: string
          build_log?: string | null
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          project_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_analysis: {
        Row: {
          analysis_type: string
          auto_fixable: boolean | null
          column_number: number | null
          created_at: string | null
          description: string
          file_id: string | null
          id: string
          line_number: number | null
          project_id: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          suggested_fix: string | null
          title: string
        }
        Insert: {
          analysis_type: string
          auto_fixable?: boolean | null
          column_number?: number | null
          created_at?: string | null
          description: string
          file_id?: string | null
          id?: string
          line_number?: number | null
          project_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          suggested_fix?: string | null
          title: string
        }
        Update: {
          analysis_type?: string
          auto_fixable?: boolean | null
          column_number?: number | null
          created_at?: string | null
          description?: string
          file_id?: string | null
          id?: string
          line_number?: number | null
          project_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          suggested_fix?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_analysis_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "code_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_files: {
        Row: {
          content: string
          created_at: string
          file_path: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          file_path: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_path?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          build_command: string
          completed_at: string | null
          created_at: string
          deployment_log: string | null
          duration: number | null
          environment: string
          id: string
          project_id: string
          started_at: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          build_command?: string
          completed_at?: string | null
          created_at?: string
          deployment_log?: string | null
          duration?: number | null
          environment?: string
          id?: string
          project_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          build_command?: string
          completed_at?: string | null
          created_at?: string
          deployment_log?: string | null
          duration?: number | null
          environment?: string
          id?: string
          project_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      environments: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string
          variables: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "environments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_data: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          deployment_url: string | null
          description: string | null
          id: string
          name: string
          repository_url: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          id?: string
          name: string
          repository_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          id?: string
          name?: string
          repository_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          category: Database["public"]["Enums"]["prompt_category"]
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      user_billing: {
        Row: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          current_usage: number
          id: string
          monthly_limit: number
          plan_name: string
          status: Database["public"]["Enums"]["billing_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          current_usage?: number
          id?: string
          monthly_limit?: number
          plan_name?: string
          status?: Database["public"]["Enums"]["billing_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          current_usage?: number
          id?: string
          monthly_limit?: number
          plan_name?: string
          status?: Database["public"]["Enums"]["billing_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string
          id: string
          metadata: Json | null
          project_id: string | null
          rating: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          rating?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          rating?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          github_connected: boolean | null
          github_username: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          github_connected?: boolean | null
          github_username?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          github_connected?: boolean | null
          github_username?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
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
      ai_provider: "openai" | "anthropic" | "google" | "mistral" | "local"
      billing_status: "active" | "suspended" | "trial" | "expired"
      project_status: "active" | "error" | "deploying" | "archived"
      prompt_category:
        | "system"
        | "coding"
        | "analysis"
        | "debugging"
        | "optimization"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_provider: ["openai", "anthropic", "google", "mistral", "local"],
      billing_status: ["active", "suspended", "trial", "expired"],
      project_status: ["active", "error", "deploying", "archived"],
      prompt_category: [
        "system",
        "coding",
        "analysis",
        "debugging",
        "optimization",
      ],
    },
  },
} as const
