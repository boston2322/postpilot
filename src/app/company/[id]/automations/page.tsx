'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import PlatformIcon from '@/components/PlatformIcon'
import Badge from '@/components/Badge'

type Automation = {
  id: string
  name: string
  description: string | null
  platforms: string[]
  frequency: string
  postingTime: string
  timezone: string
  isActive: boolean
  contentType: string
  aiPrompt: string | null
  nextRunAt: string | null
  lastRunAt: string | null
  config?: {
    postType?: 'SINGLE' | 'CAROUSEL'
    numSlides?: number
    maxCharsPerSlide?: number | null
    alwaysIncludeImage?: boolean
  }
}

type UpcomingPost = {
  id: string
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  isAiGenerated: boolean
  creator: { id: string; name: string; avatar: string | null }
}

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'X', 'LINKEDIN', 'TIKTOK', 'YOUTUBE']
const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

const CHAR_LIMIT_OPTIONS = [
  { value: '150', label: '150 chars (short)' },
  { value: '300', label: '300 chars (medium)' },
  { value: '500', label: '500 chars (long)' },
  { value: '', label: 'Unlimited' },
]

export default function AutomationsPage() {
  const params = useParams()
  const companyId = params.id as string

  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    platforms: [] as string[],
    frequency: 'WEEKLY',
    postingTime: '09:00',
    timezone: 'UTC',
    contentType: 'ai',
    aiPrompt: '',
    config: {
      postType: 'SINGLE' as 'SINGLE' | 'CAROUSEL',
      numSlides: 3,
      maxCharsPerSlide: '' as string,
      alwaysIncludeImage: false,
    },
  })
  const [saving, setSaving] = useState(false)

  // Upcoming posts
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upcomingError, setUpcomingError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/automations`)
    if (res.ok) {
      const { automations } = await res.json()
      setAutomations(automations)
    }
    setLoading(false)
  }

  async function loadUpcoming() {
    setUpcomingLoading(true)
    try {
      const res = await fetch(
        `/api/companies/${companyId}/posts?status=SCHEDULED&limit=10`
      )
      if (res.ok) {
        const data = await res.json()
        // Also fetch PENDING_APPROVAL
        const res2 = await fetch(
          `/api/companies/${companyId}/posts?status=PENDING_APPROVAL&limit=10`
        )
        let combined: UpcomingPost[] = data.posts || []
        if (res2.ok) {
          const data2 = await res2.json()
          combined = [...combined, ...(data2.posts || [])]
        }
        // Filter to only AI-generated posts and sort by scheduledFor
        const aiPosts = combined
          .filter((p: UpcomingPost) => p.isAiGenerated)
          .sort((a: UpcomingPost, b: UpcomingPost) => {
            if (!a.scheduledFor) return 1
            if (!b.scheduledFor) return -1
            return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          })
          .slice(0, 10)
        setUpcomingPosts(aiPosts)
      }
    } catch {
      setUpcomingError('Failed to load upcoming posts')
    }
    setUpcomingLoading(false)
  }

  useEffect(() => {
    load()
    loadUpcoming()
  }, [companyId])

  function openCreate() {
    setEditingId(null)
    setForm({
      name: '', description: '', platforms: [], frequency: 'WEEKLY',
      postingTime: '09:00', timezone: 'UTC', contentType: 'ai', aiPrompt: '',
      config: { postType: 'SINGLE', numSlides: 3, maxCharsPerSlide: '', alwaysIncludeImage: false },
    })
    setModalOpen(true)
  }

  function openEdit(automation: Automation) {
    setEditingId(automation.id)
    setForm({
      name: automation.name,
      description: automation.description || '',
      platforms: automation.platforms,
      frequency: automation.frequency,
      postingTime: automation.postingTime,
      timezone: automation.timezone,
      contentType: automation.contentType,
      aiPrompt: automation.aiPrompt || '',
      config: {
        postType: automation.config?.postType || 'SINGLE',
        numSlides: automation.config?.numSlides || 3,
        maxCharsPerSlide: automation.config?.maxCharsPerSlide != null
          ? String(automation.config.maxCharsPerSlide)
          : '',
        alwaysIncludeImage: automation.config?.alwaysIncludeImage || false,
      },
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editingId
      ? `/api/companies/${companyId}/automations/${editingId}`
      : `/api/companies/${companyId}/automations`
    const method = editingId ? 'PUT' : 'POST'

    const payload = {
      ...form,
      config: {
        ...form.config,
        maxCharsPerSlide: form.config.maxCharsPerSlide
          ? Number(form.config.maxCharsPerSlide)
          : null,
      },
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setModalOpen(false)
      await load()
    }
    setSaving(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/companies/${companyId}/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this automation?')) return
    await fetch(`/api/companies/${companyId}/automations/${id}`, { method: 'DELETE' })
    await load()
  }

  function togglePlatform(p: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }))
  }

  async function handleApprove(postId: string) {
    setApprovingId(postId)
    setUpcomingError('')
    try {
      const res = await fetch(`/api/companies/${companyId}/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        await loadUpcoming()
      } else {
        setUpcomingError('Failed to approve post')
      }
    } finally {
      setApprovingId(null)
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post?')) return
    setDeletingId(postId)
    setUpcomingError('')
    try {
      const res = await fetch(`/api/companies/${companyId}/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        setUpcomingPosts((prev) => prev.filter((p) => p.id !== postId))
      } else {
        setUpcomingError('Failed to delete post')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Automations Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="text-slate-500 mt-0.5">Schedule automatic AI-generated content</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Automation
        </button>
      </div>

      {/* Automations List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No automations yet</h3>
          <p className="text-slate-400 text-sm mb-4">Set up automated posting to save time.</p>
          <button onClick={openCreate} className="text-sm text-indigo-600 hover:underline">
            Create first automation →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => (
            <div key={auto.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{auto.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      auto.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {auto.isActive ? 'Active' : 'Paused'}
                    </span>
                    {auto.contentType === 'ai' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
                    )}
                    {auto.config?.postType === 'CAROUSEL' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Carousel ({auto.config.numSlides} slides)
                      </span>
                    )}
                  </div>
                  {auto.description && <p className="text-sm text-slate-500 mb-3">{auto.description}</p>}

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      🔁 {auto.frequency.charAt(0) + auto.frequency.slice(1).toLowerCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      🕐 {auto.postingTime} {auto.timezone}
                    </span>
                    {auto.nextRunAt && (
                      <span className="flex items-center gap-1">
                        📅 Next: {new Date(auto.nextRunAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5 mt-3">
                    {auto.platforms.map((p) => (
                      <div key={p} className="bg-slate-100 rounded-lg p-1">
                        <PlatformIcon platform={p} className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(auto.id, auto.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      auto.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      auto.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>

                  <button
                    onClick={() => openEdit(auto)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upcoming Posts Section ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming Posts</h2>
            <p className="text-slate-500 text-sm mt-0.5">AI-generated posts pending or scheduled</p>
          </div>
          <button
            onClick={loadUpcoming}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {upcomingError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {upcomingError}
          </div>
        )}

        {upcomingLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : upcomingPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <h3 className="text-sm font-semibold text-slate-600 mb-1">No upcoming posts</h3>
            <p className="text-xs text-slate-400">AI automations will queue posts here for review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Post row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                >
                  <div className="flex-shrink-0">
                    <PlatformIcon platform={post.platform} className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">
                      {post.content.slice(0, 50)}{post.content.length > 50 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {post.scheduledFor && (
                        <span className="text-xs text-slate-400">
                          {new Date(post.scheduledFor).toLocaleDateString()} {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {post.isAiGenerated && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">AI</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={post.status} />
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${expandedPostId === post.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedPostId === post.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/company/${companyId}/posts/${post.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </Link>

                      {post.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleApprove(post.id)}
                          disabled={approvingId === post.id}
                          className="text-xs text-green-700 font-medium border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {approvingId === post.id ? (
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : null}
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        className="text-xs text-red-500 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === post.id ? 'Deleting...' : 'Cancel / Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Automation' : 'Create Automation'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="Weekly Tips"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="Post weekly industry tips"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Platforms *</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                    form.platforms.includes(p)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <PlatformIcon platform={p} className="w-4 h-4" />
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Posting Time</label>
              <input
                type="time"
                value={form.postingTime}
                onChange={(e) => setForm({ ...form, postingTime: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Post Type section */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700">Post Settings</h4>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Post Type</label>
              <div className="flex gap-2">
                {(['SINGLE', 'CAROUSEL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, config: { ...f.config, postType: type } }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all ${
                      form.config.postType === type
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {type === 'SINGLE' ? 'Single Post' : 'Carousel'}
                  </button>
                ))}
              </div>
            </div>

            {form.config.postType === 'CAROUSEL' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Number of Slides: {form.config.numSlides}
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={form.config.numSlides}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, config: { ...f.config, numSlides: Number(e.target.value) } }))
                  }
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>2</span><span>6</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Max text per slide</label>
              <select
                value={form.config.maxCharsPerSlide}
                onChange={(e) =>
                  setForm((f) => ({ ...f, config: { ...f.config, maxCharsPerSlide: e.target.value } }))
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                {CHAR_LIMIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">Always include image</label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    config: { ...f.config, alwaysIncludeImage: !f.config.alwaysIncludeImage },
                  }))
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.config.alwaysIncludeImage ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.config.alwaysIncludeImage ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">AI Prompt / Instructions</label>
            <textarea
              value={form.aiPrompt}
              onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
              placeholder="e.g. Post about industry trends, tips, or product highlights. Keep it engaging and educational."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.name || form.platforms.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : editingId ? 'Save Changes' : 'Create Automation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
