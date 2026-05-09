import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CompanySidebar from '@/components/CompanySidebar'
import SubscriptionGate from '@/components/SubscriptionGate'

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const cookieStore = cookies()
  const token = cookieStore.get('pp_token')?.value

  if (!token) redirect('/auth/login')

  const user = await verifyToken(token)
  if (!user) redirect('/auth/login')

  const member = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId: params.id, userId: user.id } },
  })

  if (!member && !user.isAdmin) redirect('/dashboard')

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { subscription: true },
  })

  if (!company) redirect('/dashboard')

  const sub = company.subscription
  const trialDaysLeft = sub?.status === 'TRIALING' && sub.currentPeriodEnd
    ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <CompanySidebar
        company={company}
        user={user}
        member={member}
      />
      <div className="flex-1 overflow-auto flex flex-col">
        {sub?.status === 'PAST_DUE' && (
          <div className="bg-yellow-500 text-yellow-900 text-sm text-center py-2 px-4 font-medium">
            ⚠️ Your payment is past due. Please update your billing.{' '}
            <a href={`/company/${params.id}/settings?tab=subscription`} className="underline font-semibold">
              Fix now →
            </a>
          </div>
        )}
        {sub?.status === 'TRIALING' && trialDaysLeft !== null && (
          <div className="bg-indigo-600 text-white text-sm text-center py-2 px-4 font-medium">
            🎉 Free trial — {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining.{' '}
            <a href={`/company/${params.id}/settings?tab=subscription`} className="underline font-semibold">
              Choose a plan →
            </a>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          <SubscriptionGate companyId={params.id} subscription={sub ? { status: sub.status } : null}>
            {children}
          </SubscriptionGate>
        </main>
      </div>
    </div>
  )
}
