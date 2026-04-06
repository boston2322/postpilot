import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'
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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { companyId: params.id }
  if (status) where.status = status
  if (platform) where.platform = platform

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true, avatar: true } },
        approver: { select: { id: true, name: true } },
        socialAccount: { select: { id: true, platform: true, accountName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, limit })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || member.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      content,
      platform,
      scheduledFor,
      isAiGenerated,
      hashtags,
      mediaUrls,
      socialAccountId,
      aiPrompt,
    } = body

    if (!content || !platform) {
      return NextResponse.json({ error: 'Content and platform are required' }, { status: 400 })
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: params.id },
    })

    if (!subscription || (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING')) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
    }

    const planData = PLANS[subscription.plan as keyof typeof PLANS]
    if (planData && planData.posts !== Infinity && subscription.postsUsedThisMonth >= planData.posts) {
      return NextResponse.json(
        { error: `Monthly post limit of ${planData.posts} reached` },
        { status: 403 }
      )
    }

    // Determine status
    const status: 'PENDING_APPROVAL' | 'SCHEDULED' | 'DRAFT' = isAiGenerated
      ? 'PENDING_APPROVAL'
      : scheduledFor
      ? 'SCHEDULED'
      : 'DRAFT'

    const post = await prisma.post.create({
      data: {
        companyId: params.id,
        creatorId: session.id,
        content,
        platform,
        status,
        hashtags: hashtags || [],
        mediaUrls: mediaUrls || [],
        socialAccountId: socialAccountId || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isAiGenerated: isAiGenerated || false,
        aiPrompt: aiPrompt || null,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    })

    // Add to queue if scheduled and not AI-generated (AI needs approval first)
    if (status === 'SCHEDULED' && socialAccountId) {
      await schedulePost(post.id, new Date(scheduledFor))
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
