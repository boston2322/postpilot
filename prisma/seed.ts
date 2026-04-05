import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Leon1das', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'bostonchamberlain@icloud.com' },
    update: {},
    create: {
      email: 'bostonchamberlain@icloud.com',
      passwordHash,
      name: 'Boston Chamberlain',
      isAdmin: true,
    },
  })

  console.log('Admin user created:', admin.email)

  const company = await prisma.company.upsert({
    where: { id: 'seed-demo-company' },
    update: {},
    create: {
      id: 'seed-demo-company',
      name: 'PostPilot Demo',
      website: 'https://postpilot.ai',
      brandData: {
        tone: 'Professional yet approachable',
        keywords: ['automation', 'social media', 'AI', 'growth', 'content'],
        audience: 'Marketing professionals and small business owners',
        style: 'Modern, clean, results-focused',
        description: 'AI-powered social media automation platform',
      },
    },
  })

  console.log('Demo company created:', company.name)

  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      companyId: company.id,
      userId: admin.id,
      role: 'OWNER',
      canApprove: true,
    },
  })

  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      plan: 'STARTER',
      status: 'ACTIVE',
      postsUsedThisMonth: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('Subscription created for demo company')
  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
