'use client'

import { useState, useEffect } from 'react'

type User = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  isSuspended: boolean
  createdAt: string
  companies: {
    id: string
    name: string
    role: string
    subscription: { plan: string } | null
  }[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function handleSuspend(userId: string, isSuspended: boolean) {
    setActionLoading(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: !isSuspended }),
    })
    await load()
    setActionLoading(null)
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    setActionLoading(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    })
    await load()
    setActionLoading(null)
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return
    setActionLoading(userId)
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    await load()
    setActionLoading(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput)
            }}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="Search by name or email..."
          />
          <button
            onClick={() => setSearch(searchInput)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput('') }}
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Companies</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">No users found</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className={user.isSuspended ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          {user.isAdmin && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.companies.length === 0 ? (
                      <span className="text-xs text-slate-400">No companies</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.companies.slice(0, 2).map((c) => (
                          <span key={c.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {c.name}
                          </span>
                        ))}
                        {user.companies.length > 2 && (
                          <span className="text-xs text-slate-400">+{user.companies.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSuspend(user.id, user.isSuspended)}
                        disabled={actionLoading === user.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          user.isSuspended
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                        }`}
                      >
                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        disabled={actionLoading === user.id}
                        className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={actionLoading === user.id}
                        className="text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
