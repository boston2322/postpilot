import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

function extractJson(text: string): Record<string, unknown> {
  const clean = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  return JSON.parse(clean)
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { type, topic, platform, companyId } = body

    if (!type || !topic) {
      return NextResponse.json({ error: 'type and topic are required' }, { status: 400 })
    }

    // Fetch brand data to pre-fill suggestions
    let brandContext = ''
    let brandTone = ''
    let brandAudience = ''
    if (companyId) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { brandData: true },
        })
        if (company?.brandData) {
          const bd = company.brandData as Record<string, unknown>
          const parts: string[] = []
          if (bd.description) parts.push(`Brand: ${bd.description}`)
          if (bd.tone) { parts.push(`Brand Tone: ${bd.tone}`); brandTone = bd.tone as string }
          if (bd.audience) { parts.push(`Target Audience: ${bd.audience}`); brandAudience = bd.audience as string }
          if (bd.style) parts.push(`Content Style: ${bd.style}`)
          if (Array.isArray(bd.keywords) && bd.keywords.length > 0)
            parts.push(`Brand Keywords: ${(bd.keywords as string[]).join(', ')}`)
          if (parts.length > 0) brandContext = parts.join('\n')
        }
      } catch { /* non-fatal */ }
    }

    const platformHint = platform ? ` for ${platform}` : ''
    const brandSection = brandContext
      ? `\n--- BRAND CONTEXT ---\n${brandContext}\n---`
      : ''

    let prompt = ''

    if (type === 'SINGLE') {
      prompt = `You are a social media strategist. Given this post topic and brand context, suggest smart values for all the fields. Return ONLY valid JSON (no markdown fences, no explanation).
${brandSection}

Post type: Single image post${platformHint}
Topic: ${topic}

Return exactly this JSON (use the brand context to inform your suggestions):
{
  "audience": "${brandAudience || 'specific target audience for this topic (1 short sentence)'}",
  "tone": one of: "professional" | "casual" | "inspirational" | "humorous" | "urgent" | "educational"${brandTone ? ` — lean towards "${brandTone}" to match brand voice` : ''},
  "cta": "a compelling call to action suited to this topic",
  "notes": "2-3 specific talking points that align with the brand and would make this post stand out"
}`
    } else if (type === 'CAROUSEL') {
      prompt = `You are a social media strategist. Given this carousel topic and brand context, suggest smart values. Return ONLY valid JSON (no markdown fences, no explanation).
${brandSection}

Post type: Carousel post${platformHint}
Topic: ${topic}

Return exactly this JSON:
{
  "audience": "${brandAudience || 'specific target audience (1 short sentence)'}",
  "tone": one of: "professional" | "casual" | "inspirational" | "humorous" | "urgent" | "educational"${brandTone ? ` — lean towards "${brandTone}"` : ''},
  "goal": one of: "educate" | "promote" | "inspire" | "sell" | "story" | "engage",
  "slideCount": a number between 4 and 8 that makes sense for this topic,
  "points": "3-5 bullet points of key things each slide should cover, separated by newlines",
  "includeCta": true or false
}`
    } else if (type === 'VIDEO') {
      prompt = `You are a social media strategist. Given this video topic and brand context, suggest smart values. Return ONLY valid JSON (no markdown fences, no explanation).
${brandSection}

Post type: Video post${platformHint}
Topic: ${topic}

Return exactly this JSON:
{
  "audience": "${brandAudience || 'specific target audience (1 short sentence)'}",
  "tone": one of: "professional" | "casual" | "inspirational" | "humorous" | "urgent" | "educational"${brandTone ? ` — lean towards "${brandTone}"` : ''},
  "style": one of: "tutorial" | "product-demo" | "behind-scenes" | "storytelling" | "announcement" | "testimonial",
  "duration": one of: "15s" | "30s" | "60s" | "90s",
  "points": "3-5 key talking points for the video, separated by newlines",
  "includeCaptions": true or false
}`
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 512,
    })
    const text = completion.choices[0]?.message?.content || ''
    const result = extractJson(text)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Suggest answers error:', error)
    return NextResponse.json({ error: 'Failed to suggest answers' }, { status: 500 })
  }
}
