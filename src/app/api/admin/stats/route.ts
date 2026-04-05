import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PLANS } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalCompanies,
    postsToday,
    totalPosts,
    activeSubscriptions,
    recentUsers,
    recentCompanies,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.post.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count(),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { plan: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true, isAdmin: true },
    }),
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        subscription: true,
        _count: { select: { members: true } },
      },
    }),
  ])

  // Calculate estimated monthly revenue
  const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
    const plan = PLANS[sub.plan as keyof typeof PLANS]
    return sum + (plan?.price || 0)
  }, 0)

  return NextResponse.json({
    stats: {
      totalUsers,
      totalCompanies,
      postsToday,
      totalPosts,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRevenue,
    },
    recentUsers,
    recentCompanies,
  })
}
