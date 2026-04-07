'use client'

import { useState } from 'react'
import PlatformIcon from '@/components/PlatformIcon'

type Slide = {
  title?: string
  content: string
  mediaUrl?: string
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

export default function PhonePreview({
  platform,
  content,
  mediaUrl,
  hashtags,
  postType,
  slides,
}: {
  platform: string
  content: string
  mediaUrl?: string
  hashtags: string[]
  postType: PostType
  slides?: Slide[]
}) {
  const [slide, setSlide] = useState(0)

  const fullCaption =
    content +
    (hashtags.length > 0 ? '\n\n' + hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ') : '')

  const activeSlide = slides?.[slide]
  const activeMediaUrl = postType === 'CAROUSEL' && activeSlide ? activeSlide.mediaUrl : mediaUrl
  const activeContent = postType === 'CAROUSEL' && activeSlide ? activeSlide.content : content

  const hasImage = !!activeMediaUrl
  const hasContent = !!activeContent
  const charLimit = PLATFORM_LIMITS[platform] || 2200
  const isOverLimit = content.length > charLimit

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {hasContent ? (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Content ready</span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">No content yet</span>
        )}
        {platform === 'INSTAGRAM' && !hasImage && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">No image</span>
        )}
        {hasImage && (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Image ready</span>
        )}
        {isOverLimit && (
          <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">Over limit</span>
        )}
      </div>

      <div className="relative w-[220px]">
        <div className="relative bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
          <div className="bg-white rounded-[2rem] overflow-hidden">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-14 h-3.5 bg-slate-900 rounded-full" />
            </div>
            <div className="px-2 pb-4 min-h-[380px]">
              {platform === 'INSTAGRAM' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">yourpage</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                  </svg>
                </div>
              )}
              {platform === 'FACEBOOK' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">P</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">Your Page</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now · 🌐</p>
                  </div>
                </div>
              )}
              {platform === 'LINKEDIN' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">in</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">Your Name</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now · 🌐</p>
                  </div>
                </div>
              )}
              {platform === 'X' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">𝕏</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">@yourhandle</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now</p>
                  </div>
                </div>
              )}
              {platform === 'TIKTOK' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">TK</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">@yourhandle</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now</p>
                  </div>
                </div>
              )}
              {platform === 'YOUTUBE' && (
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[8px] font-bold">▶</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 leading-none">Your Channel</p>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Just now</p>
                  </div>
                </div>
              )}

              {postType !== 'VIDEO' && (
                hasImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeMediaUrl}
                      alt="Preview"
                      className={`w-full object-cover ${
                        platform === 'INSTAGRAM' || platform === 'TIKTOK' ? 'aspect-square' : 'aspect-video'
                      }`}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    {postType === 'CAROUSEL' && slides && slides.length > 1 && (
                      <div className="flex justify-center gap-1 mt-1.5">
                        {slides.map((_, i) => (
                          <button key={i} type="button" onClick={() => setSlide(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === slide ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-full bg-slate-100 flex items-center justify-center ${
                    platform === 'INSTAGRAM' || platform === 'TIKTOK' ? 'aspect-square' : 'aspect-video'
                  }`}>
                    <div className="text-center">
                      <svg className="w-6 h-6 text-slate-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[9px] text-slate-400">No image added</p>
                    </div>
                  </div>
                )
              )}

              {postType === 'VIDEO' && (
                <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}

              {platform === 'INSTAGRAM' && (
                <div className="flex items-center gap-2 px-1 py-1">
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <svg className="w-3.5 h-3.5 text-slate-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              )}
              {platform === 'FACEBOOK' && (
                <div className="flex items-center gap-1 px-1 py-1 border-t border-slate-100 mt-0.5">
                  <span className="text-[8px] text-slate-400 flex-1 text-center">👍 Like</span>
                  <span className="text-[8px] text-slate-400 flex-1 text-center">💬 Comment</span>
                  <span className="text-[8px] text-slate-400 flex-1 text-center">↗ Share</span>
                </div>
              )}
              {platform === 'LINKEDIN' && (
                <div className="flex items-center gap-1 px-1 py-1 border-t border-slate-100 mt-0.5">
                  <span className="text-[8px] text-slate-400 flex-1 text-center">👍 Like</span>
                  <span className="text-[8px] text-slate-400 flex-1 text-center">💬 Comment</span>
                  <span className="text-[8px] text-slate-400 flex-1 text-center">🔁 Repost</span>
                </div>
              )}
              {platform === 'X' && (
                <div className="flex items-center gap-2 px-1 py-1 border-t border-slate-100 mt-0.5">
                  <span className="text-[8px] text-slate-400">💬 Reply</span>
                  <span className="text-[8px] text-slate-400">🔁 Repost</span>
                  <span className="text-[8px] text-slate-400">❤️ Like</span>
                </div>
              )}

              {(activeContent || fullCaption) && (
                <div className="px-1 mt-1">
                  {postType === 'CAROUSEL' && activeSlide?.title && (
                    <p className="text-[9px] font-bold text-slate-900 leading-tight mb-0.5">{activeSlide.title}</p>
                  )}
                  <p className="text-[9px] text-slate-700 leading-relaxed line-clamp-5">
                    {postType === 'CAROUSEL' ? activeContent : fullCaption}
                  </p>
                </div>
              )}

              {!hasContent && !hasImage && (
                <div className="flex flex-col items-center justify-center h-32">
                  <p className="text-[10px] text-slate-400 text-center">Preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute top-16 -right-1 w-1 h-8 bg-slate-700 rounded-r-full" />
        <div className="absolute top-28 -right-1 w-1 h-6 bg-slate-700 rounded-r-full" />
        <div className="absolute top-20 -left-1 w-1 h-10 bg-slate-700 rounded-l-full" />
        <div className="absolute top-32 -left-1 w-1 h-6 bg-slate-700 rounded-l-full" />
        <div className="absolute top-40 -left-1 w-1 h-6 bg-slate-700 rounded-l-full" />
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        <PlatformIcon platform={platform} className="w-4 h-4" />
        <span className="text-xs text-slate-500 font-medium">
          {platform.charAt(0) + platform.slice(1).toLowerCase()} Preview
        </span>
      </div>
    </div>
  )
}
