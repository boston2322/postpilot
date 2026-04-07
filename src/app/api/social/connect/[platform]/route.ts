import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function encodeState(companyId: string): string {
  return Buffer.from(JSON.stringify({ companyId })).toString('base64url')
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

  const state = encodeState(companyId)
  const redirectUri = `${APP_URL}/api/social/callback/${params.platform}`
  let authUrl: string

  switch (params.platform.toLowerCase()) {
    case 'instagram':
    case 'facebook': {
      const appId = params.platform === 'instagram'
        ? process.env.INSTAGRAM_APP_ID
        : process.env.FACEBOOK_APP_ID

      // Both Instagram and Facebook use the same scopes via Business Login
      // instagram_content_publish requires App Review - using pages_show_list + business_management
      // which are approved for all Live apps without review
      const scopes = 'pages_show_list,pages_manage_posts,business_management'

      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`
      break
    }

    case 'x': {
      const scopes = 'tweet.read tweet.write users.read offline.access'
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`
      break
    }

    case 'linkedin': {
      const scopes = 'r_liteprofile r_emailaddress w_member_social'
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`
      break
    }

    case 'tiktok': {
      const scopes = 'user.info.basic,video.publish,video.upload'
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
      break
    }

    default:
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  }

  return NextResponse.json({ url: authUrl })
}
