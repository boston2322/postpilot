import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { addDays, addWeeks, addMonths, setHours, setMinutes } from 'date-fns'

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  })
}

function calculateNextRun(frequency: string, postingTime: string): Date {
  const now = new Date()
  const [hours, minutes] = postingTime.split(':').map(Number)

  let next = new Date(now)
  next = setHours(next, hours)
  next = setMinutes(next, minutes)
  next.setSeconds(0, 0)

  if (next <= now) {
    next = addDays(next, 1)
  }

  switch (frequency) {
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
  { params }: { params: { id: string; autoId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member && !session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const automation = await prisma.automation.findFirst({
    where: { id: params.autoId, companyId: params.id },
  })

  if (!automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 })

  return NextResponse.json({ automation })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; autoId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const existing = await prisma.automation.findFirst({
    where: { id: params.autoId, companyId: params.id },
  })

  if (!existing) return NextResponse.json({ error: 'Automation not found' }, { status: 404 })

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
      isActive,
      cronExpr,
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (platforms !== undefined) updateData.platforms = platforms
    if (frequency !== undefined) updateData.frequency = frequency
    if (postingTime !== undefined) updateData.postingTime = postingTime
    if (timezone !== undefined) updateData.timezone = timezone
    if (contentType !== undefined) updateData.contentType = contentType
    if (aiPrompt !== undefined) updateData.aiPrompt = aiPrompt
    if (isActive !== undefined) updateData.isActive = isActive
    if (cronExpr !== undefined) updateData.cronExpr = cronExpr

    // Recalculate nextRunAt if frequency or postingTime changed
    if (frequency || postingTime) {
      updateData.nextRunAt = calculateNextRun(
        frequency || existing.frequency,
        postingTime || existing.postingTime
      )
    }

    const automation = await prisma.automation.update({
      where: { id: params.autoId },
      data: updateData,
    })

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Update automation error:', error)
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; autoId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await getMembership(params.id, session.id)
  if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const automation = await prisma.automation.findFirst({
    where: { id: params.autoId, companyId: params.id },
  })

  if (!automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 })

  await prisma.automation.delete({ where: { id: params.autoId } })

  return NextResponse.json({ success: true })
}
