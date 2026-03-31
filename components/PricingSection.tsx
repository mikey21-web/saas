'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const features = [
  "Response Type",
  "Outbound Autonomy",
  "Monthly Voice Calls",
  "Monthly Emails",
  "Monthly WhatsApp",
  "Built-in Skills",
  "Dedicated +91 Number"
];

const plans = [
  {
    name: "Starter",
    price: "₹999",
    subtitle: "Part-time AI assistant.",
    btnText: "Get Started",
    btnClass: "glass-card hover:bg-white/10 text-white",
    values: ["Messages only", "No", "50", "200", "50", "10", "Shared"],
    active: false
  },
  {
    name: "Full Agent",
    price: "₹2,499",
    subtitle: "Full-time AI employee.",
    btnText: "Start Free Trial",
    btnClass: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white glow-magenta",
    badge: "MOST POPULAR",
    values: ["Voice, Text, Email", "Full Autonomous", "100", "1000", "200", "30+", "Dedicated"],
    active: true
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Transparent, <span className="text-gradient-magenta">Scalable Pricing</span></h2>
          <p className="text-gray-400 text-lg">Pay for performance, not per seat. Start seeing ROI from day one.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {plans.map((plan, i) => (
            <motion.div 
              key={i}
              className={`glass-card rounded-2xl p-8 relative flex flex-col ${
                plan.active ? 'border-pink-500/50 glow-magenta-lg transform md:-translate-y-4 bg-slate-900/60' : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                  {plan.badge}
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{plan.subtitle}</p>
              
              <div className="mb-8 border-b border-white/10 pb-8">
                <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>

              {/* Mobile Accordion Feature List (Visible only on small screens) */}
              <div className="md:hidden flex-grow mb-8">
                <ul className="space-y-4">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Check className="w-4 h-4 text-pink-500" />
                        {feat}
                      </span>
                      <span className="text-white font-medium text-right">{plan.values[idx]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto hidden md:block flex-grow mb-8">
                {/* Desktop placeholder, actual list handles desktop below */}
                <p className="text-sm text-gray-500 text-center italic">See full comparison below</p>
              </div>

              <button className={`w-full py-4 rounded-xl font-bold transition-all mt-auto ${plan.btnClass}`}>
                {plan.btnText}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden md:block glass-card rounded-2xl overflow-hidden p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-gray-300 font-medium">Feature</th>
                <th className="py-4 px-4 text-gray-300 font-medium text-center">Starter</th>
                <th className="py-4 px-4 text-pink-400 font-medium text-center">Full Agent</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feat, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-gray-400 font-medium">{feat}</td>
                  <td className="py-4 px-4 text-gray-300 text-center">{plans[0].values[i]}</td>
                  <td className="py-4 px-4 text-white font-semibold text-center">{plans[1].values[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 text-center">
            <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/30 text-sm">Need Enterprise volume? Contact sales.</a>
          </div>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-8">7-day free trial. No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}
