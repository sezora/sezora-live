'use client'

import { validatePassword } from '@/lib/auth'

interface PasswordStrengthProps {
  password: string
  show: boolean
}

export default function PasswordStrength({ password, show }: PasswordStrengthProps) {
  if (!show || !password) return null

  const validation = validatePassword(password)
  const strength = getPasswordStrength(password)

  return (
    <div className="password-strength">
      <div className="strength-indicator">
        <div className={`strength-bar strength-${strength.level}`}>
          <div 
            className="strength-fill" 
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className="strength-label">{strength.label}</span>
      </div>
      
      {!validation.valid && (
        <div className="strength-requirements">
          <p>Password must contain:</p>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index} className="requirement-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function getPasswordStrength(password: string) {
  let score = 0

  // Length
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Character types
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) score += 1

  // Complexity bonus
  if (password.length >= 16) score += 1
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 1

  const levels = [
    { level: 'very-weak', label: 'Very Weak', percentage: 20 },
    { level: 'weak', label: 'Weak', percentage: 40 },
    { level: 'fair', label: 'Fair', percentage: 60 },
    { level: 'good', label: 'Good', percentage: 80 },
    { level: 'strong', label: 'Strong', percentage: 100 }
  ]

  const levelIndex = Math.min(Math.floor(score / 2), levels.length - 1)
  return levels[levelIndex]
}