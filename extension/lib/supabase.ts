import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Card {
  id: string
  user_id: string
  card_name: string
  network?: string
  card_last4: string
  created_at: string
  updated_at?: string
}

export interface User {
  id: string
  phone: string
  created_at: string
  updated_at: string
}