'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 29,
    posts: '10 posts / mo',
    companies: '1 company',
    seats: '2 team seats',
    description: 'Perfect for solo creators and small brands.',
    highlight: false,
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    price: 79,
    posts: '60 posts / mo',
    companies: '3 companies',
    seats: '5 team seats',
    description: 'For growing teams managing multiple brands.',
    highlight: true,
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 149,
    posts: 'Unlimited posts',
    companies: 'Unlimited companies',
    seats: '10 team seats',
    description: 'For agencies running full-scale social operations.',
    highlight: false,
  },
]

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleStartTrial(planKey: string) {
    if (!companyName.trim()) {
      setError('Please enter your company name first.')
      return
    }
    setError('')
    setLoading(planKey)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), plan: planKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(null)
        return
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-start p-6 pt-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <span className="text-white font-bold text-xl">PostPilot</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Start your free trial</h1>
        <p className="text-slate-400">
          7 days free, then pay monthly. Cancel anytime.
          <br />
          <span className="text-slate-500 text-sm">A card is required to activate your trial — you won&apos;t be charged until day 8.</span>
        </p>
      </div>

      {/* Company name input */}
      <div className="w-full max-w-sm mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          What&apos;s your company name?
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => { setCompanyName(e.target.value); setError('') }}
          placeholder="Acme Marketing Co."
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key)}
            className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
              plan.highlight
                ? 'border-indigo-500 bg-indigo-950/60'
                : selectedPlan === plan.key
                ? 'border-indigo-400 bg-slate-800/60'
                : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-500'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </span>
            )}

            <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-slate-400 text-xs mb-4">{plan.description}</p>

            <div className="mb-5">
              <span className="text-3xl font-bold text-white">${plan.price}</span>
              <span className="text-slate-400 text-sm">/mo after trial</span>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {plan.posts}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {plan.companies}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {plan.seats}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> AI post generation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> Scheduled publishing
              </li>
            </ul>

            <button
              onClick={(e) => { e.stopPropagation(); handleStartTrial(plan.key) }}
              disabled={loading !== null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                plan.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {loading === plan.key ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                'Start 7-day free trial'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-slate-500 text-xs text-center max-w-sm">
        By starting a trial you agree to our{' '}
        <a href="#" className="text-slate-400 hover:underline">Terms of Service</a>.
        You can cancel at any time before the trial ends and you won&apos;t be charged.
      </p>

      <p className="mt-4 text-slate-500 text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
