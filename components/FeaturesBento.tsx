'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, LayoutDashboard, Sparkles } from 'lucide-react'

export default function FeaturesBento() {
  return (
    <section id="features" className="py-24 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-full mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            FEATURES
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Pre-trained Skills, Ready to Deploy
          </motion.h2>
          <motion.p 
            className="text-gray-600 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            A fully-loaded, pre-trained employee out of the box.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                Lead Generation
              </h3>
              <ul className="space-y-3">
                {[
                  'Cold outreach automation',
                  'Data enrichment (Apollo, Lusha)',
                  'CRM integration',
                  'Custom intro crafting',
                ].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                Customer Support
              </h3>
              <ul className="space-y-3">
                {[
                  'Multi-lingual responses',
                  '24/7 ticket resolution',
                  'Refund processing',
                  'Knowledge base training',
                ].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Center Column - Large Dashboard */}
          <motion.div
            className="lg:col-span-1 bg-gradient-to-br from-coral-500 to-coral-600 rounded-2xl p-1 overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-xl h-full p-6 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-100 to-coral-50 
                              flex items-center justify-center mb-6 relative z-10">
                <LayoutDashboard className="w-8 h-8 text-coral-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Command Center</h3>
              <p className="text-gray-500 text-sm mb-8 relative z-10">
                Monitor all autonomous actions in real-time, jump into conversations, and track
                scaling metrics.
              </p>
              <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-coral-50 to-transparent pointer-events-none"></div>
              <Sparkles className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-48 h-48 text-coral-100" />
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                Document Management
              </h3>
              <ul className="space-y-3">
                {[
                  'Invoice generation',
                  'Contract redlining',
                  'PDF parsing & sorting',
                  'Auto-filing systems',
                ].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                Business Operations
              </h3>
              <ul className="space-y-3">
                {[
                  'Competitor monitoring',
                  'GST validation',
                  'Meeting scheduling',
                  'Payment chasing',
                ].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-coral-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
