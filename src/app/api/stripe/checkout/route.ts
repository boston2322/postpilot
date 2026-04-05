import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, plan } = body

    if (!companyId || !plan) {
      return NextResponse.json({ error: 'companyId and plan are required' }, { status: 400 })
    }

    const validPlans = ['STARTER', 'GROWTH', 'PRO']
    if (!validPlans.includes(plan.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Verify membership
    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: session.id } },
    })

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only company owner can manage billing' }, { status: 403 })
    }

    const url = await createCheckoutSession(companyId, plan, session.id, session.email)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
