import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'diyaa.ai - Your business needs a brain',
  description: 'Your AI employee handles what takes humans hours. Autonomous workflows, real +91 numbers, and 30+ skills.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-[#0A0A0B] text-gray-200 antialiased min-h-screen selection:bg-pink-500/30 selection:text-white`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
