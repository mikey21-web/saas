'use client'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

const features = [
  'Response Type',
  'Outbound Autonomy',
  'Monthly Voice Calls',
  'Monthly Emails',
  'Monthly WhatsApp',
  'Built-in Skills',
  'Dedicated +91 Number',
]

const plans = [
  {
    name: 'Starter',
    price: '₹1,999',
    subtitle: 'Part-time AI assistant.',
    btnText: 'Get Started',
    btnClass: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900',
    values: ['Messages only', 'No', '50', '200', '50', '10', 'Shared'],
    active: false,
  },
  {
    name: 'Business',
    price: '₹4,999',
    subtitle: 'Full-time AI employee.',
    btnText: 'Start Free Trial',
    btnClass:
      'bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20',
    badge: 'MOST POPULAR',
    values: ['Voice, Text, Email', 'Full Autonomous', '100', '1000', '200', '30+', 'Dedicated'],
    active: true,
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-coral-100 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-full mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            PRICING
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Transparent, Scalable Pricing
          </motion.h2>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Pay for performance, not per seat. Start seeing ROI from day one.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`bg-white rounded-2xl p-8 relative flex flex-col border ${
                plan.active
                  ? 'border-coral-300 shadow-2xl shadow-coral-500/10 transform md:-translate-y-4'
                  : 'border-gray-200 shadow-lg'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-coral-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{plan.subtitle}</p>

              <div className="mb-8 border-b border-gray-100 pb-8">
                <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>

              {/* Mobile Accordion Feature List (Visible only on small screens) */}
              <div className="md:hidden flex-grow mb-8">
                <ul className="space-y-4">
                  {features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center text-sm border-b border-gray-100 pb-2"
                    >
                      <span className="text-gray-500 flex items-center gap-2">
                        <Check className="w-4 h-4 text-coral-500" />
                        {feat}
                      </span>
                      <span className="text-gray-900 font-medium text-right">{plan.values[idx]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto hidden md:block flex-grow mb-8">
                {/* Desktop placeholder, actual list handles desktop below */}
                <p className="text-sm text-gray-400 text-center italic">
                  See full comparison below
                </p>
              </div>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all mt-auto ${plan.btnClass}`}
              >
                {plan.btnText}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden md:block bg-white rounded-2xl overflow-hidden p-8 border border-gray-200 shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 text-gray-600 font-medium">Feature</th>
                <th className="py-4 px-4 text-gray-600 font-medium text-center">Starter</th>
                <th className="py-4 px-4 text-coral-500 font-medium text-center">Business</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feat, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-600 font-medium">{feat}</td>
                  <td className="py-4 px-4 text-gray-500 text-center">{plans[0].values[i]}</td>
                  <td className="py-4 px-4 text-gray-900 font-semibold text-center">
                    {plans[1].values[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-gray-500 hover:text-coral-500 transition-colors underline decoration-gray-300 text-sm"
            >
              Need Enterprise volume? Contact sales.
            </a>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          7-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
