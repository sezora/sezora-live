'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
        if (session.user.email === 'admin@app.com') {
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
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name,
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
            name: signUpData.name,
            email: signUpData.email,
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
      // Check for admin credentials
      if (signInData.email === 'admin@app.com' && signInData.password === 'admin123') {
        // Create admin session
        const { error } = await supabase.auth.signInWithPassword({
          email: signInData.email,
          password: signInData.password
        })

        if (error) {
          // If admin doesn't exist in Supabase Auth, create them
          if (error.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin@app.com',
              password: 'admin123',
              options: {
                data: {
                  name: 'Admin',
                  role: 'Admin'
                }
              }
            })

            if (!signUpError) {
              // Try signing in again
              const { error: retryError } = await supabase.auth.signInWithPassword({
                email: signInData.email,
                password: signInData.password
              })
              
              if (!retryError) {
                router.push('/admin')
                return
              }
            }
          }
          throw error
        } else {
          router.push('/admin')
          return
        }
      }

      // Regular user sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      })

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')

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
        </form>
      </div>
    </div>
  )
}