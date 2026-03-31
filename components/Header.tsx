'use client';
import { useState, useEffect } from 'react';
import { Menu, X, BrainCircuit } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-pink-500" />
            <span className="font-bold text-2xl text-white tracking-tight">diyaa<span className="text-pink-500">.</span>ai</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#capabilities" className="text-gray-300 hover:text-white transition-colors">Capabilities</a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-medium">Sign In</a>
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all glow-magenta hover:glow-magenta-lg">
              Get Started
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300 hover:text-white p-2">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0B] border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#capabilities" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Capabilities</a>
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Features</a>
            <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Pricing</a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">About</a>
            <a href="#" className="block px-3 py-2 mt-4 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Sign In</a>
            <button className="w-full mt-2 text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-lg">
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
