import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const callerMember = await getMembership(params.id, session.id)
  if (!callerMember || callerMember.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only company owner can update member roles' }, { status: 403 })
  }

  const target = await prisma.companyMember.findFirst({
    where: { id: params.memberId, companyId: params.id },
  })

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { role, canApprove } = body

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) {
      const validRoles = ['OWNER', 'MANAGER', 'EDITOR', 'VIEWER']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }
    if (canApprove !== undefined) updateData.canApprove = canApprove

    const updated = await prisma.companyMember.update({
      where: { id: params.memberId },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const callerMember = await getMembership(params.id, session.id)
  if (!callerMember || callerMember.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only company owner can remove members' }, { status: 403 })
  }

  const target = await prisma.companyMember.findFirst({
    where: { id: params.memberId, companyId: params.id },
  })

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Cannot remove self
  if (target.userId === session.id) {
    return NextResponse.json({ error: 'Cannot remove yourself from the company' }, { status: 400 })
  }

  await prisma.companyMember.delete({ where: { id: params.memberId } })

  return NextResponse.json({ success: true })
}
