'use client'
import { motion } from 'framer-motion'
import { Phone, Mail, Settings, Wrench } from 'lucide-react'

const capabilities = [
  {
    icon: <Phone className="w-6 h-6 text-coral-500" />,
    title: 'Phone & WhatsApp',
    color: 'from-coral-100 to-coral-50',
    points: [
      'Real +91 numbers assigned to your agent',
      'Real-time intelligent voice calls',
      'Automated WhatsApp messaging & replies',
      'Context-aware conversation history',
    ],
  },
  {
    icon: <Mail className="w-6 h-6 text-blue-500" />,
    title: 'Email & SMS',
    color: 'from-blue-100 to-blue-50',
    points: [
      'Automated personalized outreach campaigns',
      'Intelligent newsletter curation',
      'Instant meeting confirmations',
      'Inbox zero: smart email sorting & drafting',
    ],
  },
  {
    icon: <Settings className="w-6 h-6 text-purple-500" />,
    title: 'Autonomous Work',
    color: 'from-purple-100 to-purple-50',
    points: [
      'Relentless follow-ups on leads',
      'Automated payment chasing & invoicing',
      'Consistent social media posting',
      'Works 24/7/365 without fatigue',
    ],
  },
  {
    icon: <Wrench className="w-6 h-6 text-emerald-500" />,
    title: '30+ Built-in Skills',
    color: 'from-emerald-100 to-emerald-50',
    points: [
      'Deep web search & competitor analysis',
      'Automated GST & company registration lookup',
      'Calendar management & scheduling',
      'Complex PDF parsing & data extraction',
    ],
  },
]

export default function CapabilitiesGrid() {
  return (
    <section id="capabilities" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-4 py-1.5 bg-coral-50 text-coral-600 text-sm font-medium rounded-full mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            CAPABILITIES
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything Your Business Needs
          </motion.h2>
          <motion.p 
            className="text-gray-600 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Beyond simple chatbots. Diyaa provides a fully autonomous digital workforce equipped
            with everything needed to scale.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {capabilities.map((cap, i) => (
            <motion.div
              key={i}
              className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 
                         hover:shadow-xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cap.color} 
                              flex items-center justify-center mb-6 
                              group-hover:scale-110 transition-transform duration-300`}>
                {cap.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{cap.title}</h3>
              <ul className="space-y-3">
                {cap.points.map((point, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="mr-3 text-coral-500 mt-1">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
