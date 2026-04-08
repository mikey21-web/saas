'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthSession } from '@/lib/auth/client'

type PaymentMethod = 'stripe' | 'razorpay' | null

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthSession()

  const tier = searchParams.get('tier')
  const currency = searchParams.get('currency') || 'INR'
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tier) {
      router.push('/create-agent')
    }
  }, [tier, router])

  const tierConfig = {
    intern: { name: 'Intern', priceINR: 999, priceUSD: 12 },
    agent: { name: 'Agent', priceINR: 2499, priceUSD: 30 },
  }

  const config = tierConfig[tier as keyof typeof tierConfig]
  if (!config) return null

  const price = currency === 'INR' ? config.priceINR : config.priceUSD
  const currencySymbol = currency === 'INR' ? '₹' : '$'

  const handleStripePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: tier,
          currency,
          email: user?.email,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Stripe error:', err)
      setError('Payment initiation failed. Please try again.')
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          amount: price * 100, // Razorpay uses paise
          email: user?.email,
        }),
      })

      const data = await response.json()

      // Load Razorpay script and initiate payment
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: 'INR',
          order_id: data.orderId,
          name: 'diyaa.ai',
          description: `${config.name} Plan - 7 Days Free Trial`,
          image: '/logo.png',
          handler: async (response: any) => {
            // Verify payment on backend
            await fetch('/api/checkout/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tier,
              }),
            })
            router.push(`/onboard/success?success=true&tier=${tier}`)
          },
          prefill: {
            email: user?.email,
            name: user?.name,
          },
          theme: { color: '#0284c7' },
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      console.error('Razorpay error:', err)
      setError('Payment initiation failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
        <p className="text-gray-600">
          7-day free trial. No credit card charges until the trial ends.
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between text-gray-700">
            <span>{config.name} Plan (Monthly)</span>
            <span className="font-bold">
              {currencySymbol}
              {price}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Trial Period</span>
            <span>7 days free</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Auto-renews on</span>
            <span>Day 8</span>
          </div>
        </div>

        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>
            {currencySymbol}
            {price}/month after trial
          </span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Choose Payment Method</h2>

        <div className="space-y-4">
          {/* Stripe */}
          <div
            onClick={() => setPaymentMethod('stripe')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              paymentMethod === 'stripe'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'stripe' ? 'border-blue-600' : 'border-gray-400'
                  }`}
                >
                  {paymentMethod === 'stripe' && (
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900">Pay with Stripe</div>
                  <div className="text-sm text-gray-600">Credit card, Apple Pay, Google Pay</div>
                </div>
              </div>
              <span className="text-2xl">💳</span>
            </div>
          </div>

          {/* Razorpay (only for INR) */}
          {currency === 'INR' && (
            <div
              onClick={() => setPaymentMethod('razorpay')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === 'razorpay'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'razorpay' ? 'border-blue-600' : 'border-gray-400'
                    }`}
                  >
                    {paymentMethod === 'razorpay' && (
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Pay with Razorpay</div>
                    <div className="text-sm text-gray-600">UPI, Cards, Wallets, Net Banking</div>
                  </div>
                </div>
                <span className="text-2xl">₹</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={paymentMethod === 'stripe' ? handleStripePayment : handleRazorpayPayment}
        disabled={!paymentMethod || loading}
        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
          paymentMethod && !loading
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? 'Processing...' : `Start 7-Day Free Trial`}
      </button>

      {/* Security Note */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p className="mt-2">By proceeding, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  )
}
