import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, requireAdmin } from '@/lib/middleware'

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(20, 60000)(request) // 20 requests per minute
    if (rateLimitResponse) return rateLimitResponse

    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete a user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(10, 60000)(request) // 10 deletes per minute
    if (rateLimitResponse) return rateLimitResponse

    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    const url = new URL(request.url)
    const userId = url.searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Delete user from custom table (auth user will be handled by RLS)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}