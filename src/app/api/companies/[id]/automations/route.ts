import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { addDays, addWeeks, addMonths, setHours, setMinutes } from 'date-fns'

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
}

function calculateNextRun(
  frequency: string,
  postingTime: string,
  timezone: string = 'UTC'
): Date {
  const now = new Date()
  const [hours, minutes] = postingTime.split(':').map(Number)

  let next = new Date(now)
  next = setHours(next, hours)
  next = setMinutes(next, minutes)
  next.setSeconds(0, 0)

  // If the time has already passed today, start from tomorrow
  if (next <= now) {
    next = addDays(next, 1)
  }

  switch (frequency) {
    case 'DAILY':
      return next
    case 'WEEKLY':
      return addWeeks(now, 1)
    case 'BIWEEKLY':
      return addWeeks(now, 2)
    case 'MONTHLY':
      return addMonths(now, 1)
    default:
      return next
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const automations = await prisma.automation.findMany({
    where: { companyId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ automations })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      platforms,
      frequency,
      postingTime,
      timezone,
      contentType,
      aiPrompt,
      cronExpr,
    } = body

    if (!name || !platforms || !frequency) {
      return NextResponse.json({ error: 'Name, platforms, and frequency are required' }, { status: 400 })
    }

    const nextRunAt = calculateNextRun(
      frequency,
      postingTime || '09:00',
      timezone || 'UTC'
    )

    const automation = await prisma.automation.create({
      data: {
        companyId: params.id,
        name,
        description: description || null,
        platforms: platforms || [],
        frequency,
        postingTime: postingTime || '09:00',
        timezone: timezone || 'UTC',
        contentType: contentType || 'ai',
        aiPrompt: aiPrompt || null,
        cronExpr: cronExpr || null,
        nextRunAt,
        isActive: true,
      },
    })

    return NextResponse.json({ automation }, { status: 201 })
  } catch (error) {
    console.error('Create automation error:', error)
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
  }
}
