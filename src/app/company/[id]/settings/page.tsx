'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import PlatformIcon from '@/components/PlatformIcon'
import { PLANS } from '@/lib/plans'

type Company = {
  id: string
  name: string
  website: string | null
  logoUrl: string | null
  brandData: {
    tone?: string
    keywords?: string[]
    audience?: string
    style?: string
    description?: string
  } | null
}

type SocialAccount = {
  id: string
  platform: string
  accountName: string
  tokenExpiry: string | null
}

type Subscription = {
  plan: string
  status: string
  postsUsedThisMonth: number
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
}

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'X', 'LINKEDIN', 'TIKTOK']

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-emerald-100 text-emerald-700',
  STARTER: 'bg-blue-100 text-blue-700',
  GROWTH: 'bg-purple-100 text-purple-700',
  PRO: 'bg-indigo-100 text-indigo-700',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIALING: 'bg-blue-100 text-blue-700',
  PAST_DUE: 'bg-yellow-100 text-yellow-700',
  CANCELED: 'bg-red-100 text-red-700',
}

export default function SettingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.id as string

  const [activeTab, setActiveTab] = useState('general')
  const [company, setCompany] = useState<Company | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)

  // General form
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [generalMsg, setGeneralMsg] = useState('')

  // Brand crawl
  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawling, setCrawling] = useState(false)
  const [crawlMsg, setCrawlMsg] = useState('')

  // Subscription
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)

    const connected = searchParams.get('connected')
    if (connected) setActiveTab('social')

    const isNew = searchParams.get('new')
    if (isNew) setActiveTab('subscription')
  }, [searchParams])

  async function load() {
    setLoading(true)
    const [companyRes, accountsRes] = await Promise.all([
      fetch(`/api/companies/${companyId}`),
      fetch(`/api/social/accounts?companyId=${companyId}`),
    ])

    if (companyRes.ok) {
      const { company } = await companyRes.json()
      setCompany(company)
      setSubscription(company.subscription)
      setName(company.name)
      setWebsite(company.website || '')
      setLogoUrl(company.logoUrl || '')
      setCrawlUrl(company.website || '')
    }
    if (accountsRes.ok) {
      const { accounts } = await accountsRes.json()
      setAccounts(accounts)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [companyId])

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault()
    setSavingGeneral(true)
    setGeneralMsg('')
    const res = await fetch(`/api/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, website, logoUrl }),
    })
    if (res.ok) {
      setGeneralMsg('Settings saved successfully!')
      await load()
    } else {
      setGeneralMsg('Failed to save settings.')
    }
    setSavingGeneral(false)
  }

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault()
    setCrawling(true)
    setCrawlMsg('')
    const res = await fetch('/api/ai/brand-crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, url: crawlUrl }),
    })
    if (res.ok) {
      setCrawlMsg('Brand data updated successfully!')
      await load()
    } else {
      setCrawlMsg('Failed to crawl website. Please check the URL.')
    }
    setCrawling(false)
  }

  async function handleConnectPlatform(platform: string) {
    const res = await fetch(`/api/social/connect/${platform.toLowerCase()}?companyId=${companyId}`)
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm('Disconnect this account?')) return
    await fetch(`/api/social/accounts?id=${accountId}`, { method: 'DELETE' })
    await load()
  }

  async function handleCheckout(plan: string) {
    setCheckoutLoading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, plan }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
    setCheckoutLoading(null)
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
    setPortalLoading(false)
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'brand', label: 'Brand Profile' },
    { id: 'social', label: 'Social Accounts' },
    { id: 'subscription', label: 'Subscription' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-0.5">{company?.name}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">General Settings</h2>
          {generalMsg && (
            <div className={`border rounded-xl p-3 mb-4 text-sm ${
              generalMsg.includes('success')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>{generalMsg}</div>
          )}
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder="https://yourcompany.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder="https://yourcompany.com/logo.png"
              />
            </div>
            <button
              type="submit"
              disabled={savingGeneral}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {savingGeneral ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Brand Profile Tab */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Website Brand Crawl</h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter your website URL and our AI will analyze your brand tone, keywords, and audience automatically.
            </p>
            {crawlMsg && (
              <div className={`border rounded-xl p-3 mb-4 text-sm ${
                crawlMsg.includes('success')
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>{crawlMsg}</div>
            )}
            <form onSubmit={handleCrawl} className="flex gap-3">
              <input
                type="url"
                required
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder="https://yourcompany.com"
              />
              <button
                type="submit"
                disabled={crawling}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {crawling ? 'Analyzing...' : '✦ Analyze Brand'}
              </button>
            </form>
          </div>

          {company?.brandData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Current Brand Profile</h2>
              <div className="space-y-4">
                {[
                  { label: 'Description', value: company.brandData.description },
                  { label: 'Brand Tone', value: company.brandData.tone },
                  { label: 'Target Audience', value: company.brandData.audience },
                  { label: 'Content Style', value: company.brandData.style },
                ].map(({ label, value }) => value && (
                  <div key={label}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-slate-700">{value}</p>
                  </div>
                ))}
                {company.brandData.keywords && company.brandData.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {company.brandData.keywords.map((kw) => (
                        <span key={kw} className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Accounts Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          {searchParams.get('connected') && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
              ✅ {searchParams.get('platform') || 'Account'} connected successfully!
            </div>
          )}
          {searchParams.get('error') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              Failed to connect account. Please try again.
            </div>
          )}

          {/* Connected accounts */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Connected Accounts</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-4 px-5 py-4">
                    <PlatformIcon platform={account.platform} className="w-6 h-6" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{account.accountName}</p>
                      <p className="text-xs text-slate-400">{account.platform}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Connected
                      </span>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect new accounts */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Connect Platforms</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {PLATFORMS.map((platform) => {
                const connected = accounts.some((a) => a.platform === platform)
                return (
                  <div key={platform} className="flex items-center gap-4 px-5 py-4">
                    <PlatformIcon platform={platform} className="w-6 h-6" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">
                        {platform.charAt(0) + platform.slice(1).toLowerCase()}
                      </p>
                    </div>
                    {connected ? (
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={() => handleConnectPlatform(platform)}
                        className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-4">
          {subscription ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {PLANS[subscription.plan as keyof typeof PLANS]?.name || subscription.plan}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[subscription.plan] || 'bg-slate-100 text-slate-600'}`}>
                      {subscription.plan}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[subscription.status] || 'bg-slate-100 text-slate-600'}`}>
                  {subscription.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Posts Used This Month</p>
                  <p className="font-semibold text-slate-900">
                    {subscription.postsUsedThisMonth} / {
                      PLANS[subscription.plan as keyof typeof PLANS]?.posts === Infinity
                        ? '∞'
                        : PLANS[subscription.plan as keyof typeof PLANS]?.posts
                    }
                  </p>
                </div>
                {subscription.currentPeriodEnd ? (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Renews</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Billing</p>
                    <p className="font-semibold text-slate-900">No charge</p>
                  </div>
                )}
              </div>

              {subscription.status === 'PAST_DUE' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-yellow-800 text-sm">
                  ⚠️ Your payment is past due. Please update your payment method to keep your account active.
                </div>
              )}
              {subscription.status === 'CANCELED' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
                  Your subscription has been canceled. Choose a plan below to reactivate.
                </div>
              )}

              {/* Stripe portal — only for paying plans with a Stripe customer */}
              {subscription.plan !== 'FREE' && subscription.stripeCustomerId && (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {portalLoading ? 'Opening...' : 'Manage Billing, Card & Invoices →'}
                </button>
              )}
              {subscription.plan === 'FREE' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm text-center">
                  🎁 You&apos;re on a complimentary Free plan — no billing required.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
              No active subscription. Choose a plan below to get started.
            </div>
          )}

          {/* Plan cards — hide FREE since it's admin-assigned only */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              {subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING' ? 'Change Plan' : 'Choose a Plan'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(PLANS).filter(([key]) => key !== 'FREE').map(([key, plan]) => (
                <div
                  key={key}
                  className={`bg-white rounded-xl border-2 p-4 ${
                    subscription?.plan === key ? 'border-indigo-500' : 'border-slate-200'
                  }`}
                >
                  {subscription?.plan === key && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                  )}
                  <h3 className="font-bold text-slate-900 mt-2">{plan.name}</h3>
                  <div className="text-2xl font-bold text-indigo-600 my-1">
                    ${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 mb-4">
                    <li>✓ {plan.posts === Infinity ? 'Unlimited' : plan.posts} posts/mo</li>
                    <li>✓ {plan.companies === Infinity ? 'Unlimited' : plan.companies} {plan.companies === 1 ? 'company' : 'companies'}</li>
                    <li>✓ {plan.seats} team seats</li>
                  </ul>
                  {subscription?.plan !== key && (
                    <button
                      onClick={() => handleCheckout(key)}
                      disabled={checkoutLoading === key}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {checkoutLoading === key ? 'Loading...' : 'Get Started'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
