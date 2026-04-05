import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  // Verify membership
  const member = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId: session.id } },
  })

  if (!member && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { companyId, isActive: true },
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      tokenExpiry: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ accounts })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
  }

  const account = await prisma.socialAccount.findUnique({ where: { id } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Verify membership
  const member = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId: account.companyId, userId: session.id } },
  })

  if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.socialAccount.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
