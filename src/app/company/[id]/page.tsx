'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Badge from '@/components/Badge'
import PlatformIcon from '@/components/PlatformIcon'

type Post = {
  id: string
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  createdAt: string
  creator: { name: string }
}

type SocialAccount = {
  id: string
  platform: string
  accountName: string
}

type Company = {
  id: string
  name: string
  subscription: { plan: string; status: string; postsUsedThisMonth: number } | null
}

type Automation = {
  id: string
  name: string
  isActive: boolean
}

export default function CompanyDashboard() {
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [companyRes, postsRes, accountsRes, automationsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/companies/${companyId}/posts?limit=5`),
        fetch(`/api/social/accounts?companyId=${companyId}`),
        fetch(`/api/companies/${companyId}/automations`),
      ])

      if (companyRes.ok) {
        const { company } = await companyRes.json()
        setCompany(company)
      }
      if (postsRes.ok) {
        const { posts } = await postsRes.json()
        setPosts(posts)
      }
      if (accountsRes.ok) {
        const { accounts } = await accountsRes.json()
        setAccounts(accounts)
      }
      if (automationsRes.ok) {
        const { automations } = await automationsRes.json()
        setAutomations(automations)
      }
      setLoading(false)
    }
    load()
  }, [companyId])

  const pendingApproval = posts.filter((p) => p.status === 'PENDING_APPROVAL').length
  const scheduled = posts.filter((p) => p.status === 'SCHEDULED').length
  const published = posts.filter((p) => p.status === 'PUBLISHED').length
  const activeAutomations = automations.filter((a) => a.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{company?.name}</h1>
        <p className="text-slate-500 mt-1">Company overview and recent activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Posts This Month',
            value: company?.subscription?.postsUsedThisMonth || 0,
            icon: '📊',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            href: `/company/${companyId}/posts`,
          },
          {
            label: 'Pending Approval',
            value: pendingApproval,
            icon: '⏳',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            href: `/company/${companyId}/posts?status=PENDING_APPROVAL`,
          },
          {
            label: 'Scheduled',
            value: scheduled,
            icon: '🗓',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            href: `/company/${companyId}/calendar`,
          },
          {
            label: 'Active Automations',
            value: activeAutomations,
            icon: '⚡',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: `/company/${companyId}/automations`,
          },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {kpi.icon}
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{kpi.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Posts</h2>
            <Link href={`/company/${companyId}/posts`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No posts yet.</p>
                <Link href={`/company/${companyId}/posts/new`} className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                  Create your first post →
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5">
                    <PlatformIcon platform={post.platform} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{post.content}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{post.creator.name}</p>
                  </div>
                  <Badge status={post.status} />
                </div>
              ))
            )}
          </div>
          {posts.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <Link
                href={`/company/${companyId}/posts/new`}
                className="w-full block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                + Create New Post
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Connected Accounts */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Connected Accounts</h2>
              <Link href={`/company/${companyId}/settings`} className="text-xs text-indigo-600 hover:text-indigo-700">
                Manage
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {accounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-2">No accounts connected</p>
                  <Link href={`/company/${companyId}/settings`} className="text-xs text-indigo-600 hover:underline">
                    Connect accounts →
                  </Link>
                </div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-3 py-1">
                    <PlatformIcon platform={account.platform} className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{account.accountName}</p>
                      <p className="text-xs text-slate-400">{account.platform}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: `/company/${companyId}/posts/new`, label: 'Create Post', icon: '✏️' },
                { href: `/company/${companyId}/automations`, label: 'New Automation', icon: '⚡' },
                { href: `/company/${companyId}/team`, label: 'Manage Team', icon: '👥' },
                { href: `/company/${companyId}/settings`, label: 'Settings', icon: '⚙️' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 w-full text-left text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-all"
                >
                  <span>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
