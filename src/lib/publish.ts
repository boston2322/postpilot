import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

type Slide = {
  id: string
  content: string
  mediaUrl: string
  order: number
}

export async function publishPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { socialAccount: true },
  })

  if (!post) throw new Error('Post not found')
  if (!post.socialAccount) throw new Error('No social account linked to this post')

  const account = post.socialAccount
  const accessToken = decrypt(account.accessToken)
  const accountId = account.accountId

  const fullContent =
    post.content +
    (post.hashtags.length > 0 ? '\n\n' + post.hashtags.map((h) => `#${h}`).join(' ') : '')

  // ── FACEBOOK ────────────────────────────────────────────────────────────────
  if (account.platform === 'FACEBOOK') {
    let response: Response

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      response = await fetch(`https://graph.facebook.com/v18.0/${accountId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: post.mediaUrls[0],
          caption: fullContent,
          access_token: accessToken,
        }),
      })
    } else {
      response = await fetch(`https://graph.facebook.com/v18.0/${accountId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullContent, access_token: accessToken }),
      })
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const errMsg = (errData as Record<string, unknown>)?.error
        ? JSON.stringify((errData as Record<string, { message?: string }>).error)
        : `HTTP ${response.status}`
      throw new Error(`Facebook publish failed: ${errMsg}`)
    }

    const result = await response.json()
    return { externalId: String(result.id || result.post_id || '') }
  }

  // ── INSTAGRAM ───────────────────────────────────────────────────────────────
  if (account.platform === 'INSTAGRAM') {
    const igAccountId = accountId
    const postTypeValue = (post as Record<string, unknown>).postType as string | undefined

    if (postTypeValue === 'CAROUSEL') {
      const rawSlides = (post as Record<string, unknown>).slides
      const slides: Slide[] = Array.isArray(rawSlides) ? (rawSlides as Slide[]) : []
      if (slides.length === 0) throw new Error('Carousel post has no slides')

      const containerIds: string[] = []
      for (const slide of slides) {
        if (!slide.mediaUrl) throw new Error(`Slide ${slide.id} is missing an image URL`)

        const containerRes = await fetch(
          `https://graph.facebook.com/v18.0/${igAccountId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: slide.mediaUrl,
              is_carousel_item: true,
              access_token: accessToken,
            }),
          }
        )

        if (!containerRes.ok) {
          const errData = await containerRes.json().catch(() => ({}))
          const fbErr = (errData as Record<string, { message?: string }>).error
          if (containerRes.status === 400 && fbErr?.message?.includes('instagram_content_publish')) {
            throw new Error(
              'Your Instagram account needs App Review permissions to post. Facebook page posting works immediately.'
            )
          }
          throw new Error(`Failed to create carousel item: ${fbErr?.message || containerRes.status}`)
        }

        const containerData = await containerRes.json()
        containerIds.push(containerData.id)
      }

      const carouselRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          caption: fullContent,
          access_token: accessToken,
        }),
      })

      if (!carouselRes.ok) {
        const errData = await carouselRes.json().catch(() => ({}))
        const fbErr = (errData as Record<string, { message?: string }>).error
        if (carouselRes.status === 400 && fbErr?.message?.includes('instagram_content_publish')) {
          throw new Error(
            'Your Instagram account needs App Review permissions to post. Facebook page posting works immediately.'
          )
        }
        throw new Error(`Failed to create carousel container: ${fbErr?.message || carouselRes.status}`)
      }

      const carouselData = await carouselRes.json()
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
        }
      )

      if (!publishRes.ok) {
        const errData = await publishRes.json().catch(() => ({}))
        const fbErr = (errData as Record<string, { message?: string }>).error
        if (publishRes.status === 400 && fbErr?.message?.includes('instagram_content_publish')) {
          throw new Error(
            'Your Instagram account needs App Review permissions to post. Facebook page posting works immediately.'
          )
        }
        throw new Error(`Failed to publish carousel: ${fbErr?.message || publishRes.status}`)
      }

      const publishData = await publishRes.json()
      return { externalId: String(publishData.id || '') }
    }

    // Single image
    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('Instagram requires an image URL')
    }

    const mediaRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: post.mediaUrls[0],
        caption: fullContent,
        access_token: accessToken,
      }),
    })

    if (!mediaRes.ok) {
      const errData = await mediaRes.json().catch(() => ({}))
      const fbErr = (errData as Record<string, { message?: string }>).error
      if (mediaRes.status === 400 && fbErr?.message?.includes('instagram_content_publish')) {
        throw new Error(
          'Your Instagram account needs App Review permissions to post. Facebook page posting works immediately.'
        )
      }
      throw new Error(`Failed to create Instagram media container: ${fbErr?.message || mediaRes.status}`)
    }

    const mediaData = await mediaRes.json()
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: mediaData.id, access_token: accessToken }),
      }
    )

    if (!publishRes.ok) {
      const errData = await publishRes.json().catch(() => ({}))
      const fbErr = (errData as Record<string, { message?: string }>).error
      if (publishRes.status === 400 && fbErr?.message?.includes('instagram_content_publish')) {
        throw new Error(
          'Your Instagram account needs App Review permissions to post. Facebook page posting works immediately.'
        )
      }
      throw new Error(`Failed to publish Instagram post: ${fbErr?.message || publishRes.status}`)
    }

    const publishData = await publishRes.json()
    return { externalId: String(publishData.id || '') }
  }

  throw new Error(`Publishing is not yet supported for platform: ${account.platform}`)
}
