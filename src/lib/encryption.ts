import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    // Use a default key for development - must be set in production
    return Buffer.from('0'.repeat(64), 'hex')
  }
  // If key is hex string of 64 chars (32 bytes), use it directly
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  // Otherwise pad or truncate to 32 bytes
  const buf = Buffer.alloc(32)
  Buffer.from(key).copy(buf)
  return buf
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decrypt(encryptedData: string): string {
  const key = getKey()
  const parts = encryptedData.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, encrypted, authTagHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
