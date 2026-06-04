import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { enforceRateLimit, ensureSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const EXT_MAP = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }

export async function POST(request) {
  const originError = ensureSameOrigin(request)
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, 'admin-image-upload', {
    limit: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请选择图片文件。' }, { status: 400 })
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: '图片大小不能超过 5MB。' }, { status: 400 })
  }

  const mime = file.type?.toLowerCase() ?? ''
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json({ error: '只支持 JPEG、PNG、WebP、GIF 格式。' }, { status: 400 })
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    const ext = EXT_MAP[mime] || '.jpg'
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
    const filePath = join(UPLOAD_DIR, name)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Avoid overwriting an existing file (extremely unlikely, but safe)
    try {
      await stat(filePath)
      return NextResponse.json({ error: '文件名冲突，请重试。' }, { status: 409 })
    } catch {
      // File does not exist — good
    }

    // Write via stream for memory efficiency with larger files
    const { Readable } = await import('node:stream')
    const readable = Readable.from(buffer)
    const writable = createWriteStream(filePath)
    await pipeline(readable, writable)

    const url = `/api/uploads/${name}`
    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json(
      { error: '图片上传失败，请稍后再试。' },
      { status: 500 },
    )
  }
}
