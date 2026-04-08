'use client'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import WaitlistForm from "./WaitlistForm"

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-coral-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-50 border border-coral-200 rounded-full mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-coral-700">
              Multi-Agent AI Platform for Indian SMBs
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Stop losing{' '}
            <span className="text-coral-500 relative">
              ₹50L+
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="#FF7F50" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>{' '}
            annually
            <br />
            <span className="text-gray-400">to operational leakage</span>
          </motion.h1>

           {/* Subheadline */}
           <motion.p
             className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
           >
             AI agents that handle tasks, follow up on leads, prevent no-shows, 
             and automate billing — while you focus on growth.
           </motion.p>

           {/* Waitlist Form */}
           <WaitlistForm />

           {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a 
              href="/sign-up"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 
                         text-white font-semibold py-4 px-8 rounded-xl transition-all text-lg
                         shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Start 7-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#agents"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 
                         text-gray-900 font-semibold py-4 px-8 rounded-xl transition-all text-lg
                         border border-gray-200 shadow-sm"
            >
              Browse Agents
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Setup in 3 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp + Email included</span>
            </div>
          </motion.div>
        </div>

        {/* Agent Cards Preview */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent Card 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-2xl mb-4">
                💰
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Felix — Invoice Bot
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Auto-generates GST invoices, sends payment links, follows up on unpaid bills
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                  +47% collection rate
                </span>
              </div>
            </div>

            {/* Agent Card 2 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow md:-translate-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Scout — Lead Hunter
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Captures leads via WhatsApp, qualifies them, schedules follow-ups automatically
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  3x faster response
                </span>
              </div>
            </div>

            {/* Agent Card 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-2xl mb-4">
                🏥
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Maya — No-Show Preventer
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Sends appointment reminders, reschedules no-shows, reduces revenue leakage
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
                  -65% no-shows
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="mt-20 pt-12 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900">15+</div>
              <div className="text-sm text-gray-500 mt-1">Ready Agents</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-coral-500">₹50L+</div>
              <div className="text-sm text-gray-500 mt-1">Saved Annually</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-500 mt-1">Automation</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-500">3 min</div>
              <div className="text-sm text-gray-500 mt-1">Setup Time</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
