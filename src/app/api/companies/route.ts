import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.companyMember.findMany({
    where: { userId: session.id },
    include: {
      company: {
        include: {
          subscription: true,
          _count: {
            select: { members: true, posts: true },
          },
        },
      },
    },
  })

  const companies = memberships.map((m) => ({
    ...m.company,
    role: m.role,
    canApprove: m.canApprove,
  }))

  return NextResponse.json({ companies })
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, website } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        name,
        website: website || null,
        members: {
          create: {
            userId: session.id,
            role: 'OWNER',
            canApprove: true,
          },
        },
      },
      include: {
        subscription: true,
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('Create company error:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
