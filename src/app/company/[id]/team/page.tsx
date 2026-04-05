'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PLANS } from '@/lib/plans'

type Member = {
  id: string
  userId: string
  role: string
  canApprove: boolean
  joinedAt: string
  user: { id: string; name: string; email: string; avatar: string | null }
}

type Subscription = {
  plan: string
  status: string
}

const ROLES = ['OWNER', 'MANAGER', 'EDITOR', 'VIEWER']

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-indigo-100 text-indigo-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-600',
}

export default function TeamPage() {
  const params = useParams()
  const companyId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; isAdmin: boolean } | null>(null)
  const [myRole, setMyRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  async function load() {
    setLoading(true)
    const [meRes, membersRes, companyRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch(`/api/companies/${companyId}/team`),
      fetch(`/api/companies/${companyId}`),
    ])

    if (meRes.ok) {
      const { user } = await meRes.json()
      setCurrentUser(user)
    }
    if (membersRes.ok) {
      const { members } = await membersRes.json()
      setMembers(members)
    }
    if (companyRes.ok) {
      const { company } = await companyRes.json()
      setSubscription(company.subscription)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [companyId])

  useEffect(() => {
    if (currentUser && members.length > 0) {
      const me = members.find((m) => m.userId === currentUser.id)
      if (me) setMyRole(me.role)
    }
  }, [currentUser, members])

  const isOwner = myRole === 'OWNER' || currentUser?.isAdmin

  const seatLimit = subscription
    ? PLANS[subscription.plan as keyof typeof PLANS]?.seats || 2
    : 2

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)

    const res = await fetch(`/api/companies/${companyId}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })

    const data = await res.json()

    if (!res.ok) {
      setInviteError(data.error || 'Failed to add member')
    } else {
      setInviteSuccess(`${inviteEmail} added successfully!`)
      setInviteEmail('')
      await load()
    }
    setInviteLoading(false)
  }

  async function handleRoleChange(memberId: string, role: string) {
    await fetch(`/api/companies/${companyId}/team/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    await load()
  }

  async function handleToggleApprove(memberId: string, canApprove: boolean) {
    await fetch(`/api/companies/${companyId}/team/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canApprove: !canApprove }),
    })
    await load()
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member?')) return
    await fetch(`/api/companies/${companyId}/team/${memberId}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-slate-500 mt-0.5">
          {members.length} / {seatLimit} seats used
        </p>
      </div>

      {/* Seat usage bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Seat Usage</span>
          <span className="text-sm text-slate-500">{members.length} / {seatLimit}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              members.length >= seatLimit ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min((members.length / seatLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Invite form (owner only) */}
      {isOwner && members.length < seatLimit && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Invite Team Member</h2>
          {inviteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-red-700 text-sm">{inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-green-700 text-sm">{inviteSuccess}</div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="colleague@company.com"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            >
              {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={inviteLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {inviteLoading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            The user must already have a PostPilot account. They will be added immediately.
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Team Members</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-semibold text-indigo-600 flex-shrink-0">
                  {member.user.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm">{member.user.name}</p>
                    {member.userId === currentUser?.id && (
                      <span className="text-xs text-slate-400">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role badge / selector */}
                  {isOwner && member.userId !== currentUser?.id && member.role !== 'OWNER' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[member.role]}`}>
                      {member.role}
                    </span>
                  )}

                  {/* Can approve toggle */}
                  {isOwner && member.role !== 'OWNER' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Approve</span>
                      <button
                        onClick={() => handleToggleApprove(member.id, member.canApprove)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          member.canApprove ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          member.canApprove ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  )}

                  {/* Remove */}
                  {isOwner && member.userId !== currentUser?.id && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role descriptions */}
      <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { role: 'OWNER', desc: 'Full access. Manage billing, team, and all content.' },
            { role: 'MANAGER', desc: 'Approve posts, manage team (except owner actions).' },
            { role: 'EDITOR', desc: 'Create and edit posts. Cannot approve.' },
            { role: 'VIEWER', desc: 'Read-only access to all content.' },
          ].map(({ role, desc }) => (
            <div key={role} className="flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium h-fit ${ROLE_COLORS[role]}`}>{role}</span>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
