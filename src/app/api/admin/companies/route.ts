import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      include: {
        subscription: true,
        _count: {
          select: { members: true, posts: true },
        },
        members: {
          where: { role: 'OWNER' },
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count(),
  ])

  return NextResponse.json({ companies, total, page, limit })
}
