import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { extractBrandData } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, url } = body

    if (!companyId || !url) {
      return NextResponse.json({ error: 'companyId and url are required' }, { status: 400 })
    }

    // Verify membership
    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: session.id } },
    })

    if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const brandData = await extractBrandData(url)

    await prisma.company.update({
      where: { id: companyId },
      data: { brandData: brandData as any },
    })

    return NextResponse.json({ brandData })
  } catch (error) {
    console.error('Brand crawl error:', error)
    return NextResponse.json({ error: 'Failed to extract brand data' }, { status: 500 })
  }
}
