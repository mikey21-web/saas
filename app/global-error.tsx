'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-white">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
            <p className="text-gray-600 mb-6">{error.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => reset()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
