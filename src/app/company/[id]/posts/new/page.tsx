'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PlatformIcon from '@/components/PlatformIcon'
import Modal from '@/components/Modal'

type SocialAccount = {
  id: string
  platform: string
  accountName: string
}

const PLATFORM_LIMITS: Record<string, number> = {
  INSTAGRAM: 2200,
  X: 280,
  LINKEDIN: 3000,
  TIKTOK: 300,
  FACEBOOK: 63206,
  YOUTUBE: 5000,
}

export default function NewPostPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [platform, setPlatform] = useState<string>('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtagsStr] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiTone, setAiTone] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(false)

  useEffect(() => {
    fetch(`/api/social/accounts?companyId=${companyId}`)
      .then((r) => r.json())
      .then(({ accounts }) => {
        setAccounts(accounts || [])
      })
  }, [companyId])

  function handleAccountSelect(accountId: string) {
    setSelectedAccount(accountId)
    const account = accounts.find((a) => a.id === accountId)
    if (account) setPlatform(account.platform)
  }

  async function handleAiGenerate() {
    if (!platform) {
      alert('Please select a platform first')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, platform, topic: aiTopic, tone: aiTone }),
      })
      const data = await res.json()
      if (res.ok) {
        setContent(data.content)
        setHashtagsStr(data.hashtags.join(', '))
        setIsAiGenerated(true)
        setAiModalOpen(false)
      } else {
        alert(data.error || 'Failed to generate content')
      }
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const hashtagsArray = hashtags
        ? hashtags.split(',').map((h) => h.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const res = await fetch(`/api/companies/${companyId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platform,
          scheduledFor: scheduledFor || null,
          isAiGenerated,
          hashtags: hashtagsArray,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          socialAccountId: selectedAccount || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create post')
        return
      }

      router.push(`/company/${companyId}/posts`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const charLimit = platform ? (PLATFORM_LIMITS[platform] || 2200) : 2200
  const charCount = content.length
  const charPercent = Math.min((charCount / charLimit) * 100, 100)
  const charColor = charPercent > 90 ? 'text-red-500' : charPercent > 70 ? 'text-yellow-500' : 'text-slate-400'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/company/${companyId}/posts`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Posts
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create New Post</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Platform / Account Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Social Account <span className="text-red-500">*</span>
            </label>
            {accounts.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400 mb-2">No social accounts connected</p>
                <Link href={`/company/${companyId}/settings`} className="text-sm text-indigo-600 hover:underline">
                  Connect accounts →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleAccountSelect(account.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedAccount === account.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <PlatformIcon platform={account.platform} className="w-5 h-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{account.accountName}</p>
                      <p className="text-xs text-slate-400">{account.platform}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Content <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <span>✦</span> AI Generate
              </button>
            </div>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={charLimit}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all text-sm"
              placeholder="Write your post content here..."
            />
            <div className="flex items-center justify-between mt-1">
              {isAiGenerated && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI Generated - will require approval</span>
              )}
              <span className={`text-xs ml-auto ${charColor}`}>
                {charCount} / {charLimit}
              </span>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtagsStr(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
              placeholder="marketing, socialmedia, growth (comma separated)"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Schedule For (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
            />
          </div>

          {/* Media URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {isAiGenerated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm">
              <strong>Note:</strong> AI-generated posts require approval before scheduling. This post will be created with &quot;Pending Approval&quot; status.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href={`/company/${companyId}/posts`}
              className="flex-1 text-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !platform}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : scheduledFor ? (
                'Schedule Post'
              ) : (
                'Save Post'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Generate Modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI Generate Post">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Our AI will generate a post tailored to your brand voice and the selected platform.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic or Focus (optional)</label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="e.g. product launch, tip of the week, behind the scenes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tone (optional)</label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            >
              <option value="">Use brand tone</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual & Friendly</option>
              <option value="witty">Witty & Fun</option>
              <option value="inspirational">Inspirational</option>
              <option value="educational">Educational</option>
              <option value="promotional">Promotional</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAiModalOpen(false)}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>✦ Generate</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
