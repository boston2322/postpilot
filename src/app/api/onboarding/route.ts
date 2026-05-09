import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'

// POST /api/onboarding
// Creates a company and returns a Stripe checkout URL with 7-day trial
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyName, plan } = body

    if (!companyName || !plan) {
      return NextResponse.json({ error: 'Company name and plan are required' }, { status: 400 })
    }

    const validPlans = ['STARTER', 'GROWTH', 'PRO']
    if (!validPlans.includes(plan.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create the company (no subscription yet — Stripe webhook will create it)
    const company = await prisma.company.create({
      data: {
        name: companyName,
        members: {
          create: {
            userId: session.id,
            role: 'OWNER',
            canApprove: true,
          },
        },
      },
    })

    // Create Stripe checkout with 7-day trial
    const checkoutUrl = await createCheckoutSession(
      company.id,
      plan,
      session.id,
      session.email,
      true // withTrial = true
    )

    return NextResponse.json({ url: checkoutUrl, companyId: company.id })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 })
  }
}
