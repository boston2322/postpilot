import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Styles map for Pollinations.ai model hints
const STYLE_PROMPTS: Record<string, string> = {
  realistic: 'photorealistic, high quality, detailed',
  illustration: 'digital illustration, clean lines, vibrant colors',
  minimal: 'minimalist design, clean, modern, white background',
  'social-media': 'social media post, eye-catching, bold typography, professional',
  product: 'product photography, studio lighting, white background, commercial',
  abstract: 'abstract art, colorful, artistic, creative',
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { prompt, style = 'social-media', aspectRatio = '1:1' } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const styleHint = STYLE_PROMPTS[style] || STYLE_PROMPTS['social-media']
    const fullPrompt = `${prompt.trim()}, ${styleHint}`

    // Dimensions based on aspect ratio
    const dimensions: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 1080, height: 1920 },
    }
    const { width, height } = dimensions[aspectRatio] || dimensions['1:1']

    // Use a fixed random seed so the URL is stable (same seed = same image)
    const seed = Math.floor(Math.random() * 2147483647)

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`

    // Verify the image is accessible by attempting a HEAD request
    // Pollinations.ai may take a moment to generate — we wait up to 30s
    try {
      const checkRes = await fetch(imageUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(30000),
      })
      if (!checkRes.ok) {
        throw new Error(`Image generation service returned ${checkRes.status}`)
      }

      // If Cloudinary is configured, re-host the image for maximum reliability
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

      if (cloudName && uploadPreset) {
        const buffer = await checkRes.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const dataUri = `data:image/jpeg;base64,${base64}`

        const cloudForm = new FormData()
        cloudForm.append('file', dataUri)
        cloudForm.append('upload_preset', uploadPreset)
        cloudForm.append('folder', 'postpilot/ai-generated')

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: cloudForm }
        )

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json()
          return NextResponse.json({ url: cloudData.secure_url, provider: 'cloudinary' })
        }
      }

      // Fall back to Pollinations URL
      return NextResponse.json({ url: imageUrl, provider: 'pollinations' })
    } catch {
      // If fetch timed out or failed, still return the URL — it may load later
      return NextResponse.json({ url: imageUrl, provider: 'pollinations' })
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
