import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || process.env.ENCRYPTION_KEY || 'change-me-in-production'

export interface AuthIdentity {
  externalUserId: string
  email: string
  name?: string
  supabaseUserId: string
}

interface SessionPayload {
  sub: string
  email: string
  name?: string
  exp: number
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(encodedPayload: string): string {
  return createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url')
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  if (signature.length !== expectedSignature.length) {
    return null
  }
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload
    if (!payload.sub || !payload.email || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const candidateHash = scryptSync(password, salt, 64).toString('hex')
  if (hash.length !== candidateHash.length) return false
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidateHash, 'hex'))
}

async function getOrCreateSupabaseUser(
  externalUserId: string,
  email: string,
  name?: string
): Promise<string> {
  const supabase = supabaseAdmin

  const { data: existingUser } = await (supabase.from('users') as any)
    .select('id')
    .eq('clerk_id', externalUserId)
    .single()

  if (existingUser?.id) return existingUser.id

  const { data: createdUser, error } = await (supabase.from('users') as any)
    .insert({
      clerk_id: externalUserId,
      email,
      full_name: name || null,
    })
    .select('id')
    .single()

  if (error || !createdUser?.id) {
    throw new Error(`Failed to create user record: ${error?.message || 'unknown error'}`)
  }

  return createdUser.id
}

export async function resolveAuthIdentity(req: NextRequest): Promise<AuthIdentity | null> {
  const authHeader = req.headers.get('authorization')
  const xUserId = req.headers.get('x-user-id')
  const xUserEmail = req.headers.get('x-user-email')
  const xUserName = req.headers.get('x-user-name')

  let externalUserId: string | null = null
  let email: string | null = null
  let name: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifySessionToken(token)
    if (payload) {
      externalUserId = payload.sub
      email = payload.email
      name = payload.name
    }
  }

  if (!externalUserId && xUserId) {
    externalUserId = xUserId
    email = xUserEmail || `${xUserId}@placeholder.diyaa.ai`
    name = xUserName || undefined
  }

  if (!externalUserId || !email) return null

  const supabaseUserId = await getOrCreateSupabaseUser(externalUserId, email, name)

  return {
    externalUserId,
    email,
    name,
    supabaseUserId,
  }
}
