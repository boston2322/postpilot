'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Modal from '@/components/Modal'
import PlatformIcon from '@/components/PlatformIcon'

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
}

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'X', 'LINKEDIN', 'TIKTOK', 'YOUTUBE']
const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
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
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/automations`)
    if (res.ok) {
      const { automations } = await res.json()
      setAutomations(automations)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [companyId])

  function openCreate() {
    setEditingId(null)
    setForm({
      name: '', description: '', platforms: [], frequency: 'WEEKLY',
      postingTime: '09:00', timezone: 'UTC', contentType: 'ai', aiPrompt: '',
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
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editingId
      ? `/api/companies/${companyId}/automations/${editingId}`
      : `/api/companies/${companyId}/automations`
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Automation' : 'Create Automation'}
        size="lg"
      >
        <div className="space-y-4">
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
