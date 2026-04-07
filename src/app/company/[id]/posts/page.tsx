'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/Badge'
import PlatformIcon from '@/components/PlatformIcon'

type Post = {
  id: string
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  createdAt: string
  isAiGenerated: boolean
  creator: { id: string; name: string; avatar: string | null }
  approver: { name: string } | null
}

type Member = {
  role: string
  canApprove: boolean
  userId: string
}

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Failed', value: 'FAILED' },
]

export default function PostsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const companyId = params.id as string
  const statusFilter = searchParams.get('status') || ''

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [postsRes, meRes, companyRes] = await Promise.all([
      fetch(`/api/companies/${companyId}/posts${statusFilter ? `?status=${statusFilter}` : ''}`),
      fetch('/api/auth/me'),
      fetch(`/api/companies/${companyId}`),
    ])

    if (postsRes.ok) {
      const data = await postsRes.json()
      setPosts(data.posts)
      setTotal(data.total)
    }
    if (meRes.ok) {
      const { user } = await meRes.json()
      setCurrentUserId(user.id)
    }
    if (companyRes.ok) {
      const { company } = await companyRes.json()
      const me = company.members.find((m: any) => m.userId === currentUserId) ||
        company.members[0]
      setMember(me)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [companyId, statusFilter])

  async function handleApprove(postId: string, action: 'approve' | 'reject') {
    setActionLoading(postId)
    try {
      const res = await fetch(`/api/companies/${companyId}/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        await load()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post?')) return
    setActionLoading(postId)
    try {
      await fetch(`/api/companies/${companyId}/posts/${postId}`, { method: 'DELETE' })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const canApprove = member?.canApprove || member?.role === 'OWNER' || member?.role === 'MANAGER'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
          <p className="text-slate-500 mt-0.5">{total} total posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/company/${companyId}/posts/ai-wizard`}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm"
          >
            <span className="text-sm">✦</span>
            Create with AI
          </Link>
          <Link
            href={`/company/${companyId}/posts/new`}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manual
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => router.push(tab.value ? `/company/${companyId}/posts?status=${tab.value}` : `/company/${companyId}/posts`)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No posts found</h3>
          <p className="text-slate-400 text-sm mb-4">
            {statusFilter ? `No posts with status "${statusFilter}"` : 'Create your first post to get started.'}
          </p>
          <Link href={`/company/${companyId}/posts/new`} className="text-sm text-indigo-600 hover:underline">
            Create a post →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <PlatformIcon platform={post.platform} className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm leading-relaxed line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">by {post.creator.name}</span>
                    {post.scheduledFor && (
                      <span className="text-xs text-slate-400">
                        📅 {new Date(post.scheduledFor).toLocaleDateString()} {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {post.isAiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge status={post.status} />

                  {/* Approve/Reject buttons for pending posts */}
                  {post.status === 'PENDING_APPROVAL' && canApprove && (
                    <>
                      <button
                        onClick={() => handleApprove(post.id, 'approve')}
                        disabled={actionLoading === post.id}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(post.id, 'reject')}
                        disabled={actionLoading === post.id}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* Delete button */}
                  {(member?.role === 'OWNER' || member?.role === 'MANAGER' || post.creator.id === currentUserId) && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={actionLoading === post.id}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
