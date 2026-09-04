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
      analytics_events: {
        Row: {
          created_at: string
          creator_id: string | null
          event_type: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          event_type: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          event_type?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_bookmarks: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_bookmarks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_links: {
        Row: {
          clicks: number
          conversions: number
          created_at: string
          creator_id: string
          id: string
          name: string
          slug: string | null
          updated_at: string
          url: string
        }
        Insert: {
          clicks?: number
          conversions?: number
          created_at?: string
          creator_id: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          clicks?: number
          conversions?: number
          created_at?: string
          creator_id?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payout_settings: {
        Row: {
          account_label: string | null
          created_at: string
          creator_id: string
          id: string
          method: string
          minimum_payout: number
          schedule: string
          updated_at: string
        }
        Insert: {
          account_label?: string | null
          created_at?: string
          creator_id: string
          id?: string
          method?: string
          minimum_payout?: number
          schedule?: string
          updated_at?: string
        }
        Update: {
          account_label?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          method?: string
          minimum_payout?: number
          schedule?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payout_settings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          discord_role_id: string | null
          discord_server_id: string | null
          display_name: string | null
          id: string
          is_published: boolean | null
          messaging_enabled: boolean
          monthly_price: number | null
          referral_code: string | null
          stripe_account_id: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          discord_role_id?: string | null
          discord_server_id?: string | null
          display_name?: string | null
          id?: string
          is_published?: boolean | null
          messaging_enabled?: boolean
          monthly_price?: number | null
          referral_code?: string | null
          stripe_account_id?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          discord_role_id?: string | null
          discord_server_id?: string | null
          display_name?: string | null
          id?: string
          is_published?: boolean | null
          messaging_enabled?: boolean
          monthly_price?: number | null
          referral_code?: string | null
          stripe_account_id?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          read: boolean
          sender_role: string
          subscriber_id: string
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          read?: boolean
          sender_role?: string
          subscriber_id: string
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          read?: boolean
          sender_role?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          recipients: number
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          id?: string
          recipients?: number
          sent_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          recipients?: number
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          id: string
          method: string
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          id?: string
          method?: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          method?: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      pick_tracker: {
        Row: {
          created_at: string
          date: string
          eu_odds: number | null
          id: string
          notes: string | null
          odds: string | null
          pick_event: string
          result: string
          sport: string
          units_risked: number
          units_won_lost: number | null
          us_odds: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          eu_odds?: number | null
          id?: string
          notes?: string | null
          odds?: string | null
          pick_event: string
          result?: string
          sport?: string
          units_risked?: number
          units_won_lost?: number | null
          us_odds?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          eu_odds?: number | null
          id?: string
          notes?: string | null
          odds?: string | null
          pick_event?: string
          result?: string
          sport?: string
          units_risked?: number
          units_won_lost?: number | null
          us_odds?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          auto_approve_creators: boolean
          created_at: string
          creator_messaging_enabled: boolean
          growth_manager_enabled: boolean
          id: boolean
          intro_fee_percent: number
          intro_period_days: number
          min_payout_amount: number
          payout_schedule: string
          platform_name: string
          standard_fee_percent: number
          support_email: string
          tagline: string
          updated_at: string
        }
        Insert: {
          auto_approve_creators?: boolean
          created_at?: string
          creator_messaging_enabled?: boolean
          growth_manager_enabled?: boolean
          id?: boolean
          intro_fee_percent?: number
          intro_period_days?: number
          min_payout_amount?: number
          payout_schedule?: string
          platform_name?: string
          standard_fee_percent?: number
          support_email?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          auto_approve_creators?: boolean
          created_at?: string
          creator_messaging_enabled?: boolean
          growth_manager_enabled?: boolean
          id?: boolean
          intro_fee_percent?: number
          intro_period_days?: number
          min_payout_amount?: number
          payout_schedule?: string
          platform_name?: string
          standard_fee_percent?: number
          support_email?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          creator_id: string
          id: string
          is_premium: boolean | null
          result: string
          title: string
          tracking_mode: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          creator_id: string
          id?: string
          is_premium?: boolean | null
          result?: string
          title: string
          tracking_mode?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          is_premium?: boolean | null
          result?: string
          title?: string
          tracking_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          billing_period: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_active: boolean
          is_closed: boolean
          is_featured: boolean
          is_limited: boolean
          max_spots: number | null
          name: string
          price: number
        }
        Insert: {
          billing_period?: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          is_featured?: boolean
          is_limited?: boolean
          max_spots?: number | null
          name: string
          price?: number
        }
        Update: {
          billing_period?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          is_featured?: boolean
          is_limited?: boolean
          max_spots?: number | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          creator_id: string
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          times_used: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          creator_id: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          creator_id?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number
          converted: boolean
          created_at: string
          creator_id: string
          id: string
          referred_email: string | null
          referred_user_id: string | null
          updated_at: string
        }
        Insert: {
          commission_earned?: number
          converted?: boolean
          created_at?: string
          creator_id: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_earned?: number
          converted?: boolean
          created_at?: string
          creator_id?: string
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_case_messages: {
        Row: {
          body: string
          case_id: string
          created_at: string
          id: string
          sender_role: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          id?: string
          sender_role?: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "resolution_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_cases: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_cases_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          creator_earnings: number
          creator_id: string
          fee_percentage: number
          id: string
          platform_fee: number
          status: string
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_earnings?: number
          creator_id: string
          fee_percentage?: number
          id?: string
          platform_fee?: number
          status?: string
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_earnings?: number
          creator_id?: string
          fee_percentage?: number
          id?: string
          platform_fee?: number
          status?: string
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          creator_id: string
          id: string
          read: boolean
          sender_role: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          creator_id: string
          id?: string
          read?: boolean
          sender_role?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          creator_id?: string
          id?: string
          read?: boolean
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
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
      users: {
        Row: {
          auth_id: string
          created_at: string
          discord_id: string | null
          discord_username: string | null
          email: string
          full_name: string | null
          id: string
          notification_prefs: Json
          username: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          email: string
          full_name?: string | null
          id?: string
          notification_prefs?: Json
          username?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notification_prefs?: Json
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_creator_post_previews: {
        Args: { p_creator_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_premium: boolean
          title: string
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
      app_role: "admin" | "moderator" | "user" | "creator" | "subscriber"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user", "creator", "subscriber"],
    },
  },
} as const
