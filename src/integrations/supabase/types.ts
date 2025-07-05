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
      group_ride_members: {
        Row: {
          id: string
          joined_at: string
          ride_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          ride_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          ride_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_ride_members_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "group_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rides: {
        Row: {
          created_at: string
          creator_id: string
          cta_line: string
          departure_time: string
          description: string | null
          id: string
          max_spots: number
          station_name: string
          status: string
          university_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          cta_line: string
          departure_time: string
          description?: string | null
          id?: string
          max_spots?: number
          station_name: string
          status?: string
          university_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          cta_line?: string
          departure_time?: string
          description?: string | null
          id?: string
          max_spots?: number
          station_name?: string
          status?: string
          university_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      id_verifications: {
        Row: {
          created_at: string
          id: string
          id_image_url: string | null
          id_type: string
          rejection_reason: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_image_url?: string | null
          id_type: string
          rejection_reason?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_image_url?: string | null
          id_type?: string
          rejection_reason?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          accuracy: number | null
          created_at: string
          cta_line: string
          description: string
          id: string
          image_url: string | null
          incident_type: string
          latitude: number | null
          location_name: string
          longitude: number | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          cta_line: string
          description: string
          id?: string
          image_url?: string | null
          incident_type: string
          latitude?: number | null
          location_name: string
          longitude?: number | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          cta_line?: string
          description?: string
          id?: string
          image_url?: string | null
          incident_type?: string
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          student_id_number: string | null
          student_status: boolean | null
          university_name: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          student_id_number?: string | null
          student_status?: boolean | null
          university_name?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          student_id_number?: string | null
          student_status?: boolean | null
          university_name?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string
          created_at: string
          domain: string | null
          id: string
          name: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_spots: {
        Args: { ride_id_param: string }
        Returns: number
      }
      get_incident_reports_with_reporter: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          reporter_id: string
          incident_type: string
          cta_line: string
          location_name: string
          description: string
          latitude: number
          longitude: number
          accuracy: number
          image_url: string
          created_at: string
          updated_at: string
          status: string
          reporter_name: string
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
    Enums: {},
  },
} as const
