import { supabase } from './supabase'
import type { User } from './supabase'

export interface AuthResult {
  success: boolean
  user?: User | null
  error?: string
}

export interface AdminAuthResult {
  success: boolean
  isAdmin: boolean
  user?: User | null
  error?: string
}

// Secure admin authentication
export async function authenticateAdmin(email: string, password: string): Promise<AdminAuthResult> {
  try {
    // Check against environment variables instead of hardcoded values
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    if (email !== adminEmail || password !== adminPassword) {
      return {
        success: false,
        isAdmin: false,
        error: 'Invalid admin credentials'
      }
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      // If admin doesn't exist in Supabase, create them
      if (authError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              name: 'Admin',
              role: 'Admin'
            }
          }
        })

        if (signUpError) {
          return {
            success: false,
            isAdmin: false,
            error: 'Failed to create admin account'
          }
        }

        // Try signing in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        })

        if (retryError) {
          return {
            success: false,
            isAdmin: false,
            error: 'Failed to authenticate admin'
          }
        }

        return {
          success: true,
          isAdmin: true,
          user: null // Admin doesn't have a user record in users table
        }
      }

      return {
        success: false,
        isAdmin: false,
        error: authError.message
      }
    }

    return {
      success: true,
      isAdmin: true,
      user: null // Admin doesn't have a user record in users table
    }
  } catch (error) {
    return {
      success: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

// Verify admin session
export async function verifyAdminSession(): Promise<AdminAuthResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return {
        success: false,
        isAdmin: false,
        error: 'No active session'
      }
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
    const isAdmin = session.user.email === adminEmail

    return {
      success: true,
      isAdmin,
      user: null
    }
  } catch (error) {
    return {
      success: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Session verification failed'
    }
  }
}

// Verify user session and get user data
export async function verifyUserSession(): Promise<AuthResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return {
        success: false,
        error: 'No active session'
      }
    }

    // Don't return user data for admin
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
    if (session.user.email === adminEmail) {
      return {
        success: true,
        user: null
      }
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      return {
        success: false,
        error: 'Failed to fetch user data'
      }
    }

    return {
      success: true,
      user: userData
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session verification failed'
    }
  }
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Client-side error handler (moved from errors.ts for import consistency)
export function handleClientError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as { response?: { data?: { error?: { message?: string } } } }
    if (httpError.response?.data?.error?.message) {
      return httpError.response.data.error.message
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}