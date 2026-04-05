'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  createdAt: string
  subscription: {
    plan: string
    status: string
    postsUsedThisMonth: number
  } | null
  _count: { members: number; posts: number }
  members: {
    role: string
    user: { id: string; name: string; email: string }
  }[]
}

const PLANS = ['STARTER', 'GROWTH', 'PRO']

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAST_DUE: 'bg-yellow-100 text-yellow-700',
  CANCELED: 'bg-red-100 text-red-700',
  TRIALING: 'bg-blue-100 text-blue-700',
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/companies')
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.companies)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handlePlanChange(companyId: string, plan: string) {
    setActionLoading(companyId)
    await fetch(`/api/admin/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    await load()
    setActionLoading(null)
  }

  async function handleDelete(companyId: string, name: string) {
    if (!confirm(`Delete company "${name}"? This will delete all posts, automations, and data. Cannot be undone.`)) return
    setActionLoading(companyId)
    await fetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' })
    await load()
    setActionLoading(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="text-slate-500 mt-0.5">{total} total companies</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Owner</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Posts/Members</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Created</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No companies found</td>
                </tr>
              ) : companies.map((company) => {
                const owner = company.members.find((m) => m.role === 'OWNER')
                return (
                  <tr key={company.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600">
                          {company.name[0]}
                        </div>
                        <Link href={`/company/${company.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                          {company.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {owner ? (
                        <div>
                          <p className="text-sm text-slate-700">{owner.user.name}</p>
                          <p className="text-xs text-slate-400">{owner.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No owner</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {company.subscription ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={company.subscription.plan}
                            onChange={(e) => handlePlanChange(company.id, e.target.value)}
                            disabled={actionLoading === company.id}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full w-fit ${STATUS_COLORS[company.subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                            {company.subscription.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No subscription</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-600">
                        <span>{company._count.posts} posts</span>
                        <span className="mx-1">·</span>
                        <span>{company._count.members} members</span>
                      </div>
                      {company.subscription && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {company.subscription.postsUsedThisMonth} this month
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/company/${company.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          disabled={actionLoading === company.id}
                          className="text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
