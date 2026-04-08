'use client'
import { useState, useEffect } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              DIYAA<span className="text-coral-500">.AI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#agents" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Agents
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                About
              </a>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/sign-in"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-5 rounded-lg 
                         transition-all text-sm shadow-lg shadow-gray-900/20 hover:shadow-xl"
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <a
              href="#agents"
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Agents
            </a>
            <a
              href="#features"
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              About
            </a>
            <div className="pt-4 space-y-2">
              <a
                href="/sign-in"
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="block w-full text-center bg-gray-900 text-white font-medium py-3 rounded-lg"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
