'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { setStoredSession } from '@/lib/auth/client'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = (await res.json()) as {
        token?: string
        user?: { id: string; email: string; name?: string | null }
        error?: string
      }
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || 'Failed to create account')
      }

      setStoredSession({ token: data.token, user: data.user })
      router.push('/agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
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
          <h1 className="text-2xl font-bold text-white">Create your diyaa.ai account</h1>
          <p className="text-sm text-gray-400 mt-2">
            Start deploying agents with your own workspace.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            className="w-full rounded-lg px-4 py-3 bg-[#0c0c0d] border text-white"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          />
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
            minLength={8}
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-[#e879f9]">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
