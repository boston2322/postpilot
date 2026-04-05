import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.companyId
        const plan = session.metadata?.plan

        if (!companyId || !plan) break

        // Retrieve the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await prisma.subscription.upsert({
          where: { companyId },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            plan: plan as any,
            status: 'ACTIVE',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            postsUsedThisMonth: 0,
          },
          create: {
            companyId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            plan: plan as any,
            status: 'ACTIVE',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            postsUsedThisMonth: 0,
          },
        })

        console.log(`Subscription created for company ${companyId}, plan ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find company by stripeSubscriptionId
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (!existing) break

        // Try to determine plan from price
        let plan = existing.plan
        const priceId = subscription.items.data[0]?.price?.id
        if (priceId) {
          if (priceId === process.env.STRIPE_STARTER_PRICE_ID) plan = 'STARTER'
          else if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) plan = 'GROWTH'
          else if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'PRO'
        }

        const statusMap: Record<string, string> = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          trialing: 'TRIALING',
        }

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan,
            status: (statusMap[subscription.status] || 'ACTIVE') as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELED' },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: 'PAST_DUE' },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Reset monthly post count on new billing period
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: {
            status: 'ACTIVE',
            postsUsedThisMonth: 0,
          },
        })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
