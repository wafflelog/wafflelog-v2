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
      app_notification: {
        Row: {
          actor_user_id: string | null
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          trip_id: string | null
          trip_invitation_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          trip_id?: string | null
          trip_invitation_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          trip_id?: string | null
          trip_invitation_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_notification_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notification_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notification_trip_invitation_id_fkey"
            columns: ["trip_invitation_id"]
            isOneToOne: false
            referencedRelation: "trip_invitation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item: {
        Row: {
          completed: boolean
          created_at: string
          deleted_at: string | null
          id: string
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          id: string
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      document: {
        Row: {
          caption: string | null
          created_at: string
          deleted_at: string | null
          file_name: string
          id: string
          mime_type: string
          pin_id: string | null
          storage_bucket: string
          storage_path: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name: string
          id: string
          mime_type: string
          pin_id?: string | null
          storage_bucket: string
          storage_path: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          pin_id?: string | null
          storage_bucket?: string
          storage_path?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      expense: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          id: string
          paid_by_name: string
          paid_by_user_id: string
          pin_id: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          deleted_at?: string | null
          description: string
          id: string
          paid_by_name: string
          paid_by_user_id: string
          pin_id?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          id?: string
          paid_by_name?: string
          paid_by_user_id?: string
          pin_id?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_paid_by_user_id_fkey"
            columns: ["paid_by_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      image: {
        Row: {
          caption: string | null
          created_at: string
          deleted_at: string | null
          height: number
          id: string
          mime_type: string
          pin_id: string | null
          storage_bucket: string
          storage_path: string
          trip_id: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          height: number
          id: string
          mime_type: string
          pin_id?: string | null
          storage_bucket: string
          storage_path: string
          trip_id: string
          updated_at?: string
          user_id: string
          width: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          height?: number
          id?: string
          mime_type?: string
          pin_id?: string | null
          storage_bucket?: string
          storage_path?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      note: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          pin_id: string | null
          text: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id: string
          pin_id?: string | null
          text: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          pin_id?: string | null
          text?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      pin: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          end_date: string | null
          end_time: string | null
          id: string
          metadata_json: Json
          name: string | null
          start_date: string
          time: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          metadata_json?: Json
          name?: string | null
          start_date: string
          time?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          metadata_json?: Json
          name?: string | null
          start_date?: string
          time?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_link: {
        Row: {
          caption: string | null
          created_at: string
          deleted_at: string | null
          id: string
          pin_id: string | null
          title: string | null
          trip_id: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          id: string
          pin_id?: string | null
          title?: string | null
          trip_id: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          pin_id?: string | null
          title?: string | null
          trip_id?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_link_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_link_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      trip: {
        Row: {
          created_at: string
          deleted_at: string | null
          end_date: string
          id: string
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          end_date: string
          id?: string
          start_date: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_invitation: {
        Row: {
          created_at: string
          id: string
          invitee_user_id: string
          inviter_user_id: string
          responded_at: string | null
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_user_id: string
          inviter_user_id: string
          responded_at?: string | null
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_user_id?: string
          inviter_user_id?: string
          responded_at?: string | null
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invitation_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invitation_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invitation_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
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
    Enums: {},
  },
} as const
