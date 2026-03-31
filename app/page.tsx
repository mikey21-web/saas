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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

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
