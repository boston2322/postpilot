import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { schedulePost } from '@/lib/queue'
import { publishPost } from '@/lib/publish'
import { friendlyError } from '@/lib/publishErrors'

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

  const canApprove =
    member.canApprove || member.role === 'OWNER' || member.role === 'MANAGER'

  if (!canApprove) {
    return NextResponse.json(
      { error: 'You do not have permission to approve posts' },
      { status: 403 }
    )
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
        data: { status: 'REJECTED', approverId: session.id },
      })
      return NextResponse.json({ post: updated })
    }

    // ── APPROVE ──────────────────────────────────────────────────────────────
    const hasSchedule = !!post.scheduledFor && !!post.socialAccountId
    const postNow = !post.scheduledFor && !!post.socialAccountId

    if (postNow) {
      // No scheduled date + has an account → publish immediately, bypass queue
      await prisma.post.update({
        where: { id: params.postId },
        data: { status: 'SCHEDULED', approverId: session.id },
      })

      try {
        const result = await publishPost(params.postId)
        const updated = await prisma.post.update({
          where: { id: params.postId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            externalId: result.externalId || null,
            failureReason: null,
          },
        })
        return NextResponse.json({ post: updated })
      } catch (publishError) {
        const raw = publishError instanceof Error ? publishError.message : 'Unknown publish error'
        const friendly = friendlyError(raw)
        // Store as JSON so the UI can show code + hint separately
        const failureReason = JSON.stringify(friendly)
        const updated = await prisma.post.update({
          where: { id: params.postId },
          data: {
            status: 'FAILED',
            failureReason,
            retryCount: { increment: 1 },
          },
        })
        return NextResponse.json({ post: updated, warning: friendly.message })
      }
    }

    if (hasSchedule) {
      // Has a future date → SCHEDULED, add to queue
      const updated = await prisma.post.update({
        where: { id: params.postId },
        data: { status: 'SCHEDULED', approverId: session.id },
      })
      await schedulePost(params.postId, new Date(post.scheduledFor!))
      return NextResponse.json({ post: updated })
    }

    // No account linked → just APPROVED
    const updated = await prisma.post.update({
      where: { id: params.postId },
      data: { status: 'APPROVED', approverId: session.id },
    })
    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('Approve post error:', error)
    return NextResponse.json({ error: 'Failed to approve post' }, { status: 500 })
  }
}
