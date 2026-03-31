'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import CapabilitiesGrid from '../components/CapabilitiesGrid'
import FeaturesBento from '../components/FeaturesBento'
import PricingSection from '../components/PricingSection'
import AboutSection from '../components/AboutSection'
import Footer from '../components/Footer'

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  // Show dashboard for authenticated users
  if (isLoaded && isSignedIn) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-gray-200 overflow-x-hidden">
        <Header />
        <div className="p-8">
          <div className="text-4xl font-bold mb-8">Welcome to diyaa.ai</div>
          <div className="text-lg mb-4">
            You're authenticated! Navigate to the dashboard using the sidebar to access your agents and workflows.
          </div>
          <div className="text-lg mb-4">
            <strong>Quick Start:</strong> Go to <code className="bg-gray-800 px-2 py-1 rounded">/dashboard</code> to see your available agents and workflows.
          </div>
          <div className="text-lg">
            <strong>Available Sections:</strong>
            <ul className="ml-4 space-y-1">
              <li>Your Agents</li>
              <li>Agent Store</li>
              <li>Workflows</li>
              <li>Skills</li>
              <li>Projects</li>
              <li>Contacts</li>
              <li>Inbox</li>
              <li>Academy</li>
              <li>Analytics</li>
              <li>Billing</li>
              <li>Settings</li>
            </ul>
          </div>
        </div>
      </main>
    )
  }

  // Show premium landing page for unauthenticated users
  if (isLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-gray-200 overflow-x-hidden">
        <Header />
        <HeroSection />
        <CapabilitiesGrid />
        <FeaturesBento />
        <PricingSection />
        <AboutSection />
        <Footer />
      </main>
    )
  }

  // Show loading spinner while checking auth
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></div>
    </div>
  )
}
