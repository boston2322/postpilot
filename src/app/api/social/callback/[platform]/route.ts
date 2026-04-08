import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function decodeState(state: string): { companyId: string } {
  return JSON.parse(Buffer.from(state, 'base64url').toString())
}

async function exchangeInstagramToken(code: string, redirectUri: string) {
  // Step 1: Exchange code for Facebook User Access Token (Facebook Login for Business)
  const res = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      redirect_uri: redirectUri,
      code,
    }),
  })
  const data = await res.json()

  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)
  }

  // Step 2: Get user's Facebook Pages (needed to find connected Instagram Business account)
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${data.access_token}`
  )
  const pagesData = await pagesRes.json()

  // Step 3: Find Instagram Business account connected to a Page
  let igAccountId = ''
  let igAccountName = ''
  let igPageAccessToken = data.access_token // default to user token; overridden below

  if (pagesData.data?.length > 0) {
    for (const page of pagesData.data) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        const igData = await igRes.json()

        if (igData.instagram_business_account?.id) {
          const igInfoRes = await fetch(
            `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username&access_token=${page.access_token}`
          )
          const igInfo = await igInfoRes.json()
          igAccountId = igInfo.id || igData.instagram_business_account.id
          igAccountName = igInfo.username || 'Instagram Account'
          // IMPORTANT: Instagram Content Publishing API requires the Page access token,
          // not the user-level token. Store the page token here.
          igPageAccessToken = page.access_token
          break
        }
      } catch {
        // continue to next page
      }
    }
  }

  // Step 4: Fall back to Facebook user info if no Instagram Business account found
  if (!igAccountId) {
    const userRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${data.access_token}`
    )
    const user = await userRes.json()
    igAccountId = user.id || `fb_${Date.now()}`
    igAccountName = user.name || 'Instagram Account'
  }

  return {
    accessToken: igPageAccessToken,
    refreshToken: null,
    accountId: igAccountId,
    accountName: igAccountName,
    tokenExpiry: null,
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
  try {
    const decoded = decodeState(state)
    companyId = decoded.companyId
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=invalid_state`)
  }

  const redirectUri = `${APP_URL}/api/social/callback/${params.platform}`
  const platform = params.platform.toUpperCase()

  try {
    let tokenData: {
      accessToken: string
      refreshToken: string | null
      accountId: string
      accountName: string
      tokenExpiry: Date | null
    }

    switch (params.platform.toLowerCase()) {
      case 'instagram':
        tokenData = await exchangeInstagramToken(code, redirectUri)
        break
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

    await prisma.socialAccount.upsert({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform: platform as any,
          accountId: tokenData.accountId,
        },
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiry: tokenData.tokenExpiry,
        accountName: tokenData.accountName,
        isActive: true,
      },
      create: {
        companyId,
        platform: platform as any,
        accountId: tokenData.accountId,
        accountName: tokenData.accountName,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiry: tokenData.tokenExpiry,
        isActive: true,
      },
    })

    return NextResponse.redirect(
      `${APP_URL}/company/${companyId}/settings?connected=1&platform=${platform}`
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/company/${companyId}/settings?error=connection_failed`)
  }
}
