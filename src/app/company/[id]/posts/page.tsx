'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/Badge'
import PlatformIcon from '@/components/PlatformIcon'
import PhonePreview from '@/components/PhonePreview'

type Slide = {
  title: string
  content: string
  mediaUrl?: string
  imagePrompt?: string
  order?: number
}

type Post = {
  id: string
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  createdAt: string
  isAiGenerated: boolean
  postType: string
  hashtags: string[]
  mediaUrls: string[]
  slides?: Slide[]
  failureReason: string | null
  creator: { id: string; name: string; avatar: string | null }
  approver: { id: string; name: string } | null
  socialAccount: { id: string; platform: string; accountName: string } | null
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

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function PostDetail({
  post,
  canApprove,
  currentUserId,
  member,
  companyId,
  onClose,
  onAction,
}: {
  post: Post
  canApprove: boolean
  currentUserId: string
  member: Member | null
  companyId: string
  onClose: () => void
  onAction: () => void
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)

  const slides = Array.isArray(post.slides) ? post.slides : []
  const currentSlide = slides[slideIndex]

  const previewMediaUrl = post.postType === 'CAROUSEL'
    ? (currentSlide?.mediaUrl || '')
    : (post.mediaUrls?.[0] || '')

  async function handleApprove(action: 'approve' | 'reject') {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/companies/${companyId}/posts/${post.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) { onAction(); onClose() }
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePostNow() {
    setActionLoading('postnow')
    try {
      const res = await fetch(`/api/social/publish/${post.id}`, { method: 'POST' })
      if (res.ok) {
        onAction()
        onClose()
      } else {
        // On failure, refresh the list so the updated failureReason is shown
        onAction()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setActionLoading('delete')
    try {
      await fetch(`/api/companies/${companyId}/posts/${post.id}`, { method: 'DELETE' })
      onAction()
      onClose()
    } finally {
      setActionLoading(null)
    }
  }

  const canDelete =
    member?.role === 'OWNER' ||
    member?.role === 'MANAGER' ||
    post.creator.id === currentUserId

  const canPostNow =
    (post.status === 'APPROVED' || post.status === 'SCHEDULED') &&
    !!post.socialAccount &&
    canApprove

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={post.platform} className="w-5 h-5" />
            <span className="font-semibold text-slate-800 capitalize">{post.platform.toLowerCase()} Post</span>
            <Badge status={post.status} />
            {post.isAiGenerated && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">AI</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Phone Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 px-8 py-6 border-r border-slate-200 w-72 flex-shrink-0">
            <PhonePreview
              platform={post.platform}
              content={post.content}
              mediaUrl={previewMediaUrl}
              hashtags={post.hashtags || []}
              postType={post.postType as 'SINGLE' | 'CAROUSEL' | 'VIDEO'}
              slides={slides}
            />

            {/* Carousel slide nav */}
            {post.postType === 'CAROUSEL' && slides.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
                  disabled={slideIndex === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  ‹
                </button>
                <span className="text-xs text-slate-500">{slideIndex + 1} / {slides.length}</span>
                <button
                  onClick={() => setSlideIndex(i => Math.min(slides.length - 1, i + 1))}
                  disabled={slideIndex === slides.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Timing */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              {post.status === 'PUBLISHED' && post.publishedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-slate-500">Published</span>
                  <span className="font-medium text-slate-800">{formatDateTime(post.publishedAt)}</span>
                </div>
              )}
              {post.scheduledFor && post.status !== 'PUBLISHED' && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📅</span>
                  <span className="text-slate-500">Scheduled for</span>
                  <span className="font-medium text-slate-800">{formatDateTime(post.scheduledFor)}</span>
                </div>
              )}
              {!post.scheduledFor && post.status !== 'PUBLISHED' && (
                <div className="flex items-center gap-2 text-sm">
                  <span>⚡</span>
                  <span className="text-slate-500">Posts immediately on approval</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span>🕐</span>
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700">{formatDateTime(post.createdAt)}</span>
              </div>
            </div>

            {/* Caption */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Caption</h3>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Slides summary */}
            {post.postType === 'CAROUSEL' && slides.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Slides ({slides.length})
                </h3>
                <div className="space-y-2">
                  {slides.map((slide, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        slideIndex === i
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-slate-700">{i + 1}. {slide.title}</span>
                      {slide.content && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{slide.content}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image */}
            {post.mediaUrls && post.mediaUrls.length > 0 && post.postType !== 'CAROUSEL' && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Image</h3>
                <img
                  src={post.mediaUrls[0]}
                  alt="Post image"
                  className="rounded-xl border border-slate-200 max-h-48 object-cover w-full"
                />
              </div>
            )}

            {/* People */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">People</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-16 text-slate-400">Created by</span>
                  <div className="flex items-center gap-1.5">
                    {post.creator.avatar ? (
                      <img src={post.creator.avatar} className="w-5 h-5 rounded-full" alt="" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {post.creator.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-slate-700">{post.creator.name}</span>
                  </div>
                </div>
                {post.approver && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-16 text-slate-400">Approved by</span>
                    <span className="text-slate-700">{post.approver.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social account */}
            {post.socialAccount && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Account</h3>
                <div className="flex items-center gap-2 text-sm">
                  <PlatformIcon platform={post.socialAccount.platform} className="w-4 h-4" />
                  <span className="text-slate-700">{post.socialAccount.accountName}</span>
                </div>
              </div>
            )}

            {/* Failure reason */}
            {post.status === 'FAILED' && post.failureReason && (() => {
              let err: { code?: string; message?: string; hint?: string; raw?: string } = {}
              try { err = JSON.parse(post.failureReason) } catch { err = { message: post.failureReason, raw: post.failureReason } }
              const showRaw = err.raw && err.raw !== err.hint
              return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide">Publishing Failed</h3>
                    {err.code && (
                      <span className="text-[10px] font-mono bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                        {err.code}
                      </span>
                    )}
                  </div>
                  <p className="text-red-700 text-sm font-medium">{err.message || post.failureReason}</p>
                  {err.hint && (
                    <p className="text-red-500 text-xs leading-relaxed">{err.hint}</p>
                  )}
                  {showRaw && (
                    <details className="mt-1">
                      <summary className="text-[11px] text-red-400 cursor-pointer hover:text-red-600 select-none">Technical details</summary>
                      <p className="mt-1 text-[11px] font-mono text-red-400 break-all bg-red-100 rounded p-2">{err.raw}</p>
                    </details>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {post.status === 'PENDING_APPROVAL' && canApprove && (
              <>
                <button
                  onClick={() => handleApprove('reject')}
                  disabled={!!actionLoading}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? 'Rejecting…' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove('approve')}
                  disabled={!!actionLoading}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'approve' ? 'Approving…' : post.socialAccount && !post.scheduledFor ? 'Approve & Post Now' : 'Approve'}
                </button>
              </>
            )}
            {canPostNow && post.status !== 'PENDING_APPROVAL' && post.status !== 'FAILED' && (
              <button
                onClick={handlePostNow}
                disabled={!!actionLoading}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === 'postnow' ? 'Posting…' : 'Post Now'}
              </button>
            )}
            {post.status === 'FAILED' && !!post.socialAccount && canApprove && (
              <button
                onClick={handlePostNow}
                disabled={!!actionLoading}
                className="flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === 'postnow' ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Retrying…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  async function load() {
    setLoading(true)
    const [postsRes, meRes, companyRes] = await Promise.all([
      fetch(`/api/companies/${companyId}/posts${statusFilter ? `?status=${statusFilter}` : ''}`),
      fetch('/api/auth/me'),
      fetch(`/api/companies/${companyId}`),
    ])

    let userId = currentUserId
    if (meRes.ok) {
      const { user } = await meRes.json()
      userId = user.id
      setCurrentUserId(user.id)
    }
    if (companyRes.ok) {
      const { company } = await companyRes.json()
      const me = company.members.find((m: { userId: string }) => m.userId === userId) ||
        company.members[0]
      setMember(me)
    }
    if (postsRes.ok) {
      const data = await postsRes.json()
      setPosts(data.posts)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [companyId, statusFilter])

  // Refresh selected post data after an action
  function handleAction() {
    load()
    setSelectedPost(null)
  }

  async function handleQuickApprove(e: React.MouseEvent, postId: string, action: 'approve' | 'reject') {
    e.stopPropagation()
    setActionLoading(postId)
    try {
      const res = await fetch(`/api/companies/${companyId}/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) await load()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleQuickDelete(e: React.MouseEvent, postId: string) {
    e.stopPropagation()
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
            onClick={() =>
              router.push(
                tab.value
                  ? `/company/${companyId}/posts?status=${tab.value}`
                  : `/company/${companyId}/posts`
              )
            }
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
            {statusFilter
              ? `No posts with status "${statusFilter}"`
              : 'Create your first post to get started.'}
          </p>
          <Link
            href={`/company/${companyId}/posts/new`}
            className="text-sm text-indigo-600 hover:underline"
          >
            Create a post →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="mt-1 flex-shrink-0 relative">
                  <PlatformIcon platform={post.platform} className="w-6 h-6" />
                  {post.postType === 'CAROUSEL' && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm leading-relaxed line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-400">by {post.creator.name}</span>
                    {post.scheduledFor && (
                      <span className="text-xs text-slate-400">
                        📅 {new Date(post.scheduledFor).toLocaleDateString()}{' '}
                        {new Date(post.scheduledFor).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {!post.scheduledFor && post.status === 'PENDING_APPROVAL' && (
                      <span className="text-xs text-orange-500">⚡ Posts immediately on approval</span>
                    )}
                    {post.isAiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                    {post.postType !== 'SINGLE' && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                        {post.postType.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge status={post.status} />

                  {post.status === 'PENDING_APPROVAL' && canApprove && (
                    <>
                      <button
                        onClick={(e) => handleQuickApprove(e, post.id, 'approve')}
                        disabled={actionLoading === post.id}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === post.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={(e) => handleQuickApprove(e, post.id, 'reject')}
                        disabled={actionLoading === post.id}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {(member?.role === 'OWNER' ||
                    member?.role === 'MANAGER' ||
                    post.creator.id === currentUserId) && (
                    <button
                      onClick={(e) => handleQuickDelete(e, post.id)}
                      disabled={actionLoading === post.id}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* Chevron hint */}
                  <svg
                    className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Slide-over */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          canApprove={!!canApprove}
          currentUserId={currentUserId}
          member={member}
          companyId={companyId}
          onClose={() => setSelectedPost(null)}
          onAction={handleAction}
        />
      )}
    </div>
  )
}
