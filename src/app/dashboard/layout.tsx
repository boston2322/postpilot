import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import DashboardSidebar from '@/components/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const token = cookieStore.get('pp_token')?.value

  if (!token) {
    redirect('/auth/login')
  }

  const user = await verifyToken(token)
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <DashboardSidebar user={user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
