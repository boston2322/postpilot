// Plan constants - safe to import in both client and server components
// The Stripe instance is NOT here - use src/lib/stripe.ts for server-side Stripe operations

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 29,
    posts: 10,
    companies: 1,
    seats: 2,
  },
  GROWTH: {
    name: 'Growth',
    price: 79,
    posts: 60,
    companies: 3,
    seats: 5,
  },
  PRO: {
    name: 'Pro',
    price: 149,
    posts: Infinity,
    companies: Infinity,
    seats: 10,
  },
} as const
