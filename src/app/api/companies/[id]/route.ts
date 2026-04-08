import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      subscription: true,
      members: {
        include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
      },
      socialAccounts: {
        select: { id: true, platform: true, accountName: true, accountId: true, isActive: true },
      },
      _count: { select: { posts: true } },
    },
  })

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  return NextResponse.json({ company })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, website, logoUrl, avoidList } = body

    // If avoidList is provided, merge into existing brandData
    let brandDataUpdate: Record<string, unknown> | undefined
    if (avoidList !== undefined) {
      const existing = await prisma.company.findUnique({
        where: { id: params.id },
        select: { brandData: true },
      })
      const existingBrand = (existing?.brandData as Record<string, unknown>) || {}
      brandDataUpdate = { ...existingBrand, avoidList }
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(website !== undefined && { website }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(brandDataUpdate !== undefined && { brandData: brandDataUpdate }),
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Update company error:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only company owner can delete' }, { status: 403 })
  }

  await prisma.company.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
