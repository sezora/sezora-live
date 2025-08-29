'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { validatePassword, validateEmail, sanitizeInput } from '@/lib/auth'
import PasswordReset from '@/components/PasswordReset'
import PasswordStrength from '@/components/PasswordStrength'

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const router = useRouter()

  // Form state
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student'
  })

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if admin  
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
        if (session.user.email === adminEmail) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    }
    checkUser()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate all inputs
      if (!signUpData.name.trim() || !signUpData.email.trim() || !signUpData.password || !signUpData.role) {
        throw new Error('Please fill in all fields')
      }

      // Validate email format
      if (!validateEmail(signUpData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password strength
      const passwordValidation = validatePassword(signUpData.password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors[0])
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(signUpData.name)
      const sanitizedEmail = signUpData.email.trim().toLowerCase()

      if (sanitizedName.length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: signUpData.password,
        options: {
          data: {
            name: sanitizedName,
            role: signUpData.role
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Insert user data into custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: sanitizedName,
            email: sanitizedEmail,
            role: signUpData.role
          })

        if (insertError) throw insertError

        setSuccess('Account created successfully! Please check your email to verify your account.')
        
        // Clear form
        setSignUpData({ name: '', email: '', password: '', role: 'Student' })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate input
      if (!signInData.email || !signInData.password) {
        throw new Error('Please fill in all fields')
      }

      // Sign in with Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password
      })

      if (error) throw error

      if (authData.user) {
        // Check if user is admin (using environment variable or fallback)  
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
        
        if (authData.user.email === adminEmail) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const switchTab = (tab: 'signup' | 'signin') => {
    setActiveTab(tab)
    setError('')
    setSuccess('')
  }

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-tabs">
          <button 
            className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            Sign Up
          </button>
          <button 
            className={`tab-button ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Sign Up Form */}
        <form 
          className={`auth-form ${activeTab === 'signup' ? 'active' : ''}`}
          onSubmit={handleSignUp}
        >
          <h2>Create Account</h2>
          <input
            type="text"
            placeholder="Full Name"
            value={signUpData.name}
            onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={signUpData.email}
            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={signUpData.password}
            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
            required
          />
          <PasswordStrength 
            password={signUpData.password} 
            show={signUpData.password.length > 0} 
          />
          
          <div className="role-selector">
            <label>I am a:</label>
            <div className="toggle-container">
              <div 
                className={`toggle-option ${signUpData.role === 'Student' ? 'active' : ''}`}
                onClick={() => setSignUpData({ ...signUpData, role: 'Student' })}
              >
                Student
              </div>
              <div 
                className={`toggle-option ${signUpData.role === 'Employer' ? 'active' : ''}`}
                onClick={() => setSignUpData({ ...signUpData, role: 'Employer' })}
              >
                Employer
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Sign In Form */}
        <form 
          className={`auth-form ${activeTab === 'signin' ? 'active' : ''}`}
          onSubmit={handleSignIn}
        >
          <h2>Sign In</h2>
          <input
            type="email"
            placeholder="Email"
            value={signInData.email}
            onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={signInData.password}
            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              type="button" 
              onClick={() => setShowPasswordReset(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#66d9a3', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
      
      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordReset onClose={() => setShowPasswordReset(false)} />
      )}
    </div>
  )
}