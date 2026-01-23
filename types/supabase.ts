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
      abuse_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          reason: string
          reporter_id: string | null
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_username: string
          created_at: string | null
          details: string | null
          id: string
          timestamp: string | null
        }
        Insert: {
          action: string
          admin_username: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          admin_username?: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          email: string
          id: number
          is_locked: boolean | null
          last_login: string | null
          password: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["admin_user_role"] | null
          username: string
        }
        Insert: {
          email: string
          id?: number
          is_locked?: boolean | null
          last_login?: string | null
          password?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_user_role"] | null
          username: string
        }
        Update: {
          email?: string
          id?: number
          is_locked?: boolean | null
          last_login?: string | null
          password?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_user_role"] | null
          username?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: number
          settings_data: Json | null
        }
        Insert: {
          id: number
          settings_data?: Json | null
        }
        Update: {
          id?: number
          settings_data?: Json | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          business_id: number | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          date: string
          id: string
          notes: string | null
          service_id: string | null
          service_name: string | null
          staff_member_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          time_slot: string
        }
        Insert: {
          business_id?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          date: string
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_member_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time_slot: string
        }
        Update: {
          business_id?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          date?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_member_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          date: string | null
          id: string
          post_id: number
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string | null
          date?: string | null
          id?: string
          post_id: number
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          date?: string | null
          id?: string
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          date: string | null
          excerpt: string | null
          id: number
          image_url: string
          slug: string
          title: string
          view_count: number | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          date?: string | null
          excerpt?: string | null
          id?: number
          image_url: string
          slug: string
          title: string
          view_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          date?: string | null
          excerpt?: string | null
          id?: number
          image_url?: string
          slug?: string
          title?: string
          view_count?: number | null
        }
        Relationships: []
      }
      business_blog_posts: {
        Row: {
          author: string | null
          business_id: number | null
          content: string | null
          created_date: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          published_date: string | null
          seo: Json | null
          slug: string
          status:
          | Database["public"]["Enums"]["business_blog_post_status"]
          | null
          title: string
          view_count: number | null
        }
        Insert: {
          author?: string | null
          business_id?: number | null
          content?: string | null
          created_date?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          published_date?: string | null
          seo?: Json | null
          slug: string
          status?:
          | Database["public"]["Enums"]["business_blog_post_status"]
          | null
          title: string
          view_count?: number | null
        }
        Update: {
          author?: string | null
          business_id?: number | null
          content?: string | null
          created_date?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          published_date?: string | null
          seo?: Json | null
          slug?: string
          status?:
          | Database["public"]["Enums"]["business_blog_post_status"]
          | null
          title?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_blog_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_staff: {
        Row: {
          business_id: number
          created_at: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["staff_member_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: number
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["staff_member_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: number
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["staff_member_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string
          categories: Database["public"]["Enums"]["business_category"][]
          city: string
          description: string
          district: string
          email: string | null
          hero_image_url: string | null
          hero_slides: Json | null
          id: number
          image_url: string
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          joined_date: string | null
          landing_page_config: Json | null
          landing_page_status: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          membership_expiry_date: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          name: string
          notification_settings: Json | null
          owner_id: string | null
          phone: string
          rating: number | null
          review_count: number | null
          seo: Json | null
          slogan: string | null
          slug: string
          socials: Json | null
          staff: Json | null
          tags: string[] | null
          trust_indicators: Json | null
          view_count: number | null
          ward: string
          website: string | null
          working_hours: Json
          youtube_url: string | null
        }
        Insert: {
          address: string
          categories: Database["public"]["Enums"]["business_category"][]
          city: string
          description: string
          district: string
          email?: string | null
          hero_image_url?: string | null
          hero_slides?: Json | null
          id?: number
          image_url: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          joined_date?: string | null
          landing_page_config?: Json | null
          landing_page_status?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          membership_expiry_date?: string | null
          membership_tier?:
          | Database["public"]["Enums"]["membership_tier"]
          | null
          name: string
          notification_settings?: Json | null
          owner_id?: string | null
          phone: string
          rating?: number | null
          review_count?: number | null
          seo?: Json | null
          slogan?: string | null
          slug: string
          socials?: Json | null
          staff?: Json | null
          tags?: string[] | null
          trust_indicators?: Json | null
          view_count?: number | null
          ward: string
          website?: string | null
          working_hours: Json
          youtube_url?: string | null
        }
        Update: {
          address?: string
          categories?: Database["public"]["Enums"]["business_category"][]
          city?: string
          description?: string
          district?: string
          email?: string | null
          hero_image_url?: string | null
          hero_slides?: Json | null
          id?: number
          image_url?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          joined_date?: string | null
          landing_page_config?: Json | null
          landing_page_status?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          membership_expiry_date?: string | null
          membership_tier?:
          | Database["public"]["Enums"]["membership_tier"]
          | null
          name?: string
          notification_settings?: Json | null
          owner_id?: string | null
          phone?: string
          rating?: number | null
          review_count?: number | null
          seo?: Json | null
          slogan?: string | null
          slug?: string
          socials?: Json | null
          staff?: Json | null
          tags?: string[] | null
          trust_indicators?: Json | null
          view_count?: number | null
          ward?: string
          website?: string | null
          working_hours?: Json
          youtube_url?: string | null
        }
        Relationships: []
      }
      conversions: {
        Row: {
          business_id: number | null
          conversion_type: string
          converted_at: string | null
          id: string
          metadata: Json | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: number | null
          conversion_type: string
          converted_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: number | null
          conversion_type?: string
          converted_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          business_id: number | null
          deal_price: number | null
          description: string
          discount_percentage: number | null
          end_date: string | null
          id: string
          image_url: string | null
          original_price: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          title: string
        }
        Insert: {
          business_id?: number | null
          deal_price?: number | null
          description: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          original_price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          title: string
        }
        Update: {
          business_id?: number | null
          deal_price?: number | null
          description?: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          original_price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications_log: {
        Row: {
          body: string
          created_at: string | null
          id: string
          read: boolean | null
          read_at: string | null
          recipient_email: string
          sent_at: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          recipient_email: string
          sent_at?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          read_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          business_id: number | null
          category: Database["public"]["Enums"]["media_category"] | null
          description: string | null
          id: string
          position: number | null
          title: string | null
          type: Database["public"]["Enums"]["media_type"] | null
          url: string
        }
        Insert: {
          business_id?: number | null
          category?: Database["public"]["Enums"]["media_category"] | null
          description?: string | null
          id?: string
          position?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["media_type"] | null
          url: string
        }
        Update: {
          business_id?: number | null
          category?: Database["public"]["Enums"]["media_category"] | null
          description?: string | null
          id?: string
          position?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["media_type"] | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_packages: {
        Row: {
          description: string | null
          duration_months: number
          features: string[] | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          permissions: Json | null
          price: number
        }
        Insert: {
          description?: string | null
          duration_months: number
          features?: string[] | null
          id: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          permissions?: Json | null
          price: number
        }
        Update: {
          description?: string | null
          duration_months?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          permissions?: Json | null
          price?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          business_id: number | null
          business_name: string | null
          confirmed_at: string | null
          id: string
          notes: string | null
          package_id: string | null
          package_name: string | null
          payment_method: string | null
          payment_proof_url: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          submitted_at: string | null
        }
        Insert: {
          amount?: number | null
          business_id?: number | null
          business_name?: string | null
          confirmed_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          package_name?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          submitted_at?: string | null
        }
        Update: {
          amount?: number | null
          business_id?: number | null
          business_name?: string | null
          confirmed_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          package_name?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content_data: Json | null
          page_name: string
        }
        Insert: {
          content_data?: Json | null
          page_name: string
        }
        Update: {
          content_data?: Json | null
          page_name?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          ip_address: string | null
          page_id: string | null
          page_type: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          page_id?: string | null
          page_type: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          page_id?: string | null
          page_type?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: number | null
          email: string | null
          favorites: number[] | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id?: number | null
          email?: string | null
          favorites?: number[] | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: number | null
          email?: string | null
          favorites?: number[] | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          address: string | null
          business_name: string
          category: Database["public"]["Enums"]["business_category"] | null
          email: string
          id: string
          phone: string
          status: string | null
          submitted_at: string | null
          tier: Database["public"]["Enums"]["membership_tier"] | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category?: Database["public"]["Enums"]["business_category"] | null
          email: string
          id?: string
          phone: string
          status?: string | null
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["membership_tier"] | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: Database["public"]["Enums"]["business_category"] | null
          email?: string
          id?: string
          phone?: string
          status?: string | null
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["membership_tier"] | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          business_id: number | null
          comment: string | null
          id: string
          rating: number | null
          reply: Json | null
          status: Database["public"]["Enums"]["review_status"] | null
          submitted_date: string | null
          user_avatar_url: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          business_id?: number | null
          comment?: string | null
          id?: string
          rating?: number | null
          reply?: Json | null
          status?: Database["public"]["Enums"]["review_status"] | null
          submitted_date?: string | null
          user_avatar_url?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          business_id?: number | null
          comment?: string | null
          id?: string
          rating?: number | null
          reply?: Json | null
          status?: Database["public"]["Enums"]["review_status"] | null
          submitted_date?: string | null
          user_avatar_url?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          name: string
          position: number | null
          price: string
        }
        Insert: {
          business_id?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          name: string
          position?: number | null
          price: string
        }
        Update: {
          business_id?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number | null
          price?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          business_id: number | null
          business_name: string | null
          created_at: string | null
          id: string
          last_reply_at: string | null
          message: string
          replies: Json | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
        }
        Insert: {
          business_id?: number | null
          business_name?: string | null
          created_at?: string | null
          id?: string
          last_reply_at?: string | null
          message: string
          replies?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
        }
        Update: {
          business_id?: number | null
          business_name?: string | null
          created_at?: string | null
          id?: string
          last_reply_at?: string | null
          message?: string
          replies?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: number | null
          id: string
          image_url: string | null
          name: string
          role: string
        }
        Insert: {
          business_id?: number | null
          id?: string
          image_url?: string | null
          name: string
          role: string
        }
        Update: {
          business_id?: number | null
          id?: string
          image_url?: string | null
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_index_usage: {
        Row: {
          index_scans: number | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
          tuples_fetched: number | null
          tuples_read: number | null
        }
        Relationships: []
      }
      v_slow_queries: {
        Row: {
          calls: number | null
          max_exec_time: number | null
          mean_exec_time: number | null
          query: string | null
          total_exec_time: number | null
        }
        Relationships: []
      }
      v_unused_indexes: {
        Row: {
          index_size: string | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      extract_business_id_from_path: { Args: { path: string }; Returns: number }
      extract_user_id_from_path: { Args: { path: string }; Returns: string }
      get_business_count: {
        Args: { p_category?: string; p_city?: string; p_district?: string }
        Returns: number
      }
      get_my_business_id: { Args: never; Returns: number }
      get_user_email: { Args: never; Returns: string }
      increment_blog_view_count: {
        Args: { p_post_id: number }
        Returns: undefined
      }
      increment_business_blog_view_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_business_view_count: {
        Args: { p_business_id: number }
        Returns: undefined
      }
      increment_view_count:
      | { Args: { p_business_id: number }; Returns: undefined }
      | { Args: { p_id: number; p_table_name: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: { user_email: string }; Returns: boolean }
      is_business_owner: { Args: { p_business_id: number }; Returns: boolean }
      register_business_atomic: {
        Args: {
          p_email: string
          p_password?: string
          p_full_name: string
          p_business_name: string
          p_phone: string
          p_address: string
          p_category: string
          p_description?: string | null
        }
        Returns: {
          business_id: number
          business_slug: string
          message: string
        }
      }
      search_blog_posts: {
        Args: { search_query: string }
        Returns: {
          category: string
          date: string
          excerpt: string
          id: number
          rank: number
          slug: string
          title: string
        }[]
      }
      search_businesses: {
        Args: { search_query: string }
        Returns: {
          categories: string[]
          city: string
          district: string
          id: number
          name: string
          rank: number
          rating: number
          review_count: number
          slug: string
        }[]
      }
      search_businesses_advanced: {
        Args: {
          p_category?: Database["public"]["Enums"]["business_category"]
          p_city?: string
          p_district?: string
          p_limit?: number
          p_offset?: number
          p_search_text?: string
          p_tags?: string[]
        }
        Returns: {
          address: string
          categories: Database["public"]["Enums"]["business_category"][]
          city: string
          description: string
          district: string
          id: number
          is_active: boolean
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          name: string
          rating: number
          review_count: number
          slug: string
        }[]
      }
      update_business_ratings: {
        Args: { p_business_id: number }
        Returns: undefined
      }
    }
    Enums: {
      admin_user_role: "Admin" | "Moderator" | "Editor"
      appointment_status: "Pending" | "Confirmed" | "Cancelled" | "Completed"
      business_blog_post_status: "Draft" | "Published"
      business_category:
      | "Spa & Massage"
      | "Hair Salon"
      | "Nail Salon"
      | "Beauty Clinic"
      | "Dental Clinic"
      deal_status: "Active" | "Expired" | "Scheduled"
      media_category:
      | "Uncategorized"
      | "Interior"
      | "Exterior"
      | "Staff"
      | "Products"
      media_type: "IMAGE" | "VIDEO"
      membership_tier: "VIP" | "Premium" | "Free"
      notification_type:
      | "NEW_REVIEW"
      | "APPOINTMENT_REQUEST"
      | "APPOINTMENT_CONFIRMED"
      | "APPOINTMENT_CANCELLED"
      | "ORDER_CONFIRMED"
      | "ORDER_REJECTED"
      | "MEMBERSHIP_EXPIRING"
      | "PLATFORM_ANNOUNCEMENT"
      order_status:
      | "Pending"
      | "Awaiting Confirmation"
      | "Completed"
      | "Rejected"
      registration_status: "Pending" | "Approved" | "Rejected"
      review_status: "Visible" | "Hidden"
      staff_member_role: "Admin" | "Editor"
      ticket_status: "Open" | "In Progress" | "Closed"
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
      admin_user_role: ["Admin", "Moderator", "Editor"],
      appointment_status: ["Pending", "Confirmed", "Cancelled", "Completed"],
      business_blog_post_status: ["Draft", "Published"],
      business_category: [
        "Spa & Massage",
        "Hair Salon",
        "Nail Salon",
        "Beauty Clinic",
        "Dental Clinic",
      ],
      deal_status: ["Active", "Expired", "Scheduled"],
      media_category: [
        "Uncategorized",
        "Interior",
        "Exterior",
        "Staff",
        "Products",
      ],
      media_type: ["IMAGE", "VIDEO"],
      membership_tier: ["VIP", "Premium", "Free"],
      notification_type: [
        "NEW_REVIEW",
        "APPOINTMENT_REQUEST",
        "APPOINTMENT_CONFIRMED",
        "APPOINTMENT_CANCELLED",
        "ORDER_CONFIRMED",
        "ORDER_REJECTED",
        "MEMBERSHIP_EXPIRING",
        "PLATFORM_ANNOUNCEMENT",
      ],
      order_status: [
        "Pending",
        "Awaiting Confirmation",
        "Completed",
        "Rejected",
      ],
      registration_status: ["Pending", "Approved", "Rejected"],
      review_status: ["Visible", "Hidden"],
      staff_member_role: ["Admin", "Editor"],
      ticket_status: ["Open", "In Progress", "Closed"],
    },
  },
} as const
