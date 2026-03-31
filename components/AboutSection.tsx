'use client';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <section id="about" className="py-24 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">The Science Behind <span className="text-gradient-magenta">Autonomous Intelligence</span></h2>
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              Diyaa isn't just a wrapper around an LLM. It's a complex neural architecture built for execution. By combining multi-agent systems with deep tool integration, we give your business a cognitive layer that doesn't just process text—it takes action.
            </p>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Our mission is to democratize operational excellence. By handing over the hours of manual scheduling, emailing, and data-entry to a reliable AI, humans can return to what they do best: strategy, empathy, and innovation.
            </p>
            <div className="flex items-center gap-4 border-l-4 border-pink-500 pl-4 py-2">
              <div>
                <p className="text-white font-bold text-xl mb-1">Join the Revolution</p>
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
            <div className="glass-card p-4 rounded-3xl relative overflow-hidden h-[400px] md:h-[500px] flex items-center justify-center border-blue-500/20">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
               {/* Abstract Neural/Tech Visual */}
               <Network className="w-48 h-48 md:w-full md:h-full max-w-[300px] text-blue-500/30 glow-blue animate-pulse z-10" />
               
               {/* Decorative elements representing nodes/team */}
               <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-pink-500 rounded-full glow-magenta animate-ping"></div>
               <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-purple-500 rounded-full glow-magenta animate-pulse" style={{ animationDelay: '1s' }}></div>
               <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-blue-400 rounded-full glow-blue animate-bounce"></div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
