'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDevLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/dev-login')
      if (res.ok) {
        router.push('/admin')
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
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">diyaa.ai admin portal</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleDevLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
        >
          {loading ? 'Logging in...' : 'Dev Login (Test Mode)'}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Production login coming soon. This sets a test JWT cookie.
        </p>
      </div>
    </div>
  )
}
