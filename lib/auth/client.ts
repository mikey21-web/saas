'use client'

import { useEffect, useState } from 'react'

const TOKEN_KEY = 'diyaa_auth_token'
const USER_KEY = 'diyaa_auth_user'

export interface ClientAuthUser {
  id: string
  email: string
  name?: string | null
}

export interface ClientSession {
  token: string
  user: ClientAuthUser
}

export function getStoredSession(): ClientSession | null {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem(TOKEN_KEY)
  const userRaw = window.localStorage.getItem(USER_KEY)
  if (!token || !userRaw) return null

  try {
    return {
      token,
      user: JSON.parse(userRaw) as ClientAuthUser,
    }
  } catch {
    clearStoredSession()
    return null
  }
}

export function setStoredSession(session: ClientSession): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, session.token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = getStoredSession()
  const headers = new Headers(init.headers || {})

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(input, {
    ...init,
    headers,
  })
}

export function useAuthSession() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setSession(getStoredSession())
    setIsLoaded(true)
  }, [])

  return {
    session,
    user: session?.user || null,
    token: session?.token || null,
    isLoaded,
    isSignedIn: !!session,
    signOut: () => {
      clearStoredSession()
      setSession(null)
    },
    refresh: () => setSession(getStoredSession()),
  }
}
