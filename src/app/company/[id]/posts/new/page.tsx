'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PlatformIcon from '@/components/PlatformIcon'
import Modal from '@/components/Modal'
import ImagePicker from '@/components/ImagePicker'

type SocialAccount = {
  id: string
  platform: string
  accountName: string
}

type Slide = {
  id: string
  content: string
  mediaUrl: string
}

type PostType = 'SINGLE' | 'CAROUSEL' | 'VIDEO'

const PLATFORM_LIMITS: Record<string, number> = {
  INSTAGRAM: 2200,
  X: 280,
  LINKEDIN: 3000,
  TIKTOK: 300,
  FACEBOOK: 63206,
  YOUTUBE: 5000,
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function SpinnerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Phone Mockup Preview ────────────────────────────────────────────────────
function PhonePreview({
  platform,
  content,
  mediaUrl,
  hashtags,
  postType,
  slides,
  currentSlide,
  onSlideChange,
}: {
  platform: string
  content: string
  mediaUrl: string
  hashtags: string
  postType: PostType
  slides: Slide[]
  currentSlide: number
  onSlideChange: (i: number) => void
}) {
  const hashtagsArr = hashtags
    ? hashtags
        .split(',')
        .map((h) => h.trim().replace(/^#/, ''))
        .filter(Boolean)
    : []

  const fullCaption =
    content + (hashtagsArr.length > 0 ? '\n\n' + hashtagsArr.map((h) => `#${h}`).join(' ') : '')

  const activeSlide = slides[currentSlide] || slides[0]
  const activeMediaUrl = postType === 'CAROUSEL' ? activeSlide?.mediaUrl : mediaUrl
  const activeContent = postType === 'CAROUSEL' ? activeSlide?.content : content

  const hasImage = !!activeMediaUrl
  const hasContent = !!activeContent
  const charLimit = platform ? PLATFORM_LIMITS[platform] || 2200 : 2200
  const totalContent = postType === 'CAROUSEL'
    ? slides.reduce((sum, s) => sum + s.content.length, 0)
    : content.length
  const isOverLimit = totalContent > charLimit

  return (
    <div className="flex flex-col items-center">
      {/* Status indicators */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {hasContent ? (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Content ready
          </span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
            Missing content
          </span>
        )}
        {platform === 'INSTAGRAM' && !hasImage ? (
          <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
            Missing image
          </span>
        ) : hasImage ? (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Image ready
          </span>
        ) : null}
        {isOverLimit && (
          <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
            Over character limit
          </span>
        )}
      </div>

      {/* Phone outline */}
      <div className="relative w-[240px]">
        {/* Phone shell */}
        <div className="relative bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
          {/* Screen bezel */}
          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* Notch */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-16 h-4 bg-slate-900 rounded-full" />
            </div>

            {/* App content */}
            <div className="px-2 pb-4 min-h-[400px]">
              {/* Platform header */}
              {platform === 'INSTAGRAM' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">yourpage</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Sponsored</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                      <circle cx="6" cy="12" r="1" fill="currentColor" />
                      <circle cx="18" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              )}

              {platform === 'FACEBOOK' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">P</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">Your Page</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now</p>
                  </div>
                </div>
              )}

              {/* Image area */}
              {hasImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeMediaUrl}
                    alt="Preview"
                    className={`w-full object-cover ${
                      platform === 'INSTAGRAM' ? 'aspect-square' : 'aspect-video rounded-lg'
                    }`}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {postType === 'CAROUSEL' && slides.length > 1 && (
                    <div className="flex justify-center gap-1 mt-1.5">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => onSlideChange(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            i === currentSlide ? 'bg-blue-500' : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`w-full bg-slate-100 flex items-center justify-center ${
                    platform === 'INSTAGRAM' ? 'aspect-square' : 'aspect-video rounded-lg'
                  }`}
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-[9px] text-slate-400">No image</p>
                  </div>
                </div>
              )}

              {/* Instagram action bar */}
              {platform === 'INSTAGRAM' && (
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
              )}

              {/* Caption / content */}
              {(activeContent || fullCaption) && (
                <div className="px-1 mt-1">
                  <p className="text-[9px] text-slate-800 leading-relaxed line-clamp-4">
                    {postType === 'CAROUSEL' ? activeContent : fullCaption || activeContent}
                  </p>
                </div>
              )}

              {!hasContent && !hasImage && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-[10px] text-slate-400">Start typing to see a preview...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone buttons */}
        <div className="absolute top-16 -right-1 w-1 h-8 bg-slate-700 rounded-r-full" />
        <div className="absolute top-28 -right-1 w-1 h-6 bg-slate-700 rounded-r-full" />
        <div className="absolute top-20 -left-1 w-1 h-10 bg-slate-700 rounded-l-full" />
        <div className="absolute top-32 -left-1 w-1 h-6 bg-slate-700 rounded-l-full" />
        <div className="absolute top-36 -left-1 w-1 h-6 bg-slate-700 rounded-l-full" />
      </div>

      {/* Platform label */}
      {platform && (
        <div className="flex items-center gap-1.5 mt-4">
          <PlatformIcon platform={platform} className="w-4 h-4" />
          <span className="text-xs text-slate-500 font-medium">
            {platform.charAt(0) + platform.slice(1).toLowerCase()} Preview
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function NewPostPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  // Core state
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [postType, setPostType] = useState<PostType>('SINGLE')
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [hashtags, setHashtagsStr] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([{ id: '1', content: '', mediaUrl: '' }])
  const [currentSlide, setCurrentSlide] = useState(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [publishingNow, setPublishingNow] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // AI modal for single post
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiTone, setAiTone] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // AI carousel modal
  const [carouselAiModalOpen, setCarouselAiModalOpen] = useState(false)
  const [carouselAiTopic, setCarouselAiTopic] = useState('')
  const [carouselAiSlideCount, setCarouselAiSlideCount] = useState(3)
  const [carouselAiLoading, setCarouselAiLoading] = useState(false)
  const [carouselAiProgress, setCarouselAiProgress] = useState<number[]>([])

  // Slide AI per-slide
  const [slideAiLoading, setSlideAiLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/social/accounts?companyId=${companyId}`)
      .then((r) => r.json())
      .then(({ accounts }) => setAccounts(accounts || []))
  }, [companyId])

  function toggleAccount(accountId: string) {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((a) => a !== accountId) : [...prev, accountId]
    )
  }

  // Derive the primary platform from the first selected account
  const primaryPlatform = (() => {
    const first = selectedAccounts[0]
    const acc = accounts.find((a) => a.id === first)
    return acc?.platform || ''
  })()

  // ── AI Generate (single) ────────────────────────────────────────────────
  async function handleAiGenerate() {
    if (!primaryPlatform) {
      setError('Please select a social account first')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, platform: primaryPlatform, topic: aiTopic, tone: aiTone }),
      })
      const data = await res.json()
      if (res.ok) {
        setContent(data.content)
        setHashtagsStr(data.hashtags?.join(', ') || '')
        setIsAiGenerated(true)
        setAiModalOpen(false)
      } else {
        setError(data.error || 'Failed to generate content')
      }
    } finally {
      setAiLoading(false)
    }
  }

  // ── AI Generate single slide ────────────────────────────────────────────
  async function handleAiSlide(slideId: string) {
    if (!primaryPlatform) {
      setError('Please select a social account first')
      return
    }
    setSlideAiLoading((prev) => ({ ...prev, [slideId]: true }))
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, platform: primaryPlatform, topic: aiTopic || carouselAiTopic, tone: aiTone }),
      })
      const data = await res.json()
      if (res.ok) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slideId ? { ...s, content: data.content } : s))
        )
        setIsAiGenerated(true)
      } else {
        setError(data.error || 'Failed to generate slide content')
      }
    } finally {
      setSlideAiLoading((prev) => ({ ...prev, [slideId]: false }))
    }
  }

  // ── AI Generate all carousel slides ────────────────────────────────────
  async function handleCarouselAiGenerate() {
    if (!primaryPlatform) {
      setError('Please select a social account first')
      return
    }
    setCarouselAiLoading(true)
    setCarouselAiProgress([])
    const newSlides: Slide[] = Array.from({ length: carouselAiSlideCount }, (_, i) => ({
      id: generateId(),
      content: '',
      mediaUrl: slides[i]?.mediaUrl || '',
    }))
    setSlides(newSlides)
    setCurrentSlide(0)

    for (let i = 0; i < carouselAiSlideCount; i++) {
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            platform: primaryPlatform,
            topic: carouselAiTopic ? `Slide ${i + 1} of ${carouselAiSlideCount}: ${carouselAiTopic}` : `Carousel slide ${i + 1} of ${carouselAiSlideCount}`,
            tone: aiTone,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setSlides((prev) => {
            const updated = [...prev]
            if (updated[i]) updated[i] = { ...updated[i], content: data.content }
            return updated
          })
        }
      } catch {
        // continue to next slide
      }
      setCarouselAiProgress((prev) => [...prev, i])
    }

    setIsAiGenerated(true)
    setCarouselAiLoading(false)
    setCarouselAiModalOpen(false)
  }

  // ── Slide management ────────────────────────────────────────────────────
  function addSlide() {
    if (slides.length >= 10) return
    const newSlide: Slide = { id: generateId(), content: '', mediaUrl: '' }
    setSlides((prev) => [...prev, newSlide])
    setCurrentSlide(slides.length)
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, i) => i !== index))
    setCurrentSlide(Math.min(currentSlide, slides.length - 2))
  }

  function updateSlide(index: number, field: keyof Slide, value: string) {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function buildPostData(publishNow = false) {
    const hashtagsArray = hashtags
      ? hashtags.split(',').map((h) => h.trim().replace(/^#/, '')).filter(Boolean)
      : []

    const firstAccountId = selectedAccounts[0] || null
    const platform = primaryPlatform || ''

    const baseData = {
      content: postType === 'CAROUSEL' ? slides.map((s) => s.content).join('\n---\n') : content,
      platform,
      scheduledFor: (!publishNow && scheduledFor) ? scheduledFor : null,
      isAiGenerated,
      hashtags: hashtagsArray,
      mediaUrls:
        postType === 'CAROUSEL'
          ? slides.filter((s) => s.mediaUrl).map((s) => s.mediaUrl)
          : mediaUrl
          ? [mediaUrl]
          : [],
      socialAccountId: firstAccountId,
      postType,
      slides: postType === 'CAROUSEL' ? slides.map((s, i) => ({ ...s, order: i })) : undefined,
    }

    return baseData
  }

  async function handleSaveDraft() {
    setError('')
    setLoading(true)
    try {
      const body = await buildPostData()
      const res = await fetch(`/api/companies/${companyId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, status: 'DRAFT' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save draft'); return }
      setSuccessMsg('Draft saved!')
      setTimeout(() => router.push(`/company/${companyId}/posts`), 1200)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleSchedule() {
    if (!scheduledFor) { setError('Please pick a schedule date/time'); return }
    setError('')
    setLoading(true)
    try {
      const body = await buildPostData()
      const res = await fetch(`/api/companies/${companyId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to schedule post'); return }
      setSuccessMsg('Post scheduled!')
      setTimeout(() => router.push(`/company/${companyId}/posts`), 1200)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublishNow() {
    if (!primaryPlatform) { setError('Please select a social account'); return }
    setError('')
    setPublishingNow(true)
    try {
      // First create the post as APPROVED
      const body = await buildPostData(true)
      const createRes = await fetch(`/api/companies/${companyId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, status: 'APPROVED' }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) { setError(createData.error || 'Failed to create post'); return }

      // Then publish immediately
      const pubRes = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: createData.post.id }),
      })
      const pubData = await pubRes.json()
      if (!pubRes.ok) {
        setError(pubData.error || 'Failed to publish')
        return
      }
      setSuccessMsg('Published successfully!')
      setTimeout(() => router.push(`/company/${companyId}/posts`), 1500)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setPublishingNow(false)
    }
  }

  const charLimit = primaryPlatform ? (PLATFORM_LIMITS[primaryPlatform] || 2200) : 2200
  const charCount = postType === 'SINGLE' ? content.length : (slides[currentSlide]?.content.length || 0)
  const charPercent = Math.min((charCount / charLimit) * 100, 100)
  const charColor =
    charPercent > 90 ? 'text-red-500' : charPercent > 70 ? 'text-amber-500' : 'text-slate-400'

  const canSubmit = selectedAccounts.length > 0 && (
    postType === 'SINGLE' ? !!content : slides.some((s) => s.content)
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <Link
          href={`/company/${companyId}/posts`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Posts
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-900">Create New Post</h1>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* ── LEFT PANEL (editor) ──────────────────────────────────────── */}
        <div className="w-[55%] overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-6 space-y-6">
            {/* Error / Success messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </div>
            )}

            {/* ── Post type tabs ─────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Post Type</label>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(['SINGLE', 'CAROUSEL', 'VIDEO'] as PostType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      postType === type
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type === 'SINGLE' && 'Single Post'}
                    {type === 'CAROUSEL' && 'Carousel'}
                    {type === 'VIDEO' && 'Video'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Platform / Account selector ─────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Social Accounts <span className="text-red-500">*</span>
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
                      onClick={() => toggleAccount(account.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedAccounts.includes(account.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <PlatformIcon platform={account.platform} className="w-5 h-5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{account.accountName}</p>
                        <p className="text-xs text-slate-400">{account.platform}</p>
                      </div>
                      {selectedAccounts.includes(account.id) && (
                        <svg className="w-4 h-4 text-indigo-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── SINGLE post content ──────────────────────────────────── */}
            {postType === 'SINGLE' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
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
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    maxLength={charLimit}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all text-sm"
                    placeholder="Write your post content here..."
                  />
                  <div className="flex items-center justify-between mt-1">
                    {isAiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        AI Generated — requires approval
                      </span>
                    )}
                    <span className={`text-xs ml-auto ${charColor}`}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                </div>

                <ImagePicker
                  label="Image"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  aspectRatio="1:1"
                />
              </>
            )}

            {/* ── CAROUSEL slides ──────────────────────────────────────── */}
            {postType === 'CAROUSEL' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Slides ({slides.length}/10)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCarouselAiModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span>✦</span> AI Generate All Slides
                  </button>
                </div>

                {/* Slide tabs navigation */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentSlide === i
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Slide {i + 1}
                      {slide.content && <span className="ml-1 opacity-60">✓</span>}
                    </button>
                  ))}
                  {slides.length < 10 && (
                    <button
                      type="button"
                      onClick={addSlide}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {/* Active slide editor */}
                {slides[currentSlide] && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Slide {currentSlide + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAiSlide(slides[currentSlide].id)}
                          disabled={slideAiLoading[slides[currentSlide].id]}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                        >
                          {slideAiLoading[slides[currentSlide].id] ? (
                            <SpinnerIcon className="w-3 h-3" />
                          ) : (
                            <span>✦</span>
                          )}
                          AI This Slide
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlide(currentSlide)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <textarea
                        value={slides[currentSlide].content}
                        onChange={(e) => updateSlide(currentSlide, 'content', e.target.value)}
                        rows={4}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none text-sm"
                        placeholder={`Write content for slide ${currentSlide + 1}...`}
                      />
                      <div className="flex justify-end mt-1">
                        <span className={`text-xs ${charColor}`}>
                          {slides[currentSlide].content.length} / {charLimit}
                        </span>
                      </div>
                    </div>

                    <ImagePicker
                      label="Slide Image"
                      value={slides[currentSlide].mediaUrl}
                      onChange={(url) => updateSlide(currentSlide, 'mediaUrl', url)}
                      aspectRatio="1:1"
                      compact
                    />

                    {/* Slide navigation arrows */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                        className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Prev
                      </button>
                      <div className="flex gap-1">
                        {slides.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === currentSlide ? 'bg-indigo-500' : 'bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                        disabled={currentSlide === slides.length - 1}
                        className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 flex items-center gap-1"
                      >
                        Next
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEO ───────────────────────────────────────────────── */}
            {postType === 'VIDEO' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Caption <span className="text-red-500">*</span>
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
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  maxLength={charLimit}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all text-sm"
                  placeholder="Video caption..."
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-3">Video URL</label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>
            )}

            {/* ── Hashtags ─────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtagsStr(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
                placeholder="marketing, socialmedia, growth (comma separated)"
              />
            </div>

            {/* ── Schedule ─────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Schedule For <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
              />
            </div>

            {/* ── AI generated warning ─────────────────────────────────── */}
            {isAiGenerated && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>AI-generated content</strong> will be saved as &quot;Pending Approval&quot; status unless you publish immediately.
                </span>
              </div>
            )}

            {/* ── Action buttons ─────────────────────────────────────── */}
            <div className="flex gap-2 pt-2 pb-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || publishingNow || !canSubmit}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-40"
              >
                {loading ? <SpinnerIcon className="w-4 h-4 mx-auto" /> : 'Save Draft'}
              </button>

              {scheduledFor && (
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={loading || publishingNow || !canSubmit}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <SpinnerIcon /> : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handlePublishNow}
                disabled={loading || publishingNow || !canSubmit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {publishingNow ? (
                  <><SpinnerIcon /> Publishing...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publish Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (preview) ─────────────────────────────────────── */}
        <div className="w-[45%] overflow-y-auto bg-slate-50 flex flex-col items-center py-8 px-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">Preview</h2>
          <PhonePreview
            platform={primaryPlatform}
            content={content}
            mediaUrl={mediaUrl}
            hashtags={hashtags}
            postType={postType}
            slides={slides}
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>
      </div>

      {/* ── AI Generate Modal (single) ──────────────────────────────────── */}
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
              <option value="casual">Casual &amp; Friendly</option>
              <option value="witty">Witty &amp; Fun</option>
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
              {aiLoading ? <><SpinnerIcon /> Generating...</> : <>✦ Generate</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── AI Carousel Modal ───────────────────────────────────────────── */}
      <Modal isOpen={carouselAiModalOpen} onClose={() => !carouselAiLoading && setCarouselAiModalOpen(false)} title="AI Generate Carousel">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            AI will generate unique content for each slide in your carousel.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic or Focus</label>
            <input
              type="text"
              value={carouselAiTopic}
              onChange={(e) => setCarouselAiTopic(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="e.g. 5 tips for growing your audience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Number of Slides: {carouselAiSlideCount}
            </label>
            <input
              type="range"
              min={2}
              max={10}
              value={carouselAiSlideCount}
              onChange={(e) => setCarouselAiSlideCount(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2</span><span>10</span>
            </div>
          </div>

          {/* Progress indicator */}
          {carouselAiLoading && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Generating slides...</p>
              <div className="flex gap-1.5">
                {Array.from({ length: carouselAiSlideCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      carouselAiProgress.includes(i) ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {carouselAiProgress.length} / {carouselAiSlideCount} slides done
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCarouselAiModalOpen(false)}
              disabled={carouselAiLoading}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCarouselAiGenerate}
              disabled={carouselAiLoading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {carouselAiLoading ? <><SpinnerIcon /> Generating...</> : <>✦ Generate {carouselAiSlideCount} Slides</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
