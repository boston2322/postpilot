import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

export type BrandData = {
  tone: string
  keywords: string[]
  audience: string
  style: string
  description: string
}

const PLATFORM_LIMITS: Record<string, { chars: number; style: string }> = {
  INSTAGRAM: {
    chars: 2200,
    style: 'conversational, engaging, use relevant emojis, include 5-10 hashtags, line breaks for readability',
  },
  X: {
    chars: 280,
    style: 'punchy, concise, direct, use 1-2 hashtags max, no fluff',
  },
  LINKEDIN: {
    chars: 3000,
    style: 'professional, insightful, value-driven, storytelling, 3-5 hashtags',
  },
  TIKTOK: {
    chars: 300,
    style: 'short caption, trendy, casual, 3-5 hashtags',
  },
  FACEBOOK: {
    chars: 63206,
    style: 'conversational, engaging, ask questions to drive comments, 2-3 hashtags',
  },
  YOUTUBE: {
    chars: 5000,
    style: 'descriptive, SEO-friendly, include keywords naturally, call to action',
  },
}

async function callGroq(prompt: string): Promise<string> {
  const groq = getGroq()
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1024,
  })
  return completion.choices[0]?.message?.content || ''
}

function extractJson(text: string): Record<string, unknown> {
  // Strip markdown code fences if present
  const clean = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  return JSON.parse(clean)
}

export async function extractBrandData(url: string): Promise<BrandData> {
  let pageText = ''

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PostPilot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await response.text()
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000)
  } catch {
    pageText = `Website: ${url}`
  }

  const prompt = `You are a brand analyst. Analyze this website content and return ONLY a valid JSON object (no markdown, no explanation):

URL: ${url}
Content: ${pageText}

Return exactly this JSON structure:
{
  "tone": "description of brand tone",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "audience": "description of target audience",
  "style": "description of content style",
  "description": "1-2 sentence company description"
}`

  try {
    const text = await callGroq(prompt)
    const result = extractJson(text)
    return {
      tone: (result.tone as string) || 'Professional',
      keywords: Array.isArray(result.keywords) ? (result.keywords as string[]) : [],
      audience: (result.audience as string) || 'General audience',
      style: (result.style as string) || 'Clean and modern',
      description: (result.description as string) || 'A professional business',
    }
  } catch {
    return {
      tone: 'Professional',
      keywords: [],
      audience: 'General audience',
      style: 'Clean and modern',
      description: `Brand at ${url}`,
    }
  }
}

export async function generatePost(params: {
  platform: string
  brandData: BrandData
  topic?: string
  tone?: string
}): Promise<{ content: string; hashtags: string[] }> {
  const { platform, brandData, topic, tone } = params
  const platformConfig = PLATFORM_LIMITS[platform.toUpperCase()] || PLATFORM_LIMITS.INSTAGRAM

  const prompt = `You are an expert social media copywriter. Create a ${platform} post and return ONLY a valid JSON object (no markdown, no explanation).

Brand Description: ${brandData.description}
Brand Tone: ${tone || brandData.tone}
Target Audience: ${brandData.audience}
Brand Keywords: ${brandData.keywords.join(', ')}
Content Style: ${brandData.style}
${topic ? `Topic/Focus: ${topic}` : ''}

Platform: ${platform}
Max Characters: ${platformConfig.chars}
Style Guide: ${platformConfig.style}

Return exactly this JSON structure:
{
  "content": "the post content without hashtags, max ${platformConfig.chars} characters",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`

  try {
    const text = await callGroq(prompt)
    const result = extractJson(text)
    return {
      content: (result.content as string) || '',
      hashtags: Array.isArray(result.hashtags) ? (result.hashtags as string[]) : [],
    }
  } catch {
    return { content: '', hashtags: [] }
  }
}
