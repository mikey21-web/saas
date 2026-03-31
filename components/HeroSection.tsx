'use client';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Database, Zap, Rocket, Brain } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Your business needs a <span className="text-gradient-magenta relative inline-block">
            brain
            <span className="absolute bottom-1 left-0 w-full h-[3px] bg-pink-500 glow-magenta rounded-full"></span>
          </span>
        </motion.h1>

        <motion.p 
          className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Your AI employee handles what takes humans hours. Autonomous execution, non-stop learning, limitless scale.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-lg transition-all glow-magenta hover:glow-magenta-lg text-lg">
            Start Free Trial
          </button>
          <button className="w-full sm:w-auto glass-card hover:bg-white/10 text-white font-bold py-4 px-8 rounded-lg transition-all text-lg">
            View Pricing
          </button>
        </motion.div>

        {/* Brain Illustration / UI Mockup */}
        <motion.div 
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="glass-card rounded-2xl p-2 md:p-4 border border-white/10 relative overflow-hidden">
            {/* Top Bar of UI */}
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="ml-4 text-xs text-gray-500 font-mono">diyaa-autonomous-agent // running</div>
            </div>
            
            {/* Mockup Body */}
            <div className="bg-[#050505] rounded-xl border border-white/5 h-[300px] md:h-[500px] flex items-center justify-center relative overflow-hidden">
              <Brain className="w-32 h-32 md:w-64 md:h-64 text-pink-500/20 absolute" />
              
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
              
              {/* Fake UI Elements */}
              <div className="z-10 w-full h-full p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="glass-card px-4 py-2 rounded-lg flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-semibold">Active Agent: Diyaa Core</span>
                  </div>
                  <div className="glass-card px-4 py-2 rounded-lg text-right">
                    <span className="text-xs text-gray-400">Tasks Completed</span>
                    <div className="text-xl font-bold text-gradient-magenta">14,239</div>
                  </div>
                </div>

                <div className="space-y-3 max-w-md">
                  <div className="glass-card p-3 rounded-lg text-sm text-left flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                    <div><span className="text-gray-400">09:42 AM</span> - Drafted and sent follow-up to Acx Corp.</div>
                  </div>
                  <div className="glass-card p-3 rounded-lg text-sm text-left flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div><span className="text-gray-400">09:45 AM</span> - Answered support query via WhatsApp (+91).</div>
                  </div>
                  <div className="glass-card p-3 rounded-lg text-sm text-left flex items-start gap-3 opacity-70">
                    <div className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-transparent animate-spin shrink-0" />
                    <div className="text-pink-400">Processing GST lookup for newly acquired lead...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Integration Row */}
        <motion.div 
          className="mt-16 border-t border-white/10 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest font-semibold text-center">Seamlessly Integrated With</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <Mail className="w-8 h-8 hover:opacity-100 transition-opacity cursor-pointer" />
            <MessageCircle className="w-8 h-8 hover:opacity-100 transition-opacity cursor-pointer" />
            <Database className="w-8 h-8 hover:opacity-100 transition-opacity cursor-pointer" />
            <Zap className="w-8 h-8 hover:opacity-100 transition-opacity cursor-pointer" />
            <Rocket className="w-8 h-8 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
