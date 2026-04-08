import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PLANS } from '@/lib/stripe'

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.companyMember.findMany({
    where: { companyId: params.id },
    include: {
      user: { select: { id: true, email: true, name: true, avatar: true, createdAt: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json({ members })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only company owner can invite members' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    const validRoles = ['OWNER', 'MANAGER', 'EDITOR', 'VIEWER']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check seat limit + look up target user in parallel
    const [subscription, targetUser] = await Promise.all([
      prisma.subscription.findUnique({
        where: { companyId: params.id },
        select: { plan: true },
      }),
      prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, avatar: true } }),
    ])

    if (subscription) {
      const planData = PLANS[subscription.plan as keyof typeof PLANS]
      const currentCount = await prisma.companyMember.count({ where: { companyId: params.id } })
      if (currentCount >= planData.seats) {
        return NextResponse.json(
          { error: `Seat limit of ${planData.seats} reached for your plan` },
          { status: 403 }
        )
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
    }

    const existing = await getMembership(params.id, targetUser.id)
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    const newMember = await prisma.companyMember.create({
      data: {
        companyId: params.id,
        userId: targetUser.id,
        role,
        canApprove: role === 'OWNER' || role === 'MANAGER',
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}
