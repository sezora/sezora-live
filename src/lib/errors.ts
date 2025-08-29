// Error handling utilities

export interface AppError {
  code: string
  message: string
  userMessage: string
  statusCode: number
}

export class AuthError extends Error {
  code: string
  userMessage: string
  statusCode: number

  constructor(message: string, code: string = 'AUTH_ERROR', statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.userMessage = this.getFriendlyMessage(code, message)
    this.statusCode = statusCode
  }

  private getFriendlyMessage(code: string, originalMessage: string): string {
    const friendlyMessages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email or password. Please check your credentials and try again.',
      'EMAIL_NOT_CONFIRMED': 'Please check your email and click the confirmation link before signing in.',
      'TOO_MANY_REQUESTS': 'Too many login attempts. Please wait a few minutes before trying again.',
      'WEAK_PASSWORD': 'Password is too weak. Please choose a stronger password.',
      'EMAIL_EXISTS': 'An account with this email already exists. Please try signing in instead.',
      'INVALID_EMAIL': 'Please enter a valid email address.',
      'ADMIN_REQUIRED': 'You do not have permission to access this resource.'
    }

    return friendlyMessages[code] || originalMessage || 'An authentication error occurred.'
  }
}

export class ValidationError extends Error {
  code: string
  userMessage: string
  statusCode: number
  fields?: Record<string, string>

  constructor(message: string, fields?: Record<string, string>, code: string = 'VALIDATION_ERROR') {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.fields = fields
    this.userMessage = message
    this.statusCode = 400
  }
}

export class DatabaseError extends Error {
  code: string
  userMessage: string
  statusCode: number

  constructor(message: string, code: string = 'DATABASE_ERROR', statusCode: number = 500) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.userMessage = 'A server error occurred. Please try again later.'
    this.statusCode = statusCode
  }
}

// Convert Supabase errors to app errors
export function handleSupabaseError(error: any): AppError {
  const message = error?.message || 'An unexpected error occurred'
  
  // Map common Supabase errors to user-friendly messages
  if (message.includes('Invalid login credentials')) {
    return new AuthError(message, 'INVALID_CREDENTIALS')
  }
  
  if (message.includes('Email not confirmed')) {
    return new AuthError(message, 'EMAIL_NOT_CONFIRMED')
  }
  
  if (message.includes('Too many requests')) {
    return new AuthError(message, 'TOO_MANY_REQUESTS', 429)
  }
  
  if (message.includes('Password should be at least')) {
    return new AuthError(message, 'WEAK_PASSWORD', 400)
  }
  
  if (message.includes('User already registered')) {
    return new AuthError(message, 'EMAIL_EXISTS', 409)
  }
  
  if (message.includes('Invalid email')) {
    return new ValidationError(message, undefined, 'INVALID_EMAIL')
  }
  
  if (message.includes('duplicate key value violates unique constraint')) {
    if (message.includes('email')) {
      return new ValidationError('Email address is already in use', undefined, 'EMAIL_EXISTS')
    }
    return new ValidationError('This record already exists', undefined, 'DUPLICATE_ENTRY')
  }
  
  if (message.includes('foreign key constraint')) {
    return new ValidationError('Invalid reference to related data', undefined, 'INVALID_REFERENCE')
  }
  
  if (message.includes('check constraint')) {
    return new ValidationError('Data does not meet requirements', undefined, 'CONSTRAINT_VIOLATION')
  }
  
  // Default to database error
  return new DatabaseError(message)
}

// Format error for API responses
export function formatErrorResponse(error: any) {
  if (error instanceof AuthError || error instanceof ValidationError || error instanceof DatabaseError) {
    return {
      error: {
        code: error.code,
        message: error.userMessage,
        fields: 'fields' in error ? error.fields : undefined
      }
    }
  }
  
  // Handle unexpected errors
  console.error('Unexpected error:', error)
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    }
  }
}

// Client-side error handler
export function handleClientError(error: any): string {
  if (error?.response?.data?.error) {
    return error.response.data.error.message || 'An error occurred'
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}