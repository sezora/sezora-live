import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role?: string
  }
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
export function rateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: NextRequest): NextResponse | null => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key)
      }
    }
    
    const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs }
    
    if (current.count >= maxRequests && now < current.resetTime) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
          }
        }
      )
    }
    
    current.count++
    if (current.resetTime < now) {
      current.resetTime = now + windowMs
      current.count = 1
    }
    
    rateLimitStore.set(ip, current)
    return null
  }
}

// Authentication middleware
export async function requireAuth(req: NextRequest): Promise<NextResponse | { user: any }> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return { user }
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

// Admin authentication middleware
export async function requireAdmin(req: NextRequest): Promise<NextResponse | { user: any }> {
  const authResult = await requireAuth(req)
  
  if (authResult instanceof NextResponse) {
    return authResult // Return the error response
  }
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
  if (authResult.user.email !== adminEmail) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }
  
  return authResult
}

// Input validation middleware
export function validateInput(schema: Record<string, (value: any) => string | null>) {
  return async (req: NextRequest): Promise<NextResponse | { body: any }> => {
    try {
      const body = await req.json()
      const errors: Record<string, string> = {}
      
      for (const [field, validator] of Object.entries(schema)) {
        const error = validator(body[field])
        if (error) {
          errors[field] = error
        }
      }
      
      if (Object.keys(errors).length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', fields: errors },
          { status: 400 }
        )
      }
      
      return { body }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
  }
}

// Common validation functions
export const validators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required'
    }
    return null
  },
  
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format'
    }
    if (value.length > 254) {
      return 'Email is too long'
    }
    return null
  },
  
  string: (minLength: number = 1, maxLength: number = 1000) => (value: string) => {
    if (!value) return 'This field is required'
    if (typeof value !== 'string') return 'Must be a string'
    if (value.length < minLength) return `Must be at least ${minLength} characters`
    if (value.length > maxLength) return `Must be no more than ${maxLength} characters`
    return null
  },
  
  password: (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain a number'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(value)) {
      return 'Password must contain a special character'
    }
    return null
  },
  
  role: (value: string) => {
    if (!value) return 'Role is required'
    if (!['Student', 'Employer'].includes(value)) {
      return 'Role must be either Student or Employer'
    }
    return null
  }
}