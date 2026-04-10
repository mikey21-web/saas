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

  // Don't send the literal string "cookie" — cookie auth is handled server-side
  if (session?.token && session.token !== 'cookie') {
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
    // First check localStorage (dev login / legacy)
    const stored = getStoredSession()
    if (stored) {
      setSession(stored)
      setIsLoaded(true)
      return
    }
    // Then check cookie-based session via /api/auth/me
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: { user?: ClientAuthUser | null }) => {
        if (data.user) {
          setSession({ token: 'cookie', user: data.user })
        } else {
          setSession(null)
        }
      })
      .catch(() => setSession(null))
      .finally(() => setIsLoaded(true))
  }, [])

  return {
    session,
    user: session?.user || null,
    token: session?.token || null,
    isLoaded,
    isSignedIn: !!session,
    signOut: async () => {
      clearStoredSession()
      setSession(null)
      // Clear the httpOnly cookie via server
      await fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {})
    },
    refresh: () => {
      const stored = getStoredSession()
      if (stored) { setSession(stored); return }
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data: { user?: ClientAuthUser | null }) => {
          setSession(data.user ? { token: 'cookie', user: data.user } : null)
        })
        .catch(() => setSession(null))
    },
  }
}
