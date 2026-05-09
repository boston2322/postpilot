'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  website: string | null
  logoUrl: string | null
  role: string
  subscription: {
    plan: string
    status: string
    postsUsedThisMonth: number
  } | null
  _count: { members: number; posts: number }
}

type User = {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [userRes, companiesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/companies'),
      ])
      if (userRes.ok) {
        const { user } = await userRes.json()
        setUser(user)
      }
      if (companiesRes.ok) {
        const { companies } = await companiesRes.json()
        setCompanies(companies)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalPosts = companies.reduce(
    (sum, c) => sum + (c.subscription?.postsUsedThisMonth || 0),
    0
  )

  const planColors: Record<string, string> = {
    STARTER: 'bg-blue-100 text-blue-700',
    GROWTH: 'bg-purple-100 text-purple-700',
    PRO: 'bg-indigo-100 text-indigo-700',
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAST_DUE: 'bg-yellow-100 text-yellow-700',
    CANCELED: 'bg-red-100 text-red-700',
    TRIALING: 'bg-blue-100 text-blue-700',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s an overview of your companies and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Companies',
            value: companies.length,
            icon: '🏢',
            color: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Posts This Month',
            value: totalPosts,
            icon: '📝',
            color: 'bg-purple-50 text-purple-600',
          },
          {
            label: 'Active Subscriptions',
            value: companies.filter((c) => c.subscription?.status === 'ACTIVE').length,
            icon: '✅',
            color: 'bg-green-50 text-green-600',
          },
          {
            label: 'Team Members',
            value: companies.reduce((sum, c) => sum + (c._count?.members || 0), 0),
            icon: '👥',
            color: 'bg-orange-50 text-orange-600',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Companies List */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Your Companies</h2>
        <Link
          href="/dashboard/companies/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Company
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                  {company.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{company.name}</h3>
                  <p className="text-xs text-slate-500">{company.role}</p>
                </div>
              </div>
              {company.subscription && (
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[company.subscription.plan] || 'bg-gray-100 text-gray-600'}`}>
                    {company.subscription.plan}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[company.subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                    {company.subscription.status}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-900">
                  {company.subscription?.postsUsedThisMonth || 0}
                </div>
                <div className="text-xs text-slate-500">Posts this month</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-900">
                  {company._count?.members || 0}
                </div>
                <div className="text-xs text-slate-500">Team members</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/company/${company.id}`}
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Open Dashboard
              </Link>
              {!company.subscription && (
                <Link
                  href={`/company/${company.id}/settings`}
                  className="flex-1 text-center bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Add Billing
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Create Company Card */}
        <Link
          href="/dashboard/companies/new"
          className="bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 transition-all cursor-pointer min-h-[200px]"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-medium text-sm">Create New Company</span>
        </Link>
      </div>

      {/* Empty state */}
      {companies.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies yet</h3>
          <p className="text-slate-500 mb-6">Create your first company to get started with PostPilot.</p>
          <Link
            href="/dashboard/companies/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Create Company
          </Link>
        </div>
      )}
    </div>
  )
}
