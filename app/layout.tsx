import type { Metadata } from 'next'
import './globals.css'

// Skip Google Fonts during build to avoid network issues
const inter = { className: 'font-sans' }

export const metadata: Metadata = {
  title: 'diyaa.ai - Your business needs a brain',
  description:
    'Your AI employee handles what takes humans hours. Autonomous workflows, real +91 numbers, and 30+ skills.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0A0A0B] text-gray-200 antialiased min-h-screen selection:bg-pink-500/30 selection:text-white`}
      >
        {children}
      </body>
    </html>
  )
}
