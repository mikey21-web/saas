import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'diyaa.ai - Hire Your AI Employees',
  description: 'Your business needs a brain, not just a bot. Autonomous AI agents for Indian businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-black">{children}</body>
      </html>
    </ClerkProvider>
  )
}
