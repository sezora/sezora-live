import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, requireAuth, validateInput, validators } from '@/lib/middleware'

// GET /api/jobs - Get all jobs
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(50, 60000)(request) // 50 requests per minute
    if (rateLimitResponse) return rateLimitResponse

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        date,
        pay,
        created_at,
        employer:users!jobs_employer_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100) // Limit results for performance

    if (error) throw error

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(10, 60000)(request) // 10 posts per minute
    if (rateLimitResponse) return rateLimitResponse

    // Require authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    // Validate input
    const validationResult = await validateInput({
      title: validators.string(3, 200),
      date: validators.required,
      pay: validators.string(1, 100)
    })(request)
    
    if (validationResult instanceof NextResponse) return validationResult

    const { body } = validationResult
    const { title, date, pay } = body

    // Verify user is an employer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authResult.user.id)
      .single()

    if (userError || userData.role !== 'Employer') {
      return NextResponse.json({ error: 'Only employers can post jobs' }, { status: 403 })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Date must be in YYYY-MM-DD format' }, { status: 400 })
    }

    // Create job with sanitized inputs
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: title.trim(),
        date,
        pay: pay.trim(),
        employer_id: authResult.user.id
      })
      .select()
      .single()

    if (jobError) throw jobError

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

// PUT /api/jobs - Update a job
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, date, pay } = body

    if (!id || !title || !date || !pay) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update job (RLS will ensure user can only update their own jobs)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .update({ title, date, pay })
      .eq('id', id)
      .eq('employer_id', user.id) // Extra security check
      .select()
      .single()

    if (jobError) throw jobError

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs - Delete a job
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const jobId = url.searchParams.get('id')
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Delete job (RLS will ensure user can only delete their own jobs or admin can delete any)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}