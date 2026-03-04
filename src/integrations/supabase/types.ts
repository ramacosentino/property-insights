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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      geocoded_addresses: {
        Row: {
          address: string
          geocoded_at: string | null
          id: string
          lat: number | null
          lng: number | null
          neighborhood: string | null
          norm_locality: string | null
          norm_neighborhood: string | null
          norm_province: string | null
          province: string | null
          raw_address_details: Json | null
          source: string | null
        }
        Insert: {
          address: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          norm_locality?: string | null
          norm_neighborhood?: string | null
          norm_province?: string | null
          province?: string | null
          raw_address_details?: Json | null
          source?: string | null
        }
        Update: {
          address?: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          norm_locality?: string | null
          norm_neighborhood?: string | null
          norm_province?: string | null
          province?: string | null
          raw_address_details?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      ignored_opportunities: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_neighborhood_stats: {
        Row: {
          avg_days_on_market: number | null
          avg_price_m2_covered: number | null
          avg_price_m2_total: number | null
          avg_price_total: number | null
          city: string | null
          created_at: string
          id: string
          max_price_m2_total: number | null
          median_expenses: number | null
          median_price_m2_covered: number | null
          median_price_m2_total: number | null
          median_price_total: number | null
          median_surface_covered: number | null
          median_surface_total: number | null
          min_price_m2_total: number | null
          neighborhood: string
          new_listings_count: number | null
          percentile_25_m2_covered: number | null
          percentile_25_m2_total: number | null
          percentile_75_m2_covered: number | null
          percentile_75_m2_total: number | null
          property_count: number
          property_type: string | null
          removed_count: number | null
          stddev_m2_covered: number | null
          stddev_m2_total: number | null
          year_month: string
        }
        Insert: {
          avg_days_on_market?: number | null
          avg_price_m2_covered?: number | null
          avg_price_m2_total?: number | null
          avg_price_total?: number | null
          city?: string | null
          created_at?: string
          id?: string
          max_price_m2_total?: number | null
          median_expenses?: number | null
          median_price_m2_covered?: number | null
          median_price_m2_total?: number | null
          median_price_total?: number | null
          median_surface_covered?: number | null
          median_surface_total?: number | null
          min_price_m2_total?: number | null
          neighborhood: string
          new_listings_count?: number | null
          percentile_25_m2_covered?: number | null
          percentile_25_m2_total?: number | null
          percentile_75_m2_covered?: number | null
          percentile_75_m2_total?: number | null
          property_count?: number
          property_type?: string | null
          removed_count?: number | null
          stddev_m2_covered?: number | null
          stddev_m2_total?: number | null
          year_month: string
        }
        Update: {
          avg_days_on_market?: number | null
          avg_price_m2_covered?: number | null
          avg_price_m2_total?: number | null
          avg_price_total?: number | null
          city?: string | null
          created_at?: string
          id?: string
          max_price_m2_total?: number | null
          median_expenses?: number | null
          median_price_m2_covered?: number | null
          median_price_m2_total?: number | null
          median_price_total?: number | null
          median_surface_covered?: number | null
          median_surface_total?: number | null
          min_price_m2_total?: number | null
          neighborhood?: string
          new_listings_count?: number | null
          percentile_25_m2_covered?: number | null
          percentile_25_m2_total?: number | null
          percentile_75_m2_covered?: number | null
          percentile_75_m2_total?: number | null
          property_count?: number
          property_type?: string | null
          removed_count?: number | null
          stddev_m2_covered?: number | null
          stddev_m2_total?: number | null
          year_month?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          age_years: number | null
          alt_urls: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          comparables_count: number | null
          created_at: string
          currency: string | null
          description: string | null
          disposition: string | null
          estado_general: string | null
          expenses: number | null
          external_id: string
          highlights: string[] | null
          id: string
          informe_breve: string | null
          last_checked_at: string | null
          location: string | null
          lowlights: string[] | null
          luminosity: string | null
          neighborhood: string | null
          norm_locality: string | null
          norm_neighborhood: string | null
          norm_province: string | null
          oportunidad_ajustada: number | null
          oportunidad_neta: number | null
          orientation: string | null
          parking: number | null
          price: number | null
          price_per_m2_covered: number | null
          price_per_m2_total: number | null
          property_type: string | null
          removed_at: string | null
          rooms: number | null
          score_multiplicador: number | null
          scraped_at: string | null
          source: string | null
          status: string
          street: string | null
          surface_covered: number | null
          surface_total: number | null
          title: string | null
          toilettes: number | null
          updated_at: string
          url: string | null
          valor_potencial_m2: number | null
          valor_potencial_total: number | null
        }
        Insert: {
          address?: string | null
          age_years?: number | null
          alt_urls?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          comparables_count?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          disposition?: string | null
          estado_general?: string | null
          expenses?: number | null
          external_id: string
          highlights?: string[] | null
          id?: string
          informe_breve?: string | null
          last_checked_at?: string | null
          location?: string | null
          lowlights?: string[] | null
          luminosity?: string | null
          neighborhood?: string | null
          norm_locality?: string | null
          norm_neighborhood?: string | null
          norm_province?: string | null
          oportunidad_ajustada?: number | null
          oportunidad_neta?: number | null
          orientation?: string | null
          parking?: number | null
          price?: number | null
          price_per_m2_covered?: number | null
          price_per_m2_total?: number | null
          property_type?: string | null
          removed_at?: string | null
          rooms?: number | null
          score_multiplicador?: number | null
          scraped_at?: string | null
          source?: string | null
          status?: string
          street?: string | null
          surface_covered?: number | null
          surface_total?: number | null
          title?: string | null
          toilettes?: number | null
          updated_at?: string
          url?: string | null
          valor_potencial_m2?: number | null
          valor_potencial_total?: number | null
        }
        Update: {
          address?: string | null
          age_years?: number | null
          alt_urls?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          comparables_count?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          disposition?: string | null
          estado_general?: string | null
          expenses?: number | null
          external_id?: string
          highlights?: string[] | null
          id?: string
          informe_breve?: string | null
          last_checked_at?: string | null
          location?: string | null
          lowlights?: string[] | null
          luminosity?: string | null
          neighborhood?: string | null
          norm_locality?: string | null
          norm_neighborhood?: string | null
          norm_province?: string | null
          oportunidad_ajustada?: number | null
          oportunidad_neta?: number | null
          orientation?: string | null
          parking?: number | null
          price?: number | null
          price_per_m2_covered?: number | null
          price_per_m2_total?: number | null
          property_type?: string | null
          removed_at?: string | null
          rooms?: number | null
          score_multiplicador?: number | null
          scraped_at?: string | null
          source?: string | null
          status?: string
          street?: string | null
          surface_covered?: number | null
          surface_total?: number | null
          title?: string | null
          toilettes?: number | null
          updated_at?: string
          url?: string | null
          valor_potencial_m2?: number | null
          valor_potencial_total?: number | null
        }
        Relationships: []
      }
      saved_projects: {
        Row: {
          created_at: string
          discarded_at: string | null
          id: string
          notes: string | null
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discarded_at?: string | null
          id?: string
          notes?: string | null
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discarded_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_projects_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_runs: {
        Row: {
          analyzed_count: number | null
          candidates_count: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          filters: Json
          id: string
          result_property_ids: string[] | null
          status: string
          total_matched: number | null
          user_id: string
        }
        Insert: {
          analyzed_count?: number | null
          candidates_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          filters?: Json
          id?: string
          result_property_ids?: string[] | null
          status?: string
          total_matched?: number | null
          user_id: string
        }
        Update: {
          analyzed_count?: number | null
          candidates_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          filters?: Json
          id?: string
          result_property_ids?: string[] | null
          status?: string
          total_matched?: number | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payer_email: string | null
          mp_preapproval_id: string | null
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upload_logs: {
        Row: {
          error_message: string | null
          errors: string[] | null
          file_url: string | null
          filename: string | null
          finished_at: string | null
          id: string
          processed: number | null
          skipped: number | null
          source: string
          started_at: string
          status: string
          total_rows: number | null
        }
        Insert: {
          error_message?: string | null
          errors?: string[] | null
          file_url?: string | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          processed?: number | null
          skipped?: number | null
          source?: string
          started_at?: string
          status?: string
          total_rows?: number | null
        }
        Update: {
          error_message?: string | null
          errors?: string[] | null
          file_url?: string | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          processed?: number | null
          skipped?: number | null
          source?: string
          started_at?: string
          status?: string
          total_rows?: number | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          analyses_count: number
          comparisons_count: number
          created_at: string
          exports_count: number
          id: string
          searches_count: number
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          analyses_count?: number
          comparisons_count?: number
          created_at?: string
          exports_count?: number
          id?: string
          searches_count?: number
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          analyses_count?: number
          comparisons_count?: number
          created_at?: string
          exports_count?: number
          id?: string
          searches_count?: number
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          budget_currency: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          id: string
          investment_goal: string | null
          property_types: string[] | null
          updated_at: string
          user_id: string
          user_type: string
          zones: string[] | null
        }
        Insert: {
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          investment_goal?: string | null
          property_types?: string[] | null
          updated_at?: string
          user_id: string
          user_type: string
          zones?: string[] | null
        }
        Update: {
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          investment_goal?: string | null
          property_types?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: string
          zones?: string[] | null
        }
        Relationships: []
      }
      user_property_analysis: {
        Row: {
          comparables_count: number | null
          created_at: string
          estado_general: string | null
          highlights: string[] | null
          id: string
          informe_breve: string | null
          lowlights: string[] | null
          oportunidad_ajustada: number | null
          oportunidad_neta: number | null
          property_id: string
          score_multiplicador: number | null
          updated_at: string
          user_id: string
          valor_potencial_m2: number | null
          valor_potencial_median_m2: number | null
          valor_potencial_total: number | null
        }
        Insert: {
          comparables_count?: number | null
          created_at?: string
          estado_general?: string | null
          highlights?: string[] | null
          id?: string
          informe_breve?: string | null
          lowlights?: string[] | null
          oportunidad_ajustada?: number | null
          oportunidad_neta?: number | null
          property_id: string
          score_multiplicador?: number | null
          updated_at?: string
          user_id: string
          valor_potencial_m2?: number | null
          valor_potencial_median_m2?: number | null
          valor_potencial_total?: number | null
        }
        Update: {
          comparables_count?: number | null
          created_at?: string
          estado_general?: string | null
          highlights?: string[] | null
          id?: string
          informe_breve?: string | null
          lowlights?: string[] | null
          oportunidad_ajustada?: number | null
          oportunidad_neta?: number | null
          property_id?: string
          score_multiplicador?: number | null
          updated_at?: string
          user_id?: string
          valor_potencial_m2?: number | null
          valor_potencial_median_m2?: number | null
          valor_potencial_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_property_analysis_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      neighborhood_medians: {
        Args: {
          p_cities?: string[]
          p_excluded_neighborhoods?: string[]
          p_neighborhoods?: string[]
          p_parking_min?: number
          p_price_max?: number
          p_price_min?: number
          p_property_types?: string[]
          p_rooms_max?: number
          p_rooms_min?: number
          p_surface_min?: number
        }
        Returns: {
          group_neighborhood: string
          group_property_type: string
          median_price_m2: number
          property_count: number
        }[]
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
