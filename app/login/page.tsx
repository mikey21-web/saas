'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setStoredSession } from '@/lib/auth/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDevLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/dev-login')
      const data = await res.json()
      if (res.ok && data.token) {
        // Store session in localStorage for dashboard auth
        setStoredSession({
          token: data.token,
          user: {
            id: 'dev-user-123',
            email: 'dev@diyaa.ai',
            name: 'Dev User',
          },
        })
        router.push('/agents')
      } else {
        setError('Login failed')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            DIYAA<span className="text-orange-500">.AI</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleDevLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold transition"
        >
          {loading ? 'Signing in...' : 'Dev Login (Test Mode)'}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Takes you to the agent dashboard
        </p>
      </div>
    </div>
  )
}
