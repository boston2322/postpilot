import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { SessionUser } from '@/types'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-please'
)

async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths - always allowed
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('pp_token')?.value

  // Protect dashboard and company routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/company/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const user = await verifyToken(token)
    if (!user) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('pp_token')
      return response
    }

    return NextResponse.next()
  }

  // Protect admin routes - require valid token AND isAdmin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const user = await verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
  }

  // Protect all other API routes (except public ones above)
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/company/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
}
