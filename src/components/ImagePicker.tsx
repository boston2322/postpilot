'use client'

import { useState, useRef, useCallback } from 'react'

type Tab = 'upload' | 'ai' | 'url'

type ImagePickerProps = {
  value: string
  onChange: (url: string) => void
  label?: string
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16'
  compact?: boolean
}

function SpinnerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const AI_STYLES = [
  { value: 'social-media', label: 'Social Media' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'product', label: 'Product' },
  { value: 'abstract', label: 'Abstract' },
]

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1', desc: 'Square' },
  { value: '4:5', label: '4:5', desc: 'Portrait' },
  { value: '16:9', label: '16:9', desc: 'Wide' },
  { value: '9:16', label: '9:16', desc: 'Story' },
]

export default function ImagePicker({
  value,
  onChange,
  label,
  aspectRatio: defaultAspectRatio = '1:1',
  compact = false,
}: ImagePickerProps) {
  const [tab, setTab] = useState<Tab>(value ? 'url' : 'upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // AI state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('social-media')
  const [aiAspectRatio, setAiAspectRatio] = useState(defaultAspectRatio)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // URL state
  const [urlInput, setUrlInput] = useState(value || '')

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(file: File) {
    setUploadError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.setup) {
          setUploadError('Image uploads require Cloudinary setup. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to your environment variables, then create a free account at cloudinary.com.')
        } else {
          setUploadError(data.error || 'Upload failed')
        }
        return
      }

      onChange(data.url)
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt describing the image you want')
      return
    }
    setAiError('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          aspectRatio: aiAspectRatio,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Failed to generate image')
        return
      }
      onChange(data.url)
    } catch {
      setAiError('Failed to generate image. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  function handleUrlApply() {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
    }
  }

  function handleRemove() {
    onChange('')
    setUrlInput('')
    setTab('upload')
  }

  const tabClass = (t: Tab) =>
    `flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
      tab === t
        ? 'bg-white text-indigo-700 shadow-sm'
        : 'text-slate-500 hover:text-slate-700'
    }`

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
      )}

      {/* Current image preview */}
      {value && (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Selected image"
            className="w-full object-cover"
            style={{ maxHeight: compact ? '120px' : '200px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('upload')}
                className="bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-0.5 bg-slate-100 p-1 rounded-lg">
        <button type="button" onClick={() => setTab('upload')} className={tabClass('upload')}>
          <span className="flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </span>
        </button>
        <button type="button" onClick={() => setTab('ai')} className={tabClass('ai')}>
          <span className="flex items-center justify-center gap-1">
            <span className="text-[10px]">✦</span>
            AI Generate
          </span>
        </button>
        <button type="button" onClick={() => setTab('url')} className={tabClass('url')}>
          <span className="flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            URL
          </span>
        </button>
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileInput}
          />
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <SpinnerIcon className="w-6 h-6 text-indigo-600" />
                <p className="text-xs text-slate-500">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {dragging ? 'Drop image here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, GIF, WebP — up to 20MB</p>
                </div>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 mt-1.5 leading-relaxed">{uploadError}</p>
          )}
        </div>
      )}

      {/* AI Generate tab */}
      {tab === 'ai' && (
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !aiLoading && handleAiGenerate()}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              placeholder="Describe the image you want... (e.g. coffee shop interior, warm lighting)"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Style selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Style</label>
              <div className="grid grid-cols-2 gap-1">
                {AI_STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setAiStyle(s.value)}
                    className={`py-1 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                      aiStyle === s.value
                        ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-1">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAiAspectRatio(r.value as '1:1' | '4:5' | '16:9' | '9:16')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                      aiAspectRatio === r.value
                        ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <div>{r.label}</div>
                    <div className="text-[9px] opacity-60">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {aiError && (
            <p className="text-xs text-red-500">{aiError}</p>
          )}

          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {aiLoading ? (
              <>
                <SpinnerIcon />
                <span>Generating image...</span>
              </>
            ) : (
              <>
                <span>✦</span>
                <span>Generate Image</span>
              </>
            )}
          </button>

          {aiLoading && (
            <p className="text-xs text-slate-400 text-center">
              This may take 10–30 seconds. Your image is being created by AI.
            </p>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleUrlApply}
            disabled={!urlInput.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Use
          </button>
        </div>
      )}
    </div>
  )
}
