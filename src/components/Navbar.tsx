'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg">PostPilot</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white text-sm transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white text-sm transition-colors">
              Pricing
            </a>
            <Link href="/auth/login" className="text-slate-300 hover:text-white text-sm transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-3">
            <a href="#features" className="block text-slate-300 hover:text-white text-sm py-2">Features</a>
            <a href="#pricing" className="block text-slate-300 hover:text-white text-sm py-2">Pricing</a>
            <Link href="/auth/login" className="block text-slate-300 hover:text-white text-sm py-2">Sign In</Link>
            <Link href="/auth/signup" className="block bg-indigo-600 text-white text-center font-semibold px-5 py-2.5 rounded-lg text-sm">
              Start Free Trial
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
