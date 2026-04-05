import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        companies: {
          include: {
            company: {
              include: { subscription: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  const sanitized = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    isAdmin: u.isAdmin,
    isSuspended: u.isSuspended,
    createdAt: u.createdAt,
    companies: u.companies.map((m) => ({
      id: m.company.id,
      name: m.company.name,
      role: m.role,
      subscription: m.company.subscription,
    })),
  }))

  return NextResponse.json({ users: sanitized, total, page, limit })
}
