import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function decodeState(state: string): { companyId: string; platform?: string } {
  return JSON.parse(Buffer.from(state, 'base64url').toString())
}

async function exchangeInstagramToken(code: string, redirectUri: string) {
  // Step 1: Exchange code for Facebook User Access Token
  // Use INSTAGRAM_APP_ID if set, otherwise fall back to FACEBOOK_APP_ID
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID!
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET!

  const res = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })
  const data = await res.json()

  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)
  }

  // Helper: given a list of pages, find all Instagram Business Accounts
  type IgFound = { accountId: string; accountName: string; pageToken: string }
  async function findIgAccounts(pages: Array<{ id: string; name: string; access_token: string }>): Promise<IgFound[]> {
    const found: IgFound[] = []
    for (const page of pages) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        const igData = await igRes.json()
        if (igData.instagram_business_account?.id) {
          const igInfoRes = await fetch(
            `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name&access_token=${page.access_token}`
          )
          const igInfo = await igInfoRes.json()
          const id = igInfo.id || igData.instagram_business_account.id
          const name = igInfo.username || igInfo.name || 'Instagram Account'
          // Avoid duplicates
          if (!found.some(f => f.accountId === id)) {
            found.push({ accountId: id, accountName: name, pageToken: page.access_token })
            console.log(`[IG OAuth] found IG account: ${name} (${id}) via page ${page.id}`)
          }
        }
      } catch (e) {
        console.error(`[IG OAuth] error checking page ${page.id}:`, e)
      }
    }
    return found
  }

  // Step 2a: Get personal Facebook Pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${data.access_token}`
  )
  const pagesData = await pagesRes.json()
  const personalPages: Array<{ id: string; name: string; access_token: string }> = pagesData.data || []
  console.log(`[IG OAuth] personal pages: ${personalPages.length}`)

  // Step 2b: Also check Business Manager pages (covers Meta Business Suite accounts)
  const bizPages: Array<{ id: string; name: string; access_token: string }> = []
  try {
    const bizRes = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${data.access_token}`
    )
    const bizData = await bizRes.json()
    const businesses: Array<{ id: string; name: string }> = bizData.data || []
    console.log(`[IG OAuth] businesses found: ${businesses.length}`)

    for (const biz of businesses) {
      // Get pages owned by this business
      const bpRes = await fetch(
        `https://graph.facebook.com/v18.0/${biz.id}/owned_pages?fields=id,name,access_token&access_token=${data.access_token}`
      )
      const bpData = await bpRes.json()
      if (bpData.data?.length) {
        console.log(`[IG OAuth] business ${biz.name} has ${bpData.data.length} pages`)
        bizPages.push(...bpData.data)
      }
    }
  } catch (e) {
    console.error('[IG OAuth] error fetching business pages:', e)
  }

  // Step 3: Find all Instagram accounts across personal + business pages
  const allPages = [...personalPages, ...bizPages]
  const igAccounts = await findIgAccounts(allPages)
  console.log(`[IG OAuth] total IG accounts found: ${igAccounts.length}`, igAccounts.map(a => a.accountName))

  // Step 4: If none found, fall back gracefully
  if (igAccounts.length === 0) {
    console.warn('[IG OAuth] no Instagram Business accounts found on any page')
    throw new Error(
      'No Instagram Business or Creator account found. Make sure your Instagram account is a Business or Creator account and is linked to a Facebook Page. In Instagram: Settings → Account → Switch to Professional Account.'
    )
  }

  // Return the first account found — if multiple, all will be saved by the caller loop
  const primary = igAccounts[0]
  console.log(`[IG OAuth] using: ${primary.accountName} (${primary.accountId})`)

  return {
    accessToken: primary.pageToken,
    refreshToken: null,
    accountId: primary.accountId,
    accountName: primary.accountName,
    tokenExpiry: null,
    allAccounts: igAccounts,
  } as {
    accessToken: string; refreshToken: null; accountId: string
    accountName: string; tokenExpiry: null
    allAccounts: IgFound[]
  }
}

async function exchangeFacebookToken(code: string, redirectUri: string) {
  const res = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: redirectUri,
      code,
    }),
  })
  const data = await res.json()

  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)
  }

  // Get Pages managed by this user
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${data.access_token}`
  )
  const pages = await pagesRes.json()
  const page = pages.data?.[0]

  if (page) {
    return {
      accessToken: page.access_token || data.access_token,
      refreshToken: null,
      accountId: page.id,
      accountName: page.name,
      tokenExpiry: null,
    }
  }

  // Fall back to Facebook user info if no pages
  const userRes = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${data.access_token}`
  )
  const user = await userRes.json()

  return {
    accessToken: data.access_token,
    refreshToken: null,
    accountId: user.id || `fb_${Date.now()}`,
    accountName: user.name || 'Facebook Account',
    tokenExpiry: null,
  }
}

async function exchangeXToken(code: string, redirectUri: string) {
  const credentials = Buffer.from(
    `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge',
    }),
  })
  const data = await res.json()

  // Get user info
  const userRes = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  const userData = await userRes.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    accountId: userData.data?.id || '',
    accountName: userData.data?.username || '',
    tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }
}

async function exchangeLinkedInToken(code: string, redirectUri: string) {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })
  const data = await res.json()

  // Get profile
  const profileRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  const profile = await profileRes.json()

  const firstName = profile.localizedFirstName || ''
  const lastName = profile.localizedLastName || ''

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    accountId: profile.id || '',
    accountName: `${firstName} ${lastName}`.trim() || 'LinkedIn Account',
    tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }
}

async function exchangeTikTokToken(code: string, redirectUri: string) {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = await res.json()

  // Get user info
  const userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username',
    { headers: { Authorization: `Bearer ${data.data?.access_token}` } }
  )
  const userData = await userRes.json()
  const user = userData.data?.user

  return {
    accessToken: data.data?.access_token || '',
    refreshToken: data.data?.refresh_token || null,
    accountId: user?.open_id || '',
    accountName: user?.display_name || user?.username || 'TikTok Account',
    tokenExpiry: data.data?.expires_in
      ? new Date(Date.now() + data.data.expires_in * 1000)
      : null,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=oauth_failed`)
  }

  let companyId: string
  let statePlatform: string | undefined
  try {
    const decoded = decodeState(state)
    companyId = decoded.companyId
    statePlatform = decoded.platform // set when Instagram uses /callback/facebook
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=invalid_state`)
  }

  // Instagram encodes platform='instagram' in state and redirects to /callback/facebook
  // because config_id overrides redirect_uri. Resolve the real platform here.
  const resolvedPlatform = statePlatform || params.platform
  const redirectUri = `${APP_URL}/api/social/callback/facebook` // always facebook for Meta
  const platform = resolvedPlatform.toUpperCase()

  try {
    // For Instagram, exchangeInstagramToken now returns allAccounts[]
    // so we can save every found account and let the user pick in Settings.
    if (resolvedPlatform.toLowerCase() === 'instagram') {
      const igData = await exchangeInstagramToken(code, redirectUri)

      // Delete all existing Instagram accounts for this company first
      const existing = await prisma.socialAccount.findMany({
        where: { companyId, platform: 'INSTAGRAM' },
      })
      // Save ALL found Instagram accounts
      const savedIds: string[] = []
      for (const ig of igData.allAccounts) {
        const enc = encrypt(ig.pageToken)
        const saved = await prisma.socialAccount.upsert({
          where: { companyId_platform_accountId: { companyId, platform: 'INSTAGRAM', accountId: ig.accountId } },
          update: { accessToken: enc, accountName: ig.accountName, isActive: true, refreshToken: null, tokenExpiry: null },
          create: { companyId, platform: 'INSTAGRAM', accountId: ig.accountId, accountName: ig.accountName, accessToken: enc, refreshToken: null, tokenExpiry: null, isActive: true },
        })
        savedIds.push(saved.id)
      }

      // Clean up any old accounts that weren't in the new set
      for (const old of existing) {
        if (!savedIds.includes(old.id)) {
          // Re-link posts to first saved account before deleting
          if (savedIds[0]) {
            await prisma.post.updateMany({ where: { socialAccountId: old.id }, data: { socialAccountId: savedIds[0] } })
          }
          await prisma.socialAccount.delete({ where: { id: old.id } })
        }
      }

      // If multiple accounts found, redirect to settings with a flag to let user pick
      const multiFlag = igData.allAccounts.length > 1 ? '&pick_instagram=1' : ''
      return NextResponse.redirect(
        `${APP_URL}/company/${companyId}/settings?connected=1&platform=INSTAGRAM${multiFlag}&tab=social`
      )
    }

    // All other platforms
    let tokenData: {
      accessToken: string
      refreshToken: string | null
      accountId: string
      accountName: string
      tokenExpiry: Date | null
    }

    switch (resolvedPlatform.toLowerCase()) {
      case 'facebook':
        tokenData = await exchangeFacebookToken(code, redirectUri)
        break
      case 'x':
        tokenData = await exchangeXToken(code, redirectUri)
        break
      case 'linkedin':
        tokenData = await exchangeLinkedInToken(code, redirectUri)
        break
      case 'tiktok':
        tokenData = await exchangeTikTokToken(code, redirectUri)
        break
      default:
        return NextResponse.redirect(`${APP_URL}/dashboard?error=unsupported_platform`)
    }

    const encryptedAccess = encrypt(tokenData.accessToken)
    const encryptedRefresh = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null

    const existingAccounts = await prisma.socialAccount.findMany({
      where: { companyId, platform: platform as any },
    })

    const savedAccount = await prisma.socialAccount.upsert({
      where: { companyId_platform_accountId: { companyId, platform: platform as any, accountId: tokenData.accountId } },
      update: { accessToken: encryptedAccess, refreshToken: encryptedRefresh, tokenExpiry: tokenData.tokenExpiry, accountName: tokenData.accountName, isActive: true },
      create: { companyId, platform: platform as any, accountId: tokenData.accountId, accountName: tokenData.accountName, accessToken: encryptedAccess, refreshToken: encryptedRefresh, tokenExpiry: tokenData.tokenExpiry, isActive: true },
    })

    const staleAccounts = existingAccounts.filter((a) => a.id !== savedAccount.id)
    for (const stale of staleAccounts) {
      await prisma.post.updateMany({ where: { socialAccountId: stale.id }, data: { socialAccountId: savedAccount.id } })
      await prisma.socialAccount.delete({ where: { id: stale.id } })
    }

    return NextResponse.redirect(
      `${APP_URL}/company/${companyId}/settings?connected=1&platform=${resolvedPlatform.toUpperCase()}&tab=social`
    )
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'connection_failed'
    console.error('OAuth callback error:', err)
    // Pass the error message so settings page can show it
    const encodedErr = encodeURIComponent(errMsg.slice(0, 200))
    return NextResponse.redirect(`${APP_URL}/company/${companyId}/settings?error=${encodedErr}&tab=social`)
  }
}
