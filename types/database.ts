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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      mkt_api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_valid: boolean | null
          keys_encrypted: Json
          last_validated_at: string | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          keys_encrypted: Json
          last_validated_at?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          keys_encrypted?: Json
          last_validated_at?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mkt_generations: {
        Row: {
          actual_cost_usd: number | null
          aspect_ratio: string | null
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          model: string
          operation_name: string | null
          output_metadata: Json | null
          output_url: string | null
          prompt: string
          retry_count: number | null
          sequence_index: number | null
          started_at: string | null
          status: string
          story_id: string | null
          story_role: string | null
          thumbnail_url: string | null
          type: string
        }
        Insert: {
          actual_cost_usd?: number | null
          aspect_ratio?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          model: string
          operation_name?: string | null
          output_metadata?: Json | null
          output_url?: string | null
          prompt: string
          retry_count?: number | null
          sequence_index?: number | null
          started_at?: string | null
          status?: string
          story_id?: string | null
          story_role?: string | null
          thumbnail_url?: string | null
          type: string
        }
        Update: {
          actual_cost_usd?: number | null
          aspect_ratio?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          model?: string
          operation_name?: string | null
          output_metadata?: Json | null
          output_url?: string | null
          prompt?: string
          retry_count?: number | null
          sequence_index?: number | null
          started_at?: string | null
          status?: string
          story_id?: string | null
          story_role?: string | null
          thumbnail_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_generations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "mkt_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      mkt_rate_limits: {
        Row: {
          category: string
          id: string
          last_refill_at: string
          tokens: number
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          last_refill_at?: string
          tokens?: number
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          last_refill_at?: string
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      mkt_stories: {
        Row: {
          aspect_ratio: string
          created_at: string | null
          duration_per_clip_seconds: number
          frame_prompts: Json
          id: string
          model_tier: string
          scene_scripts: Json
          status: string
          stitched_generation_id: string | null
          style_anchor: string | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aspect_ratio: string
          created_at?: string | null
          duration_per_clip_seconds: number
          frame_prompts?: Json
          id?: string
          model_tier: string
          scene_scripts?: Json
          status?: string
          stitched_generation_id?: string | null
          style_anchor?: string | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string | null
          duration_per_clip_seconds?: number
          frame_prompts?: Json
          id?: string
          model_tier?: string
          scene_scripts?: Json
          status?: string
          stitched_generation_id?: string | null
          style_anchor?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mkt_usage_logs: {
        Row: {
          api_service: string
          campaign_id: string | null
          created_at: string | null
          duration_seconds: number | null
          estimated_cost_usd: number | null
          generation_id: string | null
          id: string
          input_tokens: number | null
          model: string
          operation: string
          output_tokens: number | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          api_service: string
          campaign_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          estimated_cost_usd?: number | null
          generation_id?: string | null
          id?: string
          input_tokens?: number | null
          model: string
          operation: string
          output_tokens?: number | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          api_service?: string
          campaign_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          estimated_cost_usd?: number | null
          generation_id?: string | null
          id?: string
          input_tokens?: number | null
          model?: string
          operation?: string
          output_tokens?: number | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_usage_logs_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "mkt_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["mkt_app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["mkt_app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["mkt_app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_roles: {
        Args: never
        Returns: {
          role: string
        }[]
      }
      grant_admin: { Args: { target_user_id: string }; Returns: undefined }
      mkt_check_rate_limit: {
        Args: {
          p_category: string
          p_max_tokens: number
          p_refill_rate: number
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          remaining_tokens: number
          retry_after_seconds: number
        }[]
      }
    }
    Enums: {
      mkt_app_role: "admin" | "user"
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
      mkt_app_role: ["admin", "user"],
    },
  },
} as const

