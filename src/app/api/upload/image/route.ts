import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      {
        error: 'Image upload is not configured. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to your environment variables.',
        setup: true,
      },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
        { status: 400 }
      )
    }

    // 20MB limit
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const cloudForm = new FormData()
    cloudForm.append('file', dataUri)
    cloudForm.append('upload_preset', uploadPreset)
    cloudForm.append('folder', 'postpilot/uploads')

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudForm }
    )

    if (!cloudRes.ok) {
      const errData = await cloudRes.json().catch(() => ({}))
      console.error('Cloudinary upload error:', errData)
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      )
    }

    const cloudData = await cloudRes.json()
    return NextResponse.json({
      url: cloudData.secure_url,
      publicId: cloudData.public_id,
      width: cloudData.width,
      height: cloudData.height,
    })
  } catch (error) {
    console.error('Upload route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
