import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'

// Debug endpoint: GET /api/social/debug?companyId=xxx
// Returns token metadata + live validation against both Instagram and Facebook APIs.
// Requires authentication. Never returns the full token.
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const accounts = await prisma.socialAccount.findMany({
    where: { companyId, platform: 'INSTAGRAM' },
    select: { id: true, accountId: true, accountName: true, accessToken: true, isActive: true, tokenExpiry: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const results = await Promise.all(
    accounts.map(async (account) => {
      let tokenInfo: Record<string, unknown> = { error: 'Could not decrypt' }
      let igValidation: Record<string, unknown> = {}
      let fbValidation: Record<string, unknown> = {}

      try {
        const token = decrypt(account.accessToken)
        tokenInfo = {
          length: token.length,
          prefix: token.substring(0, 10),
          type: token.startsWith('EAA') ? 'Facebook Page Token' : token.startsWith('IG') ? 'Instagram Token' : 'Unknown',
        }

        // Test against Instagram API
        const igRes = await fetch(
          `https://graph.instagram.com/v21.0/${account.accountId}?fields=id,username&access_token=${token}`
        )
        igValidation = await igRes.json().catch(() => ({ error: `HTTP ${igRes.status}` }))

        // Test against Facebook API (in case it's a FB token)
        const fbRes = await fetch(
          `https://graph.facebook.com/v18.0/${account.accountId}?fields=id,name&access_token=${token}`
        )
        fbValidation = await fbRes.json().catch(() => ({ error: `HTTP ${fbRes.status}` }))
      } catch (e) {
        tokenInfo = { error: String(e) }
      }

      return {
        accountId: account.accountId,
        accountName: account.accountName,
        isActive: account.isActive,
        tokenExpiry: account.tokenExpiry,
        createdAt: account.createdAt,
        tokenInfo,
        igApiResponse: igValidation,
        fbApiResponse: fbValidation,
      }
    })
  )

  return NextResponse.json({ accounts: results })
}
