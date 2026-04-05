'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Stats = {
  totalUsers: number
  totalCompanies: number
  postsToday: number
  totalPosts: number
  activeSubscriptions: number
  monthlyRevenue: number
}

type User = {
  id: string
  name: string
  email: string
  createdAt: string
  isAdmin: boolean
}

type Company = {
  id: string
  name: string
  createdAt: string
  subscription: { plan: string; status: string } | null
  _count: { members: number }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(({ stats, recentUsers, recentCompanies }) => {
        setStats(stats)
        setRecentUsers(recentUsers)
        setRecentCompanies(recentCompanies)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Companies', value: stats?.totalCompanies || 0, icon: '🏢', color: 'bg-purple-50 text-purple-600' },
          { label: 'Posts Today', value: stats?.postsToday || 0, icon: '📝', color: 'bg-green-50 text-green-600' },
          { label: 'Total Posts', value: stats?.totalPosts || 0, icon: '📊', color: 'bg-orange-50 text-orange-600' },
          { label: 'Active Subscriptions', value: stats?.activeSubscriptions || 0, icon: '💳', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Monthly Revenue', value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Signups</h2>
            <Link href="/admin/users" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.isAdmin && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Companies</h2>
            <Link href="/admin/companies" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600">
                  {company.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{company.name}</p>
                  <p className="text-xs text-slate-400">{company._count.members} members</p>
                </div>
                <div className="flex items-center gap-2">
                  {company.subscription && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                      {company.subscription.plan}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
