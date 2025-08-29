'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { validateEmail, handleClientError } from '@/lib/auth'

interface PasswordResetProps {
  onClose: () => void
}

export default function PasswordReset({ onClose }: PasswordResetProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      if (!email.trim()) {
        throw new Error('Please enter your email address')
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      )

      if (resetError) throw resetError

      setMessage('Password reset instructions have been sent to your email address.')
    } catch (err: unknown) {
      setError(handleClientError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Reset Password</h3>
          <button className="close-modal" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '25px' }}>
            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}
            
            <div className="form-group">
              <label htmlFor="reset-email">Email Address:</label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}