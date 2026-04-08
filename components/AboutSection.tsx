'use client'
import { Bot, Zap, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <span className="inline-block px-4 py-1.5 bg-purple-50 text-purple-600 text-sm font-medium rounded-full mb-4">
              ABOUT US
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Indian SMBs, by Indians
            </h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Diyaa isn't just a wrapper around an LLM. It's a complex multi-agent architecture built for
              execution. By combining agent orchestration with deep tool integration, we give your
              business a cognitive layer that doesn't just process text—it takes action.
            </p>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Our mission is to help Indian SMBs stop losing ₹50L+ annually to operational leakage. 
              By automating scheduling, follow-ups, invoicing, and data-entry, humans can return to
              what they do best: strategy, empathy, and innovation.
            </p>
            <div className="flex items-center gap-4 border-l-4 border-coral-500 pl-4 py-2 bg-coral-50 rounded-r-lg">
              <div>
                <p className="text-gray-900 font-bold text-xl mb-1">Join the Revolution</p>
                <p className="text-gray-500 text-sm">Transform your business operations today.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="bg-white p-8 rounded-3xl relative overflow-hidden border border-gray-200 shadow-xl">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-coral-50 to-white rounded-2xl border border-coral-100">
                  <div className="w-12 h-12 rounded-xl bg-coral-100 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-coral-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">15+</div>
                  <div className="text-sm text-gray-500">Pre-built Agents</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-500">Automation</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹50L+</div>
                  <div className="text-sm text-gray-500">Saved Annually</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">India</div>
                  <div className="text-sm text-gray-500">First Platform</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
