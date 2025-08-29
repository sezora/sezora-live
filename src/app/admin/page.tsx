'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, Job } from '@/lib/supabase'

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/')
          return
        }

        // Check if user is admin
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
        if (session.user.email !== adminEmail) {
          router.push('/dashboard')
          return
        }

        // Load users and jobs
        await Promise.all([loadUsers(), loadJobs()])

      } catch (error) {
        console.error('Error loading admin data:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminData()
  }, [router])

  const loadUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadJobs = async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:users!jobs_employer_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      router.push('/')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their job postings.')) return

    try {
      // Delete from auth.users (this will cascade to custom users table due to RLS policies)
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) {
        // If auth deletion fails, try deleting from custom table
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) throw deleteError
      }

      // Reload data
      await Promise.all([loadUsers(), loadJobs()])
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      // Reload jobs
      await loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Error deleting job. Please try again.')
    }
  }

  if (isLoading) {
    return <div className="container">Loading admin dashboard...</div>
  }

  const students = users.filter(user => user.role === 'Student')
  const employers = users.filter(user => user.role === 'Employer')

  return (
    <div className="container admin-panel">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button id="admin-sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="admin-content">
        {/* Job Board Section */}
        <div className="admin-job-board-section">
          <div className="job-board-header">
            <h2>All Job Postings</h2>
          </div>
          <div className="job-listings">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-actions">
                      <button 
                        className="delete-job-btn"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="job-details">
                    <div className="job-detail">
                      <span className="job-detail-label">Date:</span>
                      <span className="job-detail-value">{job.date}</span>
                    </div>
                    <div className="job-detail">
                      <span className="job-detail-label">Pay:</span>
                      <span className="job-detail-value">{job.pay}</span>
                    </div>
                    <div className="job-detail">
                      <span className="job-detail-label">Posted by:</span>
                      <span className="job-detail-value">
                        {job.employer?.name || 'Unknown'} ({job.employer?.email || 'No email'})
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="job-board-empty">
                No job postings yet.
              </div>
            )}
          </div>
        </div>

        {/* User Columns */}
        <div className="user-columns">
          {/* Students Column */}
          <div className="user-column">
            <div className="column-header">
              <h2>Students</h2>
              <span className="user-count">{students.length}</span>
            </div>
            <div className="user-list">
              {students.length > 0 ? (
                students.map((student) => (
                  <div key={student.id} className="user-card">
                    <div className="user-info">
                      <div className="user-field">
                        <label>Name</label>
                        <span>{student.name}</span>
                      </div>
                      <div className="user-field">
                        <label>Email</label>
                        <span>{student.email}</span>
                      </div>
                      <div className="user-field">
                        <label>Joined</label>
                        <span>{new Date(student.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(student.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No students registered yet.
                </div>
              )}
            </div>
          </div>

          {/* Employers Column */}
          <div className="user-column">
            <div className="column-header">
              <h2>Employers</h2>
              <span className="user-count">{employers.length}</span>
            </div>
            <div className="user-list">
              {employers.length > 0 ? (
                employers.map((employer) => (
                  <div key={employer.id} className="user-card">
                    <div className="user-info">
                      <div className="user-field">
                        <label>Name</label>
                        <span>{employer.name}</span>
                      </div>
                      <div className="user-field">
                        <label>Email</label>
                        <span>{employer.email}</span>
                      </div>
                      <div className="user-field">
                        <label>Joined</label>
                        <span>{new Date(employer.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="user-field">
                        <label>Job Postings</label>
                        <span>{jobs.filter(job => job.employer_id === employer.id).length}</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(employer.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No employers registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}