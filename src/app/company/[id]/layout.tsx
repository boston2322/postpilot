import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CompanySidebar from '@/components/CompanySidebar'

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

  const isSubscriptionActive = company.subscription?.status === 'ACTIVE'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <CompanySidebar
        company={company}
        user={user}
        member={member}
      />
      <div className="flex-1 overflow-auto flex flex-col">
        {!isSubscriptionActive && (
          <div className="bg-yellow-500 text-yellow-900 text-sm text-center py-2 px-4 font-medium">
            {company.subscription?.status === 'PAST_DUE'
              ? '⚠️ Your subscription payment is past due. Please update your billing.'
              : company.subscription?.status === 'CANCELED'
              ? '⚠️ Your subscription has been canceled. '
              : '⚠️ No active subscription. '}
            <a
              href={`/company/${params.id}/settings`}
              className="underline font-semibold ml-1"
            >
              Manage Billing →
            </a>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
