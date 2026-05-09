'use client'

import { usePathname, useRouter } from 'next/navigation'

type Props = {
  companyId: string
  subscription: { status: string } | null
  children: React.ReactNode
}

// These sub-paths require an active subscription to access
const GATED_SEGMENTS = ['/posts', '/calendar', '/automations', '/team']

export default function SubscriptionGate({ companyId, subscription, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const hasActiveSub = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

  // Always allow: company overview (/company/[id]) and settings
  const isGatedPage = GATED_SEGMENTS.some((seg) => pathname.includes(seg))

  if (!isGatedPage || hasActiveSub) {
    return <>{children}</>
  }

  // Trying to access a feature page without a subscription
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Start your free trial to unlock this</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-sm">
        Try PostPilot free for 7 days on the Growth plan — no charge until day 8. Cancel anytime.
      </p>

      <button
        onClick={() => router.push(`/company/${companyId}/settings?tab=subscription`)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Start 7-day free trial →
      </button>

      <p className="mt-3 text-xs text-slate-400">Card required · No charge for 7 days</p>
    </div>
  )
}
