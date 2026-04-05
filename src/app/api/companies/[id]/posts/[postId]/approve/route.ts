import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId: params.id, userId: session.id } },
  })

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if user can approve
  const canApprove =
    member.canApprove || member.role === 'OWNER' || member.role === 'MANAGER'

  if (!canApprove) {
    return NextResponse.json({ error: 'You do not have permission to approve posts' }, { status: 403 })
  }

  const post = await prisma.post.findFirst({
    where: { id: params.postId, companyId: params.id },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  if (post.status !== 'PENDING_APPROVAL') {
    return NextResponse.json(
      { error: 'Only posts in PENDING_APPROVAL status can be approved' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { action } = body // 'approve' or 'reject'

    if (action === 'reject') {
      const updated = await prisma.post.update({
        where: { id: params.postId },
        data: {
          status: 'REJECTED',
          approverId: session.id,
        },
      })
      return NextResponse.json({ post: updated })
    }

    // Approve
    const newStatus: 'APPROVED' | 'SCHEDULED' =
      post.scheduledFor && post.socialAccountId ? 'SCHEDULED' : 'APPROVED'

    const updated = await prisma.post.update({
      where: { id: params.postId },
      data: {
        status: newStatus,
        approverId: session.id,
      },
    })

    // Add to queue if scheduled
    if (newStatus === 'SCHEDULED' && post.scheduledFor) {
      await schedulePost(params.postId, post.scheduledFor)
    }

    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('Approve post error:', error)
    return NextResponse.json({ error: 'Failed to approve post' }, { status: 500 })
  }
}
