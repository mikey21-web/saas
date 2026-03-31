'use client';
import { motion } from 'framer-motion';
import { CheckCircle2, LayoutDashboard, Brain } from 'lucide-react';

export default function FeaturesBento() {
  return (
    <section id="features" className="py-24 bg-[#0A0A0B]/50 relative">
      <div className="absolute inset-0 bg-blue-900/5 blur-[150px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Categorized Features & <span className="text-gradient-magenta">Built-in Skills</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">A fully-loaded, pre-trained employee out of the box.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <motion.div className="glass-card p-6 rounded-2xl h-full"
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Lead Generation</h3>
              <ul className="space-y-3">
                {['Cold outreach automation', 'Data enrichment (Apollo, Lusha)', 'CRM integration', 'Custom intro crafting'].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {f}</li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div className="glass-card p-6 rounded-2xl h-full"
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Customer Support</h3>
              <ul className="space-y-3">
                {['Multi-lingual responses', '24/7 ticket resolution', 'Refund processing', 'Knowledge base training'].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {f}</li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Center Column - Large Dashboard */}
          <motion.div 
            className="lg:col-span-1 glass-card rounded-2xl border border-pink-500/30 glow-magenta-lg p-1 overflow-hidden"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
             <div className="bg-[#050505] rounded-xl h-full p-6 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[400px]">
                <LayoutDashboard className="w-16 h-16 text-pink-500 mb-6 relative z-10" />
                <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Command Center</h3>
                <p className="text-gray-400 text-sm mb-8 relative z-10">Monitor all autonomous actions in real-time, jump into conversations, and track scaling metrics.</p>
                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-pink-500/20 to-transparent pointer-events-none"></div>
                <Brain className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white/5" />
             </div>
          </motion.div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <motion.div className="glass-card p-6 rounded-2xl h-full"
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Document Management</h3>
              <ul className="space-y-3">
                {['Invoice generation', 'Contract redlining', 'PDF parsing & sorting', 'Auto-filing systems'].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> {f}</li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div className="glass-card p-6 rounded-2xl h-full"
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Business Operations</h3>
              <ul className="space-y-3">
                {['Competitor monitoring', 'GST validation', 'Meeting scheduling', 'Payment chasing'].map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400"><CheckCircle2 className="w-5 h-5 text-pink-500 shrink-0" /> {f}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
