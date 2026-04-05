import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { plan, status } = body

    if (plan || status) {
      await prisma.subscription.upsert({
        where: { companyId: params.id },
        update: {
          ...(plan && { plan }),
          ...(status && { status }),
        },
        create: {
          companyId: params.id,
          plan: plan || 'STARTER',
          status: status || 'ACTIVE',
        },
      })
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: { subscription: true },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Admin update company error:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await prisma.company.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete company error:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
