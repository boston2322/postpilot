import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId } = body

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    // Verify membership
    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: session.id } },
    })

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only company owner can manage billing' }, { status: 403 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    const url = await createPortalSession(subscription.stripeCustomerId)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
