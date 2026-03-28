import Link from 'next/link'
import { SignUpButton, SignInButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <nav className="container flex items-center justify-between h-16">
          <div className="text-2xl font-bold text-blue-600">diyaa.ai</div>
          <div className="flex gap-4">
            <SignInButton mode="modal">
              <button className="btn btn-secondary">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Get Started</button>
            </SignUpButton>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight max-w-4xl mx-auto">
          Your business needs a <span className="text-blue-600">brain</span>, not just a bot
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Hire autonomous AI employees with real phone numbers, emails, and WhatsApp. Built for Indian businesses. ₹999/month.
        </p>
        <div className="flex gap-4 justify-center mb-16">
          <SignUpButton mode="modal">
            <button className="btn btn-primary text-lg px-8 py-4">Start Free Trial</button>
          </SignUpButton>
          <Link href="#pricing">
            <button className="btn btn-secondary text-lg px-8 py-4">View Pricing</button>
          </Link>
        </div>
        <div className="bg-blue-50 p-8 rounded-xl border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">🚀 Early Access — 7 days free, no credit card needed</p>
          <p className="text-lg font-semibold text-blue-600">Used by 100+ Indian businesses</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="container">
          <h2 className="section-title text-center mb-12">What Your AI Employee Can Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📞',
                title: 'Phone & WhatsApp',
                desc: 'Real +91 phone number, WhatsApp messages, voice calls. Instant customer connection.',
              },
              {
                icon: '📧',
                title: 'Email & SMS',
                desc: 'Automated replies, newsletters, appointment reminders. Full SMS/email support.',
              },
              {
                icon: '⚡',
                title: 'Autonomous Execution',
                desc: 'Sends follow-ups, chases payments, posts on social media. Works 24/7.',
              },
              {
                icon: '🛠️',
                title: '30+ Built-In Skills',
                desc: 'Web search, GST lookup, payment links, calendar scheduling, PDF reading.',
              },
              {
                icon: '🧠',
                title: 'Business-Aware',
                desc: 'Learns your business on signup. Understands your products, policies, customers.',
              },
              {
                icon: '💰',
                title: 'Pay Per Use',
                desc: '₹999 base includes 50 calls/mo. Extra calls, emails, WhatsApp — minimal overages.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="section-title text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Intern Card */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">₹999</span>
                <span className="text-gray-600">/month</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Intern</h3>
              <p className="text-gray-600 mb-6">Part-time AI helper for basic tasks</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> 50 calls/month included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> 200 emails/month included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Phone + Email only
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Responds to messages
                </li>
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full btn btn-secondary">Get Started</button>
              </SignUpButton>
            </div>

            {/* Agent Card */}
            <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg border-2 border-blue-600 relative">
              <div className="absolute -top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">₹2,499</span>
                <span className="text-blue-100">/month</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Agent</h3>
              <p className="text-blue-100 mb-6">Full-time AI employee with autonomy</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> 100 calls/month included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> 1,000 emails/month included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> 200 WhatsApp/month included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> Autonomous execution
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> 30+ skills included
                </li>
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full btn bg-white text-blue-600 hover:bg-gray-100">Start Free Trial</button>
              </SignUpButton>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8">7-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to automate your business?</h2>
        <p className="text-xl text-blue-100 mb-8">Join 100+ Indian businesses already using AI employees.</p>
        <SignUpButton mode="modal">
          <button className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
            Create Your First Agent
          </button>
        </SignUpButton>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="container flex justify-between items-center text-sm">
          <p>&copy; 2026 diyaa.ai. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
