import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const post = await prisma.post.findFirst({
    where: { id: params.postId, companyId: params.id },
    include: {
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      approver: { select: { id: true, name: true } },
      socialAccount: true,
    },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  return NextResponse.json({ post })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || member.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const post = await prisma.post.findFirst({
    where: { id: params.postId, companyId: params.id },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { content, scheduledFor, status, hashtags, mediaUrls, socialAccountId } = body

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (hashtags !== undefined) updateData.hashtags = hashtags
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls
    if (socialAccountId !== undefined) updateData.socialAccountId = socialAccountId
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
    if (status !== undefined) updateData.status = status

    const updated = await prisma.post.update({
      where: { id: params.postId },
      data: updateData,
    })

    // If approved + has social account + has scheduledFor, add to queue
    if (status === 'APPROVED' && updated.socialAccountId && updated.scheduledFor) {
      await prisma.post.update({
        where: { id: params.postId },
        data: { status: 'SCHEDULED' },
      })
      await schedulePost(params.postId, updated.scheduledFor)
    }

    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || member.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const post = await prisma.post.findFirst({
    where: { id: params.postId, companyId: params.id },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Only creator or OWNER/MANAGER can delete
  if (post.creatorId !== session.id && !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id: params.postId } })

  return NextResponse.json({ success: true })
}
