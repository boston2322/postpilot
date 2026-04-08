import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function encodeState(companyId: string, platform?: string): string {
  return Buffer.from(JSON.stringify({ companyId, ...(platform ? { platform } : {}) })).toString('base64url')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  let authUrl: string

  switch (params.platform.toLowerCase()) {
    case 'facebook': {
      // Facebook uses config_id which controls approved permissions.
      // config_id also overrides redirect_uri to its own whitelisted URL,
      // so we always redirect to /callback/facebook for Meta platforms.
      const state = encodeState(companyId)
      const redirectUri = `${APP_URL}/api/social/callback/facebook`
      const appId = process.env.FACEBOOK_APP_ID
      const configId = process.env.META_CONFIG_ID || '2219336948472997'
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&state=${state}&response_type=code`
      break
    }

    case 'instagram': {
      // config_id overrides redirect_uri — so Instagram must also redirect to /callback/facebook.
      // We encode platform='instagram' in state so the callback knows to run
      // exchangeInstagramToken instead of exchangeFacebookToken.
      // This avoids needing App Review for instagram_basic / instagram_content_publish scopes.
      const state = encodeState(companyId, 'instagram')
      const redirectUri = `${APP_URL}/api/social/callback/facebook`
      const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID
      const configId = process.env.META_CONFIG_ID || '2219336948472997'
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&state=${state}&response_type=code`
      break
    }

    case 'x': {
      const state = encodeState(companyId)
      const redirectUri = `${APP_URL}/api/social/callback/x`
      const scopes = 'tweet.read tweet.write users.read offline.access'
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`
      break
    }

    case 'linkedin': {
      const state = encodeState(companyId)
      const redirectUri = `${APP_URL}/api/social/callback/linkedin`
      const scopes = 'r_liteprofile r_emailaddress w_member_social'
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`
      break
    }

    case 'tiktok': {
      const state = encodeState(companyId)
      const redirectUri = `${APP_URL}/api/social/callback/tiktok`
      const scopes = 'user.info.basic,video.publish,video.upload'
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
      break
    }

    default:
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  }

  return NextResponse.json({ url: authUrl })
}
