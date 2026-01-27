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
      admin_action_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_name: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          owner_user_id: string
          sector: string | null
          shariah_compliance_certificate: string | null
          status: Database["public"]["Enums"]["business_status"]
          total_units_offered: number
          unit_price: number
          units_sold: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_user_id: string
          sector?: string | null
          shariah_compliance_certificate?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          total_units_offered?: number
          unit_price?: number
          units_sold?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_user_id?: string
          sector?: string | null
          shariah_compliance_certificate?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          total_units_offered?: number
          unit_price?: number
          units_sold?: number
          updated_at?: string
        }
        Relationships: []
      }
      funding_requests: {
        Row: {
          admin_notes: string | null
          business_profile_id: string
          created_at: string
          deleted_at: string | null
          id: string
          requested_amount: number
          requested_units: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["funding_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_profile_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          requested_amount: number
          requested_units: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["funding_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_profile_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          requested_amount?: number
          requested_units?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["funding_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_requests_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          business_profile_id: string
          created_at: string
          deleted_at: string | null
          id: string
          investor_user_id: string
          status: Database["public"]["Enums"]["investment_status"]
          total_amount: number
          unit_price: number
          units: number
          updated_at: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          investor_user_id: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_amount: number
          unit_price?: number
          units: number
          updated_at?: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          investor_user_id?: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_amount?: number
          unit_price?: number
          units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          reference_id: string | null
          reference_type: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          cnic: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at: string | null
          kyc_verified_at: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cnic?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          kyc_verified_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cnic?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          kyc_verified_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profit_distribution_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          investor_user_id: string
          profit_distribution_id: string
          units: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          investor_user_id: string
          profit_distribution_id: string
          units: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          investor_user_id?: string
          profit_distribution_id?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "profit_distribution_entries_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_distribution_entries_profit_distribution_id_fkey"
            columns: ["profit_distribution_id"]
            isOneToOne: false
            referencedRelation: "profit_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_distributions: {
        Row: {
          business_profile_id: string
          created_at: string
          cycle_name: string
          deleted_at: string | null
          distribution_date: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["profit_distribution_status"]
          total_profit_amount: number
          updated_at: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          cycle_name: string
          deleted_at?: string | null
          distribution_date: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["profit_distribution_status"]
          total_profit_amount: number
          updated_at?: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          cycle_name?: string
          deleted_at?: string | null
          distribution_date?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["profit_distribution_status"]
          total_profit_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_distributions_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_number: string | null
          account_title: string | null
          admin_notes: string | null
          amount: number
          bank_name: string | null
          created_at: string
          deleted_at: string | null
          id: string
          processed_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_title?: string | null
          admin_notes?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          processed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_title?: string | null
          admin_notes?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          processed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_wallet_id: { Args: { _user_id: string }; Returns: string }
      get_wallet_balance: { Args: { _wallet_id: string }; Returns: number }
      has_kyc_verified: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_business_owner: { Args: { _user_id: string }; Returns: boolean }
      is_investor: { Args: { _user_id: string }; Returns: boolean }
      process_investment_atomic: {
        Args: {
          p_business_name: string
          p_business_profile_id: string
          p_current_units_sold: number
          p_investor_user_id: string
          p_total_amount: number
          p_unit_price: number
          p_units: number
          p_wallet_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "business_owner" | "investor"
      business_status: "pending" | "active" | "funded" | "closed" | "rejected"
      funding_status: "pending" | "approved" | "rejected" | "completed"
      investment_status: "active" | "redeemed" | "defaulted"
      kyc_status: "pending" | "submitted" | "verified" | "rejected"
      ledger_entry_type:
        | "investment"
        | "profit_distribution"
        | "withdrawal"
        | "admin_adjustment"
        | "deposit"
      profit_distribution_status: "pending" | "processing" | "completed"
      withdrawal_status: "pending" | "approved" | "rejected" | "processed"
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
      app_role: ["admin", "business_owner", "investor"],
      business_status: ["pending", "active", "funded", "closed", "rejected"],
      funding_status: ["pending", "approved", "rejected", "completed"],
      investment_status: ["active", "redeemed", "defaulted"],
      kyc_status: ["pending", "submitted", "verified", "rejected"],
      ledger_entry_type: [
        "investment",
        "profit_distribution",
        "withdrawal",
        "admin_adjustment",
        "deposit",
      ],
      profit_distribution_status: ["pending", "processing", "completed"],
      withdrawal_status: ["pending", "approved", "rejected", "processed"],
    },
  },
} as const
