'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type PostType = 'SINGLE' | 'CAROUSEL' | 'VIDEO'
type Step = 1 | 2 | 3 | 4

type SocialAccount = {
  id: string
  platform: string
  accountName: string
}

type SlideData = {
  title: string
  content: string
  imagePrompt: string
  mediaUrl?: string
}

type GeneratedPost = {
  type: PostType
  content: string
  hashtags: string[]
  imagePrompt?: string
  slides?: SlideData[]
  script?: string
  thumbnailPrompt?: string
  captions?: string
  mediaUrl?: string
}

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'educational', label: 'Educational' },
]

const GOALS = [
  { value: 'educate', label: 'Educate' },
  { value: 'promote', label: 'Promote' },
  { value: 'inspire', label: 'Inspire' },
  { value: 'sell', label: 'Sell a Product' },
  { value: 'story', label: 'Tell a Story' },
  { value: 'engage', label: 'Drive Engagement' },
]

const VIDEO_STYLES = [
  { value: 'tutorial', label: 'Tutorial / How-to' },
  { value: 'product-demo', label: 'Product Demo' },
  { value: 'behind-scenes', label: 'Behind the Scenes' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'testimonial', label: 'Testimonial' },
]

const DURATIONS = ['15s', '30s', '60s', '90s']

function SpinnerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function StepIndicator({ step, current }: { step: number; current: Step }) {
  const done = current > step
  const active = current === step
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
      done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'bg-slate-100 text-slate-400'
    }`}>
      {done ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : step}
    </div>
  )
}

export default function AIWizardPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  const [step, setStep] = useState<Step>(1)
  const [postType, setPostType] = useState<PostType | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({
    tone: 'professional',
    goal: 'educate',
    style: 'tutorial',
    duration: '30s',
    slideCount: 5,
    includeCta: true,
    includeCaptions: false,
  })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedPost | null>(null)
  const [genError, setGenError] = useState('')

  // Step 4 state
  const [scheduledFor, setScheduledFor] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  useEffect(() => {
    fetch(`/api/companies/${companyId}`)
      .then(r => r.json())
      .then(data => {
        const accs = data.company?.socialAccounts?.filter((a: SocialAccount & { isActive: boolean }) => a.isActive) || []
        setAccounts(accs)
        if (accs.length > 0) setSelectedAccount(accs[0])
      })
      .catch(() => {})
  }, [companyId])

  function setAnswer(key: string, value: string | number | boolean) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  async function handleGenerate() {
    if (!postType || !selectedAccount) return
    if (!answers.topic || !(answers.topic as string).trim()) {
      setGenError('Please enter a topic for your post')
      return
    }
    setGenError('')
    setGenerating(true)
    setStep(3)

    try {
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: postType,
          platform: selectedAccount.platform,
          answers,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenError(data.error || 'Failed to generate post')
        setStep(2)
        return
      }
      setGenerated(data)
      setStep(4)
    } catch {
      setGenError('Failed to generate post. Please try again.')
      setStep(2)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAccept() {
    if (!generated || !selectedAccount) return
    setAcceptError('')
    setAccepting(true)

    try {
      const slides = generated.slides?.map(s => ({
        mediaUrl: s.mediaUrl || '',
        content: s.content,
        title: s.title,
      }))

      // Build post body
      const postBody = {
        content: generated.content,
        platform: selectedAccount.platform,
        hashtags: generated.hashtags,
        mediaUrls: generated.mediaUrl ? [generated.mediaUrl] : [],
        socialAccountId: selectedAccount.id,
        isAiGenerated: true,
        postType: generated.type,
        slides: slides || null,
        scheduledFor: scheduledFor || null,
      }

      // Create the post
      const createRes = await fetch(`/api/companies/${companyId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      })
      const createData = await createRes.json()
      if (!createRes.ok) {
        setAcceptError(createData.error || 'Failed to create post')
        return
      }

      const postId = createData.post.id

      // Immediately approve it
      const approveRes = await fetch(`/api/companies/${companyId}/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!approveRes.ok) {
        const approveData = await approveRes.json()
        setAcceptError(approveData.error || 'Post created but approval failed')
        return
      }

      router.push(`/company/${companyId}/posts`)
    } catch {
      setAcceptError('Something went wrong. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
  const textareaClass = `${inputClass} resize-none`
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

  function SelectPill({ options, value, onChange }: { options: {value: string, label: string}[], value: string, onChange: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === o.value
                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/company/${companyId}/posts`} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">✦</span> AI Post Creator
            </h1>
            <p className="text-slate-500 text-sm">Answer a few questions and let AI create your post</p>
          </div>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: 'Post Type' },
              { n: 2, label: 'Questions' },
              { n: 3, label: 'Generating' },
              { n: 4, label: 'Review' },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <StepIndicator step={s.n} current={step} />
                  <span className={`text-sm font-medium hidden sm:block ${step === s.n ? 'text-indigo-700' : step > s.n ? 'text-slate-500' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-px min-w-[20px] ${step > s.n ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Choose Post Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">What type of post?</h2>
              <p className="text-slate-500 text-sm mb-5">AI will tailor the content and questions based on your choice.</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    type: 'SINGLE' as PostType,
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l4-4 4 4 4-4 4 4" />
                        <circle cx="8" cy="14" r="2" strokeWidth={1.5} />
                      </svg>
                    ),
                    label: 'Single Image',
                    desc: 'One photo + caption',
                  },
                  {
                    type: 'CAROUSEL' as PostType,
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="5" y="4" width="14" height="16" rx="2" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 7v10M22 7v10" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6M9 8h6" />
                      </svg>
                    ),
                    label: 'Carousel',
                    desc: 'Multi-slide story',
                  },
                  {
                    type: 'VIDEO' as PostType,
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="5" width="15" height="14" rx="2" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9l5-3v12l-5-3V9z" />
                      </svg>
                    ),
                    label: 'Video',
                    desc: 'Script + thumbnail',
                  },
                ].map(({ type, icon, label, desc }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                      postType === type
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={postType === type ? 'text-indigo-600' : 'text-slate-400'}>{icon}</div>
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Platform / Social Account selection */}
              {postType && (
                <div>
                  <label className={labelClass}>Post to which account?</label>
                  {accounts.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                      No connected accounts found.{' '}
                      <Link href={`/company/${companyId}/settings`} className="underline font-medium">
                        Connect a social account →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map(acc => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAccount(acc)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                            selectedAccount?.id === acc.id
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="font-medium">{acc.platform}</span>
                          <span className="text-xs opacity-70 truncate">{acc.accountName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!postType || !selectedAccount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-all"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2: Questions */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Tell the AI about your post</h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  {postType === 'SINGLE' ? 'Single Image' : postType === 'CAROUSEL' ? 'Carousel' : 'Video'}
                </span>
              </div>

              {/* Topic - shared by all types */}
              <div>
                <label className={labelClass}>
                  {postType === 'SINGLE' && "What's this post about? *"}
                  {postType === 'CAROUSEL' && "What's this carousel about? *"}
                  {postType === 'VIDEO' && "What's this video about? *"}
                </label>
                <input
                  type="text"
                  value={answers.topic as string || ''}
                  onChange={e => setAnswer('topic', e.target.value)}
                  className={inputClass}
                  placeholder={
                    postType === 'SINGLE' ? 'e.g. New product launch, summer sale, team spotlight...' :
                    postType === 'CAROUSEL' ? 'e.g. 5 tips for better sleep, how to use our app...' :
                    'e.g. Product demo, behind the scenes, tutorial...'
                  }
                />
              </div>

              {/* Audience */}
              <div>
                <label className={labelClass}>Target audience</label>
                <input
                  type="text"
                  value={answers.audience as string || ''}
                  onChange={e => setAnswer('audience', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Small business owners, fitness enthusiasts, millennials..."
                />
              </div>

              {/* Tone */}
              <div>
                <label className={labelClass}>Tone</label>
                <SelectPill
                  options={TONES}
                  value={answers.tone as string || 'professional'}
                  onChange={v => setAnswer('tone', v)}
                />
              </div>

              {/* SINGLE-specific */}
              {postType === 'SINGLE' && (
                <>
                  <div>
                    <label className={labelClass}>Call to action <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={answers.cta as string || ''}
                      onChange={e => setAnswer('cta', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Shop now at the link in bio, comment below, share with a friend..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Extra context <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      value={answers.notes as string || ''}
                      onChange={e => setAnswer('notes', e.target.value)}
                      className={textareaClass}
                      placeholder="Any specific details, keywords, or talking points to include..."
                    />
                  </div>
                </>
              )}

              {/* CAROUSEL-specific */}
              {postType === 'CAROUSEL' && (
                <>
                  <div>
                    <label className={labelClass}>Goal</label>
                    <SelectPill
                      options={GOALS}
                      value={answers.goal as string || 'educate'}
                      onChange={v => setAnswer('goal', v)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Number of slides</label>
                    <div className="flex gap-2">
                      {[3, 4, 5, 6, 7, 8, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer('slideCount', n)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            answers.slideCount === n
                              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Specific points to cover <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      value={answers.points as string || ''}
                      onChange={e => setAnswer('points', e.target.value)}
                      className={textareaClass}
                      placeholder="List any key points you want covered on the slides..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAnswer('includeCta', !answers.includeCta)}
                      className={`relative w-10 h-6 rounded-full transition-all ${answers.includeCta ? 'bg-indigo-500' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${answers.includeCta ? 'translate-x-4' : ''}`} />
                    </button>
                    <label className="text-sm text-slate-700">Include a CTA slide at the end</label>
                  </div>
                </>
              )}

              {/* VIDEO-specific */}
              {postType === 'VIDEO' && (
                <>
                  <div>
                    <label className={labelClass}>Video style</label>
                    <SelectPill
                      options={VIDEO_STYLES}
                      value={answers.style as string || 'tutorial'}
                      onChange={v => setAnswer('style', v)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duration</label>
                    <div className="flex gap-2">
                      {DURATIONS.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAnswer('duration', d)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            answers.duration === d
                              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Key talking points <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      value={answers.points as string || ''}
                      onChange={e => setAnswer('points', e.target.value)}
                      className={textareaClass}
                      placeholder="List the main points you want covered in the video..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAnswer('includeCaptions', !answers.includeCaptions)}
                      className={`relative w-10 h-6 rounded-full transition-all ${answers.includeCaptions ? 'bg-indigo-500' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${answers.includeCaptions ? 'translate-x-4' : ''}`} />
                    </button>
                    <label className="text-sm text-slate-700">Generate captions/subtitles</label>
                  </div>
                </>
              )}

              {genError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {genError}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!answers.topic || !(answers.topic as string).trim()}
                className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>✦</span>
                Generate Post with AI
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Generating */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <SpinnerIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Creating your post...</h2>
              <p className="text-slate-500 mt-2 text-sm">
                AI is crafting your{' '}
                {postType === 'SINGLE' ? 'single image post' : postType === 'CAROUSEL' ? `${answers.slideCount}-slide carousel` : 'video post'}{' '}
                for {selectedAccount?.platform}. This takes about 5–15 seconds.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {['Analysing topic...', 'Writing content...', 'Crafting hashtags...'].map((label, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Accept */}
        {step === 4 && generated && (
          <div className="space-y-4">
            {/* Generated content card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Review your AI-generated post</h2>
                <button
                  type="button"
                  onClick={() => { setStep(2); setGenerated(null) }}
                  className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.5-5.5M20 15a9 9 0 01-14.5 5.5" />
                  </svg>
                  Regenerate
                </button>
              </div>

              {/* Caption */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Caption</label>
                <textarea
                  rows={4}
                  value={generated.content}
                  onChange={e => setGenerated({ ...generated, content: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                />
              </div>

              {/* Hashtags */}
              {generated.hashtags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Hashtags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {generated.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                        #{tag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Carousel slides */}
              {generated.type === 'CAROUSEL' && generated.slides && generated.slides.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Slides ({generated.slides.length})
                  </label>
                  <div className="space-y-2">
                    {generated.slides.map((slide, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800">{slide.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{slide.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video script */}
              {generated.type === 'VIDEO' && generated.script && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Video Script</label>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {generated.script}
                  </div>
                </div>
              )}

              {/* Image prompt (for reference) */}
              {(generated.imagePrompt || generated.thumbnailPrompt) && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-purple-700 mb-1">
                    ✦ AI Image Prompt {generated.type === 'VIDEO' ? '(Thumbnail)' : ''}
                  </div>
                  <p className="text-xs text-purple-600 leading-relaxed">
                    {generated.imagePrompt || generated.thumbnailPrompt}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    Use this prompt in the post editor to generate an image with AI
                  </p>
                </div>
              )}
            </div>

            {/* Schedule & Account */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-900">When to post?</h3>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Schedule date & time <span className="text-slate-400 normal-case font-normal">(leave empty to post immediately on acceptance)</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>

              <div className={`flex items-start gap-3 rounded-xl p-3 text-sm ${scheduledFor ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                <span className="text-base mt-0.5">{scheduledFor ? '📅' : '⚡'}</span>
                <div>
                  <div className="font-medium">
                    {scheduledFor
                      ? `Will post on ${new Date(scheduledFor).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
                      : 'Will post immediately when you accept'}
                  </div>
                  <div className="opacity-70 text-xs mt-0.5">
                    to {selectedAccount?.platform} · {selectedAccount?.accountName}
                  </div>
                </div>
              </div>

              {acceptError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {acceptError}
                </div>
              )}
            </div>

            {/* Accept button */}
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-indigo-200"
            >
              {accepting ? (
                <>
                  <SpinnerIcon className="w-5 h-5" />
                  <span>Accepting & {scheduledFor ? 'Scheduling...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Accept & {scheduledFor ? 'Schedule Post' : 'Post Now'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/company/${companyId}/posts`)}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Discard and go back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
