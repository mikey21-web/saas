'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { SignUpButton, SignInButton } from '@clerk/nextjs'

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  // Show landing for unauthenticated users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-white" style={{ background: '#0c0c0d' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(12,12,13,0.8)', backdropFilter: 'blur(10px)' }}>
          <nav className="container flex items-center justify-between h-16 px-6">
            <div className="text-xl font-bold tracking-tight">diyaa.ai</div>
            <div className="flex gap-3">
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{ background: '#e879f9', color: '#0c0c0d' }}>Get Started</button>
              </SignUpButton>
            </div>
          </nav>
        </header>

        {/* Hero Section - Asymmetric Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_45%] gap-0 min-h-[90vh] items-end">
          <div className="flex flex-col justify-end p-8 md:p-16 pb-24 lg:pb-32">
            <span className="text-xs tracking-[0.3em] uppercase mb-8 opacity-50 font-medium">Premium AI automation</span>
            <h1 className="text-5xl md:text-7xl lg:text-[clamp(3.5rem,10vw,8rem)] font-bold leading-[0.95] tracking-tight mb-8">
              Your business needs a <em className="not-italic" style={{ color: '#e879f9' }}>brain</em>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-12 leading-relaxed">
              Autonomous AI employees with real phone numbers, emails, and WhatsApp. Built for Indian businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SignUpButton mode="modal">
                <button className="px-8 py-3 font-medium rounded-lg transition-all text-sm md:text-base" style={{ background: '#e879f9', color: '#0c0c0d' }}>
                  Start Free Trial
                </button>
              </SignUpButton>
              <Link href="#pricing">
                <button className="px-8 py-3 font-medium rounded-lg transition-all border text-sm md:text-base" style={{ borderColor: 'rgba(232,121,249,0.3)', color: 'inherit' }}>
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative h-full" style={{ background: 'linear-gradient(135deg, rgba(232,121,249,0.1) 0%, rgba(232,121,249,0.05) 100%)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center opacity-30">
                <div className="text-6xl font-bold mb-4">🤖</div>
                <p className="text-sm uppercase tracking-widest">AI-Powered</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features - Grid Breaking Layout */}
        <section className="py-32 px-8 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="mb-24">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Capabilities</h2>
              <p className="text-gray-400 text-lg max-w-2xl">Your AI employee handles what takes humans hours</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {[
                { title: 'Phone & WhatsApp', desc: 'Real +91 numbers. Real-time voice calls & messaging.' },
                { title: 'Email & SMS', desc: 'Automated outreach, newsletters, confirmations.' },
                { title: 'Autonomous Work', desc: 'Follow-ups, payment chasing, social posting. 24/7.' },
                { title: '30+ Skills', desc: 'Web search, GST lookup, calendar, PDF, more.' },
                { title: 'Business Aware', desc: 'Learns your business, products & policies instantly.' },
                { title: 'Pay Per Use', desc: '₹999/mo includes 50 calls. Scale as you grow.' },
              ].map((feature, i) => {
                const spans = [7, 5, 5, 7, 4, 8]
                return (
                  <div key={i} className={`col-span-12 md:col-span-${spans[i]} p-8 rounded-xl border transition-all hover:border-opacity-100`} style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32 px-8 md:px-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Pricing</h2>
              <p className="text-gray-400 text-lg">Built for growth. Scale from ₹999 to your business needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Intern Plan */}
              <div className="rounded-2xl p-8 border transition-all" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-sm uppercase tracking-[0.2em] mb-4 opacity-60">Starter</h3>
                <div className="mb-8">
                  <span className="text-5xl font-bold">₹999</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-gray-400 mb-8 text-sm leading-relaxed">Part-time AI assistant. Responds to messages. No outbound autonomy.</p>
                <ul className="space-y-4 text-sm mb-8">
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>50 calls/month</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>200 emails/month</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>Phone + Email</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>Message responses only</span></li>
                </ul>
                <SignUpButton mode="modal">
                  <button className="w-full px-6 py-2.5 text-sm font-medium rounded-lg border transition-all" style={{ borderColor: 'rgba(232,121,249,0.3)', color: 'inherit' }}>
                    Get Started
                  </button>
                </SignUpButton>
              </div>

              {/* Agent Plan */}
              <div className="rounded-2xl p-8 border transition-all relative" style={{ borderColor: '#e879f9', background: 'rgba(232,121,249,0.08)' }}>
                <div className="absolute -top-4 left-8 text-xs uppercase tracking-[0.2em] font-bold px-4 py-1 rounded-full" style={{ background: '#e879f9', color: '#0c0c0d' }}>Most Popular</div>
                <h3 className="text-sm uppercase tracking-[0.2em] mb-4 opacity-60">Full Agent</h3>
                <div className="mb-8">
                  <span className="text-5xl font-bold">₹2,499</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-gray-300 mb-8 text-sm leading-relaxed">Full-time AI employee. Autonomous execution. Works 24/7.</p>
                <ul className="space-y-4 text-sm mb-8">
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>100 calls/month</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>1,000 emails/month</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>200 WhatsApp/month</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>30+ built-in skills</span></li>
                  <li className="flex gap-3"><span style={{ color: '#e879f9' }}>•</span> <span>Autonomous workflows</span></li>
                </ul>
                <SignUpButton mode="modal">
                  <button className="w-full px-6 py-2.5 text-sm font-medium rounded-lg transition-all" style={{ background: '#e879f9', color: '#0c0c0d' }}>
                    Start Free Trial
                  </button>
                </SignUpButton>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-12">7-day free trial. No credit card required. Cancel anytime.</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-8 md:px-16 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Stop hiring. Start automating.
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              100+ Indian businesses have automated their operations. Your AI employee is 4 minutes away.
            </p>
            <SignUpButton mode="modal">
              <button className="px-10 py-4 font-medium rounded-lg transition-all text-lg" style={{ background: '#e879f9', color: '#0c0c0d' }}>
                Get Started Free
              </button>
            </SignUpButton>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-8 md:px-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© 2026 diyaa.ai</p>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a href="#" className="hover:text-gray-300 transition">Privacy</a>
              <a href="#" className="hover:text-gray-300 transition">Terms</a>
              <a href="#" className="hover:text-gray-300 transition">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Show loading while checking auth
  return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
}
