import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

function extractJson(text: string): Record<string, unknown> {
  const clean = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  return JSON.parse(clean)
}

async function callGroq(prompt: string, maxTokens = 2000): Promise<string> {
  const groq = getGroq()
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.8,
    max_tokens: maxTokens,
  })
  return completion.choices[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { type, platform, answers } = body

    if (!type || !platform || !answers) {
      return NextResponse.json({ error: 'type, platform, and answers are required' }, { status: 400 })
    }

    const PLATFORM_STYLE: Record<string, string> = {
      INSTAGRAM: 'conversational, engaging, use relevant emojis, 5-10 hashtags',
      FACEBOOK: 'conversational, engaging, ask questions to drive comments, 2-3 hashtags',
      X: 'punchy, concise, max 280 chars, 1-2 hashtags',
      LINKEDIN: 'professional, insightful, value-driven, 3-5 hashtags',
      TIKTOK: 'trendy, casual, energetic, 3-5 hashtags',
      YOUTUBE: 'descriptive, SEO-friendly, include keywords, call to action',
    }
    const platformStyle = PLATFORM_STYLE[platform.toUpperCase()] || PLATFORM_STYLE.INSTAGRAM

    if (type === 'SINGLE') {
      const prompt = `You are an expert social media copywriter. Generate a ${platform} post and return ONLY valid JSON (no markdown fences, no explanation).

Topic/Message: ${answers.topic}
Target Audience: ${answers.audience || 'general audience'}
Tone: ${answers.tone || 'engaging'}
Call to Action: ${answers.cta || 'none'}
Additional Notes: ${answers.notes || 'none'}
Platform Style: ${platformStyle}

Return this exact JSON:
{
  "content": "the full post caption (without hashtags)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "imagePrompt": "a detailed image generation prompt that would create the perfect image for this post"
}`

      const text = await callGroq(prompt)
      const result = extractJson(text)
      return NextResponse.json({
        type: 'SINGLE',
        content: result.content as string || '',
        hashtags: Array.isArray(result.hashtags) ? result.hashtags as string[] : [],
        imagePrompt: result.imagePrompt as string || '',
      })
    }

    if (type === 'CAROUSEL') {
      const slideCount = parseInt(answers.slideCount) || 5
      const prompt = `You are an expert social media content creator. Generate a ${platform} carousel post with ${slideCount} slides and return ONLY valid JSON (no markdown fences, no explanation).

Topic/Theme: ${answers.topic}
Goal: ${answers.goal || 'educate'}
Target Audience: ${answers.audience || 'general audience'}
Tone: ${answers.tone || 'engaging'}
Key Points to Cover: ${answers.points || 'auto-generate relevant points'}
Include CTA slide: ${answers.includeCta !== false ? 'yes' : 'no'}
Platform Style: ${platformStyle}

Return this exact JSON:
{
  "content": "the main caption for the carousel post (without hashtags)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "slides": [
    {
      "title": "slide title (short, bold, max 8 words)",
      "content": "slide body text (1-3 sentences)",
      "imagePrompt": "detailed image generation prompt for this specific slide"
    }
  ]
}`

      const text = await callGroq(prompt, 3000)
      const result = extractJson(text)
      return NextResponse.json({
        type: 'CAROUSEL',
        content: result.content as string || '',
        hashtags: Array.isArray(result.hashtags) ? result.hashtags as string[] : [],
        slides: Array.isArray(result.slides) ? result.slides : [],
      })
    }

    if (type === 'VIDEO') {
      const prompt = `You are an expert social media video scriptwriter. Generate a ${platform} video post and return ONLY valid JSON (no markdown fences, no explanation).

Topic/Concept: ${answers.topic}
Video Style: ${answers.style || 'engaging'}
Duration: ${answers.duration || '30s'}
Key Talking Points: ${answers.points || 'auto-generate'}
Target Audience: ${answers.audience || 'general audience'}
Tone: ${answers.tone || 'engaging'}
Include Captions: ${answers.includeCaptions ? 'yes' : 'no'}
Platform Style: ${platformStyle}

Return this exact JSON:
{
  "content": "the video caption/description (without hashtags)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "script": "full video script with timing markers like [0:00] hook [0:05] main point 1 etc",
  "thumbnailPrompt": "detailed image generation prompt for the video thumbnail",
  "captions": "formatted caption text for the video if applicable"
}`

      const text = await callGroq(prompt, 2500)
      const result = extractJson(text)
      return NextResponse.json({
        type: 'VIDEO',
        content: result.content as string || '',
        hashtags: Array.isArray(result.hashtags) ? result.hashtags as string[] : [],
        script: result.script as string || '',
        thumbnailPrompt: result.thumbnailPrompt as string || '',
        captions: result.captions as string || '',
      })
    }

    return NextResponse.json({ error: 'Invalid post type' }, { status: 400 })
  } catch (error) {
    console.error('Generate post error:', error)
    return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 })
  }
}
