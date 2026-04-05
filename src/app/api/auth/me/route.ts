import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, isAdmin: true, isSuspended: true, avatar: true },
  })

  if (!user || user.isSuspended) {
    return NextResponse.json({ error: 'User not found or suspended' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
