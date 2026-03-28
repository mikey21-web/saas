import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}

let _supabase: ReturnType<typeof getSupabaseClient> | null = null
let _supabaseAdmin: ReturnType<typeof getSupabaseAdminClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
  get(_target, prop) {
    if (!_supabase) _supabase = getSupabaseClient()
    return (_supabase as any)[prop]
  },
})

export const supabaseAdmin = new Proxy({} as ReturnType<typeof getSupabaseAdminClient>, {
  get(_target, prop) {
    if (!_supabaseAdmin) _supabaseAdmin = getSupabaseAdminClient()
    return (_supabaseAdmin as any)[prop]
  },
})
