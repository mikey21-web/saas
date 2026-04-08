'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { setStoredSession } from '@/lib/auth/client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = (await res.json()) as {
        token?: string
        user?: { id: string; email: string; name?: string | null }
        error?: string
      }
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || 'Failed to sign in')
      }

      setStoredSession({ token: data.token, user: data.user })
      router.push('/agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#0c0c0d' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border p-8 space-y-5"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#161618' }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Sign in to diyaa.ai</h1>
          <p className="text-sm text-gray-400 mt-2">
            Use your email and password to access your workspace.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="w-full rounded-lg px-4 py-3 bg-[#0c0c0d] border text-white"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full rounded-lg px-4 py-3 bg-[#0c0c0d] border text-white"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-lg py-3 font-medium"
          style={{ background: '#e879f9', color: '#0c0c0d' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-sm text-gray-400">
          New here?{' '}
          <Link href="/sign-up" className="text-[#e879f9]">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
