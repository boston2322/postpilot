import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PostPilot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    // Extract all img src attributes
    const srcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    const srcsetRegex = /srcset=["']([^"']+)["']/gi
    const ogRegex = /<meta[^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]+content=["']([^"']+)["'][^>]*>/gi

    const images = new Set<string>()

    // OG images first (highest quality)
    let match
    while ((match = ogRegex.exec(html)) !== null) {
      images.add(match[1])
    }

    // Regular img tags
    while ((match = srcRegex.exec(html)) !== null) {
      const src = match[1]
      if (!src.startsWith('data:') && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
        // Resolve relative URLs
        try {
          const base = new URL(url)
          const resolved = new URL(src, base).href
          images.add(resolved)
        } catch {
          if (src.startsWith('http')) images.add(src)
        }
      }
    }

    // Srcset
    while ((match = srcsetRegex.exec(html)) !== null) {
      const parts = match[1].split(',').map(p => p.trim().split(' ')[0])
      for (const part of parts) {
        if (part.startsWith('http') && !part.includes('icon')) {
          images.add(part)
        }
      }
    }

    const imageList = Array.from(images)
      .filter(u => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u) || u.includes('cdn') || u.includes('image'))
      .slice(0, 20)

    return NextResponse.json({ images: imageList })
  } catch (error) {
    console.error('Website images error:', error)
    return NextResponse.json({ images: [] })
  }
}
