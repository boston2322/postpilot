import { Worker, Job } from 'bullmq'
import { connection } from './src/lib/queue'
import { prisma } from './src/lib/prisma'
import { decrypt } from './src/lib/encryption'

interface PostJob {
  postId: string
}

async function publishToInstagram(
  content: string,
  hashtags: string[],
  accessToken: string,
  accountId: string
): Promise<string> {
  const fullCaption = hashtags.length > 0
    ? `${content}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
    : content

  // Step 1: Create media container
  const createResponse = await fetch(
    `https://graph.instagram.com/v18.0/${accountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: fullCaption,
        media_type: 'TEXT',
        access_token: accessToken,
      }),
    }
  )
  const createData = await createResponse.json()

  if (!createData.id) {
    throw new Error(`Instagram container creation failed: ${JSON.stringify(createData)}`)
  }

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.instagram.com/v18.0/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: accessToken,
      }),
    }
  )
  const publishData = await publishResponse.json()

  if (!publishData.id) {
    throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`)
  }

  return publishData.id
}

async function publishToFacebook(
  content: string,
  hashtags: string[],
  accessToken: string,
  pageId: string
): Promise<string> {
  const message = hashtags.length > 0
    ? `${content}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
    : content

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    }
  )

  const data = await response.json()

  if (!data.id) {
    throw new Error(`Facebook post failed: ${JSON.stringify(data)}`)
  }

  return data.id
}

async function publishToX(
  content: string,
  hashtags: string[],
  accessToken: string
): Promise<string> {
  const tweet = hashtags.length > 0
    ? `${content} ${hashtags.slice(0, 2).map((h) => `#${h}`).join(' ')}`
    : content

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: tweet.substring(0, 280) }),
  })

  const data = await response.json()

  if (!data.data?.id) {
    throw new Error(`X post failed: ${JSON.stringify(data)}`)
  }

  return data.data.id
}

async function publishToLinkedIn(
  content: string,
  hashtags: string[],
  accessToken: string,
  authorId: string
): Promise<string> {
  const commentary = hashtags.length > 0
    ? `${content}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
    : content

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: commentary },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  })

  const data = await response.json()

  if (!data.id) {
    throw new Error(`LinkedIn post failed: ${JSON.stringify(data)}`)
  }

  return data.id
}

async function publishToTikTok(
  content: string,
  hashtags: string[],
  accessToken: string
): Promise<string> {
  const caption = hashtags.length > 0
    ? `${content} ${hashtags.map((h) => `#${h}`).join(' ')}`
    : content

  // TikTok requires video content for actual posts
  // This creates a draft/direct post request
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/text/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 0,
        chunk_size: 0,
        total_chunk_count: 1,
      },
    }),
  })

  const data = await response.json()

  if (!data.data?.publish_id) {
    throw new Error(`TikTok post failed: ${JSON.stringify(data)}`)
  }

  return data.data.publish_id
}

async function processPost(job: Job<PostJob>): Promise<void> {
  const { postId } = job.data

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      socialAccount: true,
      company: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!post) {
    throw new Error(`Post ${postId} not found`)
  }

  if (post.status !== 'SCHEDULED' && post.status !== 'APPROVED') {
    console.log(`Post ${postId} has status ${post.status}, skipping`)
    return
  }

  if (!post.socialAccount) {
    throw new Error(`Post ${postId} has no social account connected`)
  }

  const accessToken = decrypt(post.socialAccount.accessToken)
  const accountId = post.socialAccount.accountId
  let externalId: string

  switch (post.platform) {
    case 'INSTAGRAM':
      externalId = await publishToInstagram(
        post.content,
        post.hashtags,
        accessToken,
        accountId
      )
      break
    case 'FACEBOOK':
      externalId = await publishToFacebook(
        post.content,
        post.hashtags,
        accessToken,
        accountId
      )
      break
    case 'X':
      externalId = await publishToX(post.content, post.hashtags, accessToken)
      break
    case 'LINKEDIN':
      externalId = await publishToLinkedIn(
        post.content,
        post.hashtags,
        accessToken,
        accountId
      )
      break
    case 'TIKTOK':
      externalId = await publishToTikTok(post.content, post.hashtags, accessToken)
      break
    default:
      throw new Error(`Unsupported platform: ${post.platform}`)
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      externalId,
      failureReason: null,
    },
  })

  // Increment posts used this month
  if (post.company.subscription) {
    await prisma.subscription.update({
      where: { companyId: post.companyId },
      data: {
        postsUsedThisMonth: {
          increment: 1,
        },
      },
    })
  }

  console.log(`Post ${postId} published successfully as ${externalId}`)
}

const worker = new Worker<PostJob>(
  'posts',
  async (job) => {
    console.log(`Processing job ${job.id} for post ${job.data.postId}`)

    try {
      await processPost(job)
    } catch (error) {
      const err = error as Error
      console.error(`Job ${job.id} failed:`, err.message)

      const post = await prisma.post.findUnique({
        where: { id: job.data.postId },
      })

      if (post) {
        const newRetryCount = post.retryCount + 1

        if (newRetryCount >= 3) {
          await prisma.post.update({
            where: { id: job.data.postId },
            data: {
              status: 'FAILED',
              failureReason: err.message,
              retryCount: newRetryCount,
            },
          })
          console.log(`Post ${job.data.postId} marked as FAILED after ${newRetryCount} attempts`)
        } else {
          await prisma.post.update({
            where: { id: job.data.postId },
            data: {
              retryCount: newRetryCount,
              failureReason: err.message,
            },
          })
          console.log(`Post ${job.data.postId} will retry (attempt ${newRetryCount})`)
        }
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err.message)
})

worker.on('error', (err) => {
  console.error('Worker error:', err)
})

console.log('PostPilot queue worker started')
console.log('Listening for post jobs...')

process.on('SIGTERM', async () => {
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})
