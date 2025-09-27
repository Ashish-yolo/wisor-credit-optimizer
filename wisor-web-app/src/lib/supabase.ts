import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          card_name: string
          network?: string
          card_last4: string
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          card_name: string
          network?: string
          card_last4: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_name?: string
          network?: string
          card_last4?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}