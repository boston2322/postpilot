import { Queue } from 'bullmq'
import IORedis from 'ioredis'

let _connection: IORedis | null = null
let _postQueue: Queue | null = null

export function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  }
  return _connection
}

export function getPostQueue(): Queue {
  if (!_postQueue) {
    _postQueue = new Queue('posts', { connection: getConnection() })
  }
  return _postQueue
}

// For backwards compatibility
export const connection = new Proxy({} as IORedis, {
  get(_target, prop) { return (getConnection() as any)[prop] },
})

export const postQueue = new Proxy({} as Queue, {
  get(_target, prop) { return (getPostQueue() as any)[prop] },
})

export async function schedulePost(postId: string, scheduledFor: Date): Promise<void> {
  const delay = Math.max(0, scheduledFor.getTime() - Date.now())

  await postQueue.add(
    'publish-post',
    { postId },
    {
      delay,
      jobId: `post-${postId}`,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5 * 60 * 1000, // 5 minutes
      },
    }
  )
}

export async function getQueueStats(): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    postQueue.getWaitingCount(),
    postQueue.getActiveCount(),
    postQueue.getCompletedCount(),
    postQueue.getFailedCount(),
  ])

  return { waiting, active, completed, failed }
}
