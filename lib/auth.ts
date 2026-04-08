import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

/**
 * Auth middleware for ALL API routes
 * - Extracts userId from JWT token
 * - Returns error if unauthorized
 * - Logs unauthorized attempts
 */
export function requireAuth(request?: NextRequest): string | null {
  try {
    const token = request?.cookies?.get('auth_token')?.value || ''

    if (!token) {
      console.warn('[AUTH] Unauthorized API access attempt - no token')
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded.userId
  } catch (error) {
    console.warn('[AUTH] Invalid token:', error)
    return null
  }
}

/**
 * Ownership check - verify user owns specific agent
 */
export async function requireAgentOwnership(
  userId: string, 
  agentId: string
): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .eq('id', agentId)
      .single()
    
    return !!data
  } catch {
    return false
  }
}

/**
 * Get user role from Supabase profiles table
 */
export async function getUserRole(userId: string): Promise<'user' | 'super_admin' | null> {
  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    return data?.role || 'user'
  } catch {
    return null
  }
}

/**
 * Super admin check
 */
export async function requireSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'super_admin'
}

// Usage in admin API routes:
// const userId = requireAuth(request)!
// if (!await requireSuperAdmin(userId)) {
//   return NextResponse.json({error: 'Super admin required'}, {status: 403})
// }

