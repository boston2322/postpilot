import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generatePost, type BrandData } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, platform, topic, tone } = body

    if (!companyId || !platform) {
      return NextResponse.json({ error: 'companyId and platform are required' }, { status: 400 })
    }

    // Verify membership
    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: session.id } },
    })

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { brandData: true, name: true },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const brandData: BrandData = (company.brandData as BrandData) || {
      tone: 'Professional',
      keywords: [],
      audience: 'General audience',
      style: 'Clean and modern',
      description: company.name,
    }

    const result = await generatePost({ platform, brandData, topic, tone })

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI generate error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
