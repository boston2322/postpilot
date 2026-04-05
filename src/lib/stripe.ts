import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 29,
    posts: 30,
    companies: 1,
    seats: 2,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
  },
  GROWTH: {
    name: 'Growth',
    price: 79,
    posts: 150,
    companies: 3,
    seats: 5,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
  },
  PRO: {
    name: 'Pro',
    price: 149,
    posts: Infinity,
    companies: Infinity,
    seats: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
}

export async function createCheckoutSession(
  companyId: string,
  plan: string,
  userId: string,
  customerEmail: string
): Promise<string> {
  const planKey = plan.toUpperCase() as keyof typeof PLANS
  const planData = PLANS[planKey]

  if (!planData) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price: planData.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      companyId,
      userId,
      plan: planKey,
    },
    success_url: `${appUrl}/company/${companyId}?subscribed=1`,
    cancel_url: `${appUrl}/dashboard`,
  })

  return session.url!
}

export async function createPortalSession(customerId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  })

  return session.url
}
