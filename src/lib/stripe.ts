import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_test_...')) return null
  return new Stripe(key, { apiVersion: '2023-10-16' })
}

// Payment links created in Stripe dashboard
const PAYMENT_LINKS: Record<string, string> = {
  STARTER: 'https://buy.stripe.com/8x27sL4Xr0cZcfF0XHbV605',
  GROWTH:  'https://buy.stripe.com/5kQ00jfC5bVH3J9fSBbV604',
  PRO:     'https://buy.stripe.com/5kQ00j2Pj3pb4NdcGpbV603',
}

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    posts: Infinity,
    companies: Infinity,
    seats: Infinity,
    priceId: '',
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    posts: 10,
    companies: 1,
    seats: 2,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  GROWTH: {
    name: 'Growth',
    price: 79,
    posts: 60,
    companies: 3,
    seats: 5,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || '',
  },
  PRO: {
    name: 'Pro',
    price: 149,
    posts: Infinity,
    companies: Infinity,
    seats: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postpilot-v2-three.vercel.app'

  // Use payment links — works without needing Stripe API keys configured
  const stripeInstance = getStripe()
  if (stripeInstance && planData.priceId) {
    // Full API checkout session when secret key + price IDs are set
    const session = await stripeInstance.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: planData.priceId, quantity: 1 }],
      metadata: { companyId, userId, plan: planKey },
      success_url: `${appUrl}/company/${companyId}?subscribed=1`,
      cancel_url: `${appUrl}/dashboard`,
    })
    return session.url!
  }

  // Fallback: redirect to Stripe payment link with prefilled email & reference
  const baseLink = PAYMENT_LINKS[planKey]
  const params = new URLSearchParams({
    prefilled_email: customerEmail,
    client_reference_id: `${companyId}__${planKey}`,
  })
  return `${baseLink}?${params.toString()}`
}

export async function createPortalSession(customerId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postpilot-v2-three.vercel.app'
  const stripeInstance = getStripe()
  if (!stripeInstance) return `${appUrl}/dashboard`

  const session = await stripeInstance.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  })

  return session.url
}
