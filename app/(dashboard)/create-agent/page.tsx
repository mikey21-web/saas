'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type TierType = 'intern' | 'agent' | null

const tiers = [
  {
    id: 'intern',
    name: 'Intern',
    price: 999,
    currency: '₹',
    desc: 'Part-time AI helper for basic tasks',
    features: [
      '50 calls/month included',
      '200 emails/month included',
      'Phone + Email only',
      'Responds to messages',
    ],
    color: 'border-gray-300 bg-white',
    button: 'bg-gray-900 text-white hover:bg-gray-800',
  },
  {
    id: 'agent',
    name: 'Agent',
    price: 2499,
    currency: '₹',
    desc: 'Full-time AI employee with autonomy',
    features: [
      '100 calls/month included',
      '1,000 emails/month included',
      '200 WhatsApp/month included',
      'Autonomous execution',
      '30+ skills included',
    ],
    color: 'border-blue-600 bg-blue-50',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
    badge: 'Most Popular',
  },
]

export default function CreateAgentPage() {
  const [selectedTier, setSelectedTier] = useState<TierType>(null)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const router = useRouter()

  const handleContinue = () => {
    if (!selectedTier) return

    // Redirect to payment page
    router.push(`/checkout?tier=${selectedTier}&currency=${currency}`)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your AI Employee Plan</h1>
        <p className="text-gray-600">Select a plan and customize your agent after payment</p>
      </div>

      {/* Currency Toggle */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setCurrency('INR')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currency === 'INR'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          ₹ India (INR)
        </button>
        <button
          onClick={() => setCurrency('USD')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currency === 'USD'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          $ Global (USD)
        </button>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            onClick={() => setSelectedTier(tier.id as TierType)}
            className={`p-8 rounded-xl border-2 cursor-pointer transition-all ${tier.color} ${
              selectedTier === tier.id ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-md'
            }`}
          >
            {tier.badge && (
              <div className="mb-4 inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                {tier.badge}
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2 text-gray-900">{tier.name}</h3>
            <p className="text-gray-600 mb-6 text-sm">{tier.desc}</p>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">
                  {currency === 'INR' ? tier.price : Math.round(tier.price / 83)}
                </span>
                <span className="text-gray-600 font-semibold">{tier.currency}/month</span>
              </div>
              <p className="text-xs text-gray-500">7-day free trial. No credit card required.</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-900">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Selection Indicator */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">
                {selectedTier === tier.id ? '✓ Selected' : 'Select plan'}
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                {selectedTier === tier.id && (
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/dashboard">
          <button className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            Cancel
          </button>
        </Link>
        <button
          onClick={handleContinue}
          disabled={!selectedTier}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            selectedTier
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          Continue to Payment →
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
        <strong>Free Trial:</strong> All plans include 7 days free. We'll ask for your payment method after the trial period. Cancel anytime, no questions asked.
      </div>
    </div>
  )
}
