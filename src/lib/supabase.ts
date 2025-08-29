import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  name: string
  email: string
  role: 'Student' | 'Employer'
  created_at: string
}

export interface Job {
  id: string
  title: string
  date: string
  pay: string
  employer_id: string
  created_at: string
  employer?: {
    name: string
    email: string
  }
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name: string
    role: string
  }
}