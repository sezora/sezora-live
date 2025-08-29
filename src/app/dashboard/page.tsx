'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, Job } from '@/lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [jobFormData, setJobFormData] = useState({
    title: '',
    date: '',
    pay: ''
  })
  const router = useRouter()

  // Load user data and jobs
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/')
          return
        }

        // Check if admin
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@app.com'
        if (session.user.email === adminEmail) {
          router.push('/admin')
          return
        }

        // Get user from custom users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)

        // Load jobs
        await loadJobs()

      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

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

  const openJobModal = (job?: Job) => {
    if (job) {
      setEditingJobId(job.id)
      setJobFormData({
        title: job.title,
        date: job.date,
        pay: job.pay
      })
    } else {
      setEditingJobId(null)
      setJobFormData({
        title: '',
        date: '',
        pay: ''
      })
    }
    setShowJobModal(true)
  }

  const closeJobModal = () => {
    setShowJobModal(false)
    setEditingJobId(null)
    setJobFormData({
      title: '',
      date: '',
      pay: ''
    })
  }

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      if (editingJobId) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update({
            title: jobFormData.title,
            date: jobFormData.date,
            pay: jobFormData.pay
          })
          .eq('id', editingJobId)

        if (error) throw error
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert({
            title: jobFormData.title,
            date: jobFormData.date,
            pay: jobFormData.pay,
            employer_id: user.id
          })

        if (error) throw error
      }

      // Reload jobs and close modal
      await loadJobs()
      closeJobModal()
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

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
    }
  }

  if (isLoading) {
    return <div className="container">Loading...</div>
  }

  if (!user) {
    return <div className="container">Error loading user data</div>
  }

  return (
    <div className="container">
      <div id="dashboard">
        <div className="dashboard-header">
          <h1>
            Welcome, {user.name}!
            <span className="role-badge">{user.role}</span>
          </h1>
          <button id="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

        <div className="dashboard-content">
          {/* Job Board Section */}
          <div className="job-board-section">
            <div className="job-board-header">
              <h2>Job Board</h2>
              {user.role === 'Employer' && (
                <button 
                  className="post-job-btn"
                  onClick={() => openJobModal()}
                >
                  Post New Job
                </button>
              )}
            </div>
            
            <div className="job-listings">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      {user.role === 'Employer' && job.employer_id === user.id && (
                        <div className="job-actions">
                          <button 
                            className="edit-job-btn"
                            onClick={() => openJobModal(job)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-job-btn"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
                          {job.employer?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="job-board-empty">
                  No job postings available yet.
                </div>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="welcome-section">
            <p>You have successfully signed in to your account.</p>
          </div>
        </div>
      </div>

      {/* Job Posting Modal */}
      {showJobModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingJobId ? 'Edit Job' : 'Post New Job'}</h3>
              <button className="close-modal" onClick={closeJobModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleJobSubmit}>
              <div style={{ padding: '25px' }}>
                <div className="form-group">
                  <label htmlFor="job-title">Job Title:</label>
                  <input
                    type="text"
                    id="job-title"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="job-date">Date:</label>
                  <input
                    type="date"
                    id="job-date"
                    value={jobFormData.date}
                    onChange={(e) => setJobFormData({ ...jobFormData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="job-pay">Pay:</label>
                  <input
                    type="text"
                    id="job-pay"
                    placeholder="e.g., $50,000/year"
                    value={jobFormData.pay}
                    onChange={(e) => setJobFormData({ ...jobFormData, pay: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={closeJobModal}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingJobId ? 'Update Job' : 'Post Job'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}