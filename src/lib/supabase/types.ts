// Supabase数据库表类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          avatar_url: string | null
          credit_score: number
          balance: number
          is_online: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          credit_score?: number
          balance?: number
          is_online?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          credit_score?: number
          balance?: number
          is_online?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          group_type: 'enterprise' | 'community' | 'event' | 'custom'
          owner_id: string
          max_members: number
          current_members: number
          invite_code: string
          rules: Record<string, any>
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          group_type?: 'enterprise' | 'community' | 'event' | 'custom'
          owner_id: string
          max_members?: number
          current_members?: number
          invite_code?: string
          rules?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          group_type?: 'enterprise' | 'community' | 'event' | 'custom'
          owner_id?: string
          max_members?: number
          current_members?: number
          invite_code?: string
          rules?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          points_balance: number
          is_active: boolean
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          points_balance?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          points_balance?: number
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          group_id: string
          amount: number
          description: string | null
          status: 'pending' | 'completed' | 'rejected' | 'cancelled'
          type: 'transfer' | 'return' | 'settlement'
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          group_id: string
          amount: number
          description?: string | null
          status?: 'pending' | 'completed' | 'rejected' | 'cancelled'
          type?: 'transfer' | 'return' | 'settlement'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          group_id?: string
          amount?: number
          description?: string | null
          status?: 'pending' | 'completed' | 'rejected' | 'cancelled'
          type?: 'transfer' | 'return' | 'settlement'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_records: {
        Row: {
          id: string
          user_id: string
          type: 'positive' | 'negative'
          points: number
          reason: string
          related_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'positive' | 'negative'
          points: number
          reason: string
          related_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'positive' | 'negative'
          points?: number
          reason?: string
          related_transaction_id?: string | null
          created_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          transaction_id: string
          rating: number
          comment: string | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          transaction_id: string
          rating: number
          comment?: string | null
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          transaction_id?: string
          rating?: number
          comment?: string | null
          tags?: string[]
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Record<string, any>
          is_read: boolean
          is_read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Record<string, any>
          is_read?: boolean
          is_read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Record<string, any>
          is_read?: boolean
          is_read_at?: string | null
          created_at?: string
        }
      }
      group_invites: {
        Row: {
          id: string
          group_id: string
          inviter_id: string
          invite_code: string
          max_uses: number
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          inviter_id: string
          invite_code: string
          max_uses?: number
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          inviter_id?: string
          invite_code?: string
          max_uses?: number
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'auto'
          language: string
          notifications_enabled: boolean
          email_notifications: boolean
          push_notifications: boolean
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'auto'
          language?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'auto'
          language?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          id: string
          username: string
          email: string
          credit_score: number
          balance: number
          total_groups: number
          transfers_sent: number
          transfers_received: number
          completed_transactions: number
          average_rating: number | null
          total_ratings: number
        }
      }
      group_stats: {
        Row: {
          id: string
          name: string
          group_type: string
          owner_id: string
          owner_name: string
          current_members: number
          max_members: number
          total_transactions: number
          total_points_transferred: number | null
          average_transfer_amount: number | null
          created_at: string
        }
      }
    }
    Functions: {
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
  }
}