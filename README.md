# PostPilot — AI-Powered Social Media Automation

A production-ready SaaS platform for automated social media content creation and scheduling using AI.

## Tech Stack

- **Framework**: Next.js 14 App Router (TypeScript)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Custom JWT with `jose` + bcrypt
- **Payments**: Stripe (checkout + customer portal + webhooks)
- **AI**: OpenAI gpt-4o-mini
- **Queue**: BullMQ + ioredis
- **Encryption**: AES-256-GCM for social OAuth tokens

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Stripe account
- OpenAI API key
- Social platform developer accounts (optional for full functionality)

---

## Installation

```bash
git clone <repo>
cd postpilot-v2
npm install
```

---

## Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | At least 32 chars, used to sign JWTs |
| `ENCRYPTION_KEY` | 32-byte hex string (64 hex chars) for AES-256-GCM |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret (`whsec_...`) |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for $29/mo plan |
| `STRIPE_GROWTH_PRICE_ID` | Stripe Price ID for $79/mo plan |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for $149/mo plan |
| `OPENAI_API_KEY` | OpenAI API key (`sk-...`) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

1. Create a PostgreSQL database named `postpilot`
2. Push the schema:

```bash
npm run db:push
```

3. Seed the database (creates admin user + demo company):

```bash
npm run db:seed
```

Admin credentials: `bostonchamberlain@icloud.com` / `Leon1das`

---

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create three subscription products in the Stripe dashboard:
   - **Starter**: $29/month recurring
   - **Growth**: $79/month recurring
   - **Pro**: $149/month recurring
3. Copy each Price ID to your `.env`
4. Set up a webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Social Media API Setup

### Instagram & Facebook

1. Create a Meta Developer app at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display and Instagram Content Publishing APIs
3. Add Facebook Login and Pages API
4. Set OAuth redirect URIs:
   - `http://localhost:3000/api/social/callback/instagram`
   - `http://localhost:3000/api/social/callback/facebook`
5. Copy App ID and Secret to `.env`

### X (Twitter)

1. Create a developer app at [developer.twitter.com](https://developer.twitter.com)
2. Enable OAuth 2.0 with `tweet.read`, `tweet.write`, `users.read`, `offline.access` scopes
3. Set callback URL: `http://localhost:3000/api/social/callback/x`
4. Copy Client ID and Client Secret to `.env`

### LinkedIn

1. Create an app at [linkedin.com/developers](https://www.linkedin.com/developers)
2. Request `r_liteprofile`, `r_emailaddress`, `w_member_social` permissions
3. Add redirect URL: `http://localhost:3000/api/social/callback/linkedin`
4. Copy Client ID and Secret to `.env`

### TikTok

1. Register at [developers.tiktok.com](https://developers.tiktok.com)
2. Create an app and request `user.info.basic`, `video.publish`, `video.upload` scopes
3. Add redirect URL: `http://localhost:3000/api/social/callback/tiktok`
4. Copy Client Key and Secret to `.env`

---

## Running the App

### Development

```bash
# Terminal 1 - Next.js dev server
npm run dev

# Terminal 2 - BullMQ worker (processes scheduled posts)
npm run worker
```

### Production Build

```bash
npm run build
npm start
```

---

## Running the Queue Worker

The queue worker is a separate process that processes scheduled posts:

```bash
npm run worker
```

The worker:
- Listens for jobs on the `posts` Redis queue
- Decrypts OAuth tokens using AES-256-GCM
- Calls the appropriate social media API
- Marks posts as PUBLISHED or FAILED
- Retries up to 3 times with 5-minute delays on failure
- Resets monthly post count on new billing periods

In production, run the worker as a separate service (e.g., a separate Heroku dyno or Docker container).

---

## Business Rules

1. **No free plan** — All users must subscribe to use the platform
2. **Plans**:
   - Starter: $29/mo — 30 posts, 1 company, 2 seats
   - Growth: $79/mo — 150 posts, 3 companies, 5 seats
   - Pro: $149/mo — Unlimited posts, unlimited companies, 10 seats
3. **AI posts require approval** — AI-generated content is never auto-published
4. **Team roles**: OWNER > MANAGER > EDITOR > VIEWER
5. **Per-company subscriptions** — Each company has its own billing

---

## Deploying to Vercel

1. Push your code to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy

**Important**: The BullMQ worker cannot run on Vercel (serverless). Use a separate server or service like Railway, Fly.io, or a VPS for the worker process.

For the worker on Railway:

```toml
# railway.toml
[deploy]
startCommand = "npm run worker"
```

---

## Project Structure

```
src/
  app/
    api/          # API routes
    auth/         # Login/signup pages
    dashboard/    # User dashboard
    company/      # Company workspace
    admin/        # Admin panel
  components/     # Shared UI components
  lib/            # Utilities (auth, prisma, openai, stripe, queue)
  types/          # TypeScript types
prisma/
  schema.prisma   # Database schema
  seed.ts         # Seed script
worker.ts         # BullMQ worker
```

---

## Admin Access

The admin account is pre-configured:
- Email: `bostonchamberlain@icloud.com`
- Password: `Leon1das`

Admin can:
- View all users and companies
- Suspend/unsuspend users
- Change subscription plans
- Delete users and companies
- View platform-wide stats
