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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exams: {
        Row: {
          created_at: string
          default_time_limit: number | null
          default_word_limit_english: number | null
          default_word_limit_hindi: number | null
          description: string | null
          display_name: string
          enable_font_size_control: boolean | null
          enable_sound: boolean | null
          enable_word_limit: boolean | null
          id: string
          interface_theme: string | null
          is_active: boolean | null
          is_featured: boolean | null
          min_accuracy: number | null
          min_speed_english: number | null
          min_speed_hindi: number | null
          min_time_required: number | null
          min_words_required: number | null
          name: string
          short_name: string
          show_accuracy_formula: boolean | null
          show_backspace_count: boolean | null
          show_comparison_paragraph: boolean | null
          show_error_rules: boolean | null
          show_extra_words: boolean | null
          show_gross_net_speed: boolean | null
          show_keystroke_speed: boolean | null
          show_qualification_status: boolean | null
          show_skipped_words: boolean | null
          slug: string
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string
          use_keystroke_speed: boolean | null
        }
        Insert: {
          created_at?: string
          default_time_limit?: number | null
          default_word_limit_english?: number | null
          default_word_limit_hindi?: number | null
          description?: string | null
          display_name: string
          enable_font_size_control?: boolean | null
          enable_sound?: boolean | null
          enable_word_limit?: boolean | null
          id?: string
          interface_theme?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          min_accuracy?: number | null
          min_speed_english?: number | null
          min_speed_hindi?: number | null
          min_time_required?: number | null
          min_words_required?: number | null
          name: string
          short_name: string
          show_accuracy_formula?: boolean | null
          show_backspace_count?: boolean | null
          show_comparison_paragraph?: boolean | null
          show_error_rules?: boolean | null
          show_extra_words?: boolean | null
          show_gross_net_speed?: boolean | null
          show_keystroke_speed?: boolean | null
          show_qualification_status?: boolean | null
          show_skipped_words?: boolean | null
          slug: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          use_keystroke_speed?: boolean | null
        }
        Update: {
          created_at?: string
          default_time_limit?: number | null
          default_word_limit_english?: number | null
          default_word_limit_hindi?: number | null
          description?: string | null
          display_name?: string
          enable_font_size_control?: boolean | null
          enable_sound?: boolean | null
          enable_word_limit?: boolean | null
          id?: string
          interface_theme?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          min_accuracy?: number | null
          min_speed_english?: number | null
          min_speed_hindi?: number | null
          min_time_required?: number | null
          min_words_required?: number | null
          name?: string
          short_name?: string
          show_accuracy_formula?: boolean | null
          show_backspace_count?: boolean | null
          show_comparison_paragraph?: boolean | null
          show_error_rules?: boolean | null
          show_extra_words?: boolean | null
          show_gross_net_speed?: boolean | null
          show_keystroke_speed?: boolean | null
          show_qualification_status?: boolean | null
          show_skipped_words?: boolean | null
          slug?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          use_keystroke_speed?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_notices: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_enabled: boolean
          link_text: string | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          link_text?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          link_text?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          accuracy: number
          backspace_count: number | null
          completed_at: string | null
          correct_keystrokes: number
          correct_words_count: number
          created_at: string | null
          errors: number | null
          exam_type: string | null
          extra_words: number | null
          gross_speed: number | null
          gross_wpm: number | null
          id: string
          incorrect_words: number
          is_qualified: boolean | null
          net_speed: number | null
          skipped_words: number | null
          test_id: string
          time_taken: number
          total_keystrokes: number | null
          total_words: number | null
          typed_text: string | null
          typed_words: number | null
          user_id: string
          wpm: number
          wrong_keystrokes: number
        }
        Insert: {
          accuracy: number
          backspace_count?: number | null
          completed_at?: string | null
          correct_keystrokes?: number
          correct_words_count?: number
          created_at?: string | null
          errors?: number | null
          exam_type?: string | null
          extra_words?: number | null
          gross_speed?: number | null
          gross_wpm?: number | null
          id?: string
          incorrect_words?: number
          is_qualified?: boolean | null
          net_speed?: number | null
          skipped_words?: number | null
          test_id: string
          time_taken: number
          total_keystrokes?: number | null
          total_words?: number | null
          typed_text?: string | null
          typed_words?: number | null
          user_id: string
          wpm: number
          wrong_keystrokes?: number
        }
        Update: {
          accuracy?: number
          backspace_count?: number | null
          completed_at?: string | null
          correct_keystrokes?: number
          correct_words_count?: number
          created_at?: string | null
          errors?: number | null
          exam_type?: string | null
          extra_words?: number | null
          gross_speed?: number | null
          gross_wpm?: number | null
          id?: string
          incorrect_words?: number
          is_qualified?: boolean | null
          net_speed?: number | null
          skipped_words?: number | null
          test_id?: string
          time_taken?: number
          total_keystrokes?: number | null
          total_words?: number | null
          typed_text?: string | null
          typed_words?: number | null
          user_id?: string
          wpm?: number
          wrong_keystrokes?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "typing_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_tests: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          difficulty: string
          id: string
          is_active: boolean | null
          language: string
          time_limit: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean | null
          language?: string
          time_limit?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean | null
          language?: string
          time_limit?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_leaderboard: {
        Args: { p_test_id: string }
        Returns: {
          accuracy: number
          display_name: string
          result_id: string
          time_taken: number
          total_words: number
          user_id: string
          wpm: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
