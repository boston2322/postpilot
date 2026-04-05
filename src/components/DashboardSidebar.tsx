'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { SessionUser } from '@/types'

type Company = {
  id: string
  name: string
  subscription: { status: string } | null
}

export default function DashboardSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then(({ companies }) => setCompanies(companies || []))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-lg">PostPilot</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all ${
            pathname === '/dashboard'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>

        {/* Companies section */}
        <div className="mt-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Companies
          </p>
          <div className="space-y-1">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname.startsWith(`/company/${company.id}`)
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="w-5 h-5 bg-indigo-500/20 rounded flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                  {company.name[0].toUpperCase()}
                </div>
                <span className="truncate">{company.name}</span>
                {company.subscription?.status !== 'ACTIVE' && (
                  <span className="ml-auto text-yellow-400 text-xs">!</span>
                )}
              </Link>
            ))}

            <Link
              href="/dashboard/companies/new"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <div className="w-5 h-5 border border-slate-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>New Company</span>
            </Link>
          </div>
        </div>

        {/* Admin link */}
        {user.isAdmin && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Admin</p>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <span className="text-base">⚡</span>
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium text-slate-300 flex-shrink-0">
            {user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
