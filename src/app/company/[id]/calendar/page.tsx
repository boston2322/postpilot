'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PlatformIcon from '@/components/PlatformIcon'
import Modal from '@/components/Modal'

type Post = {
  id: string
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  createdAt: string
  creator: { name: string }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-200 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-blue-200 text-blue-800 border-blue-300',
  SCHEDULED: 'bg-indigo-200 text-indigo-800 border-indigo-300',
  PUBLISHED: 'bg-green-200 text-green-800 border-green-300',
  FAILED: 'bg-red-200 text-red-800 border-red-300',
  REJECTED: 'bg-slate-200 text-slate-600 border-slate-300',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarPage() {
  const params = useParams()
  const companyId = params.id as string

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [platformFilter, setPlatformFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/posts?limit=200`)
      if (res.ok) {
        const { posts } = await res.json()
        setPosts(posts)
      }
      setLoading(false)
    }
    load()
  }, [companyId])

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function getPostsForDay(day: number): Post[] {
    return posts.filter((p) => {
      const dateStr = p.scheduledFor || p.publishedAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      const match = d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
      if (!match) return false
      if (platformFilter && p.platform !== platformFilter) return false
      return true
    })
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const allPlatforms = Array.from(new Set(posts.map((p) => p.platform)))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-500 mt-0.5">Visualize your scheduled content</p>
        </div>
        <div className="flex items-center gap-3">
          {allPlatforms.length > 0 && (
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Platforms</option>
              {allPlatforms.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries({
          PENDING_APPROVAL: 'Pending',
          SCHEDULED: 'Scheduled',
          PUBLISHED: 'Published',
          FAILED: 'Failed',
        }).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border ${STATUS_COLORS[status]}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b border-slate-100 min-h-[100px] bg-slate-50/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayPosts = getPostsForDay(day)
              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year

              return (
                <div
                  key={day}
                  className={`border-r border-b border-slate-100 min-h-[100px] p-2 ${
                    isToday ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`w-full text-left p-1 rounded border text-xs truncate transition-opacity hover:opacity-80 ${STATUS_COLORS[post.status] || 'bg-slate-100 text-slate-600'}`}
                      >
                        <div className="flex items-center gap-1">
                          <PlatformIcon platform={post.platform} className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{post.content.substring(0, 20)}...</span>
                        </div>
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-xs text-slate-400 text-center">+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Post Details"
      >
        {selectedPost && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={selectedPost.platform} className="w-6 h-6" />
              <span className="font-medium text-slate-700">{selectedPost.platform}</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedPost.status]}`}>
                {selectedPost.status.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Created by: {selectedPost.creator.name}</p>
              {selectedPost.scheduledFor && (
                <p>Scheduled: {new Date(selectedPost.scheduledFor).toLocaleString()}</p>
              )}
              {selectedPost.publishedAt && (
                <p>Published: {new Date(selectedPost.publishedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
