import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { MAX_MARKDOWN_BYTES, parseMarkdownUpload } from '@/lib/markdown'
import { createPost } from '@/lib/posts'
import { enforceRateLimit, ensureSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'

// ── Constants ──
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB
const COVER_MIME_WHITELIST = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const mdSchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().optional(),
  size: z.number().int().positive().max(MAX_MARKDOWN_BYTES),
})

const MD_MIME_WHITELIST = new Set(['text/markdown', 'text/plain', 'text/x-markdown'])

// ── Helpers ──

/** Map MIME → safe extension. Unknown MIMEs are rejected upstream. */
function extFromMime(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }
  return map[mime] ?? null
}

/** Reject any path component that looks like traversal. */
function containsPathTraversal(name) {
  return /\.\.|[/\\]/.test(name)
}

/**
 * Write a cover image to public/uploads/ with a cryptographically random
 * UUID filename. The original filename is discarded entirely.
 *
 * @returns {string} relative URL path like /api/uploads/<uuid>.jpg
 */
async function persistCoverImage(file) {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const ext = extFromMime(file.type?.toLowerCase() ?? '')
  if (!ext) return null

  const safeName = `${randomUUID()}${ext}`
  const filePath = join(UPLOAD_DIR, safeName)

  const buffer = Buffer.from(await file.arrayBuffer())
  const writable = createWriteStream(filePath)
  await pipeline(Readable.from(buffer), writable)

  return `/api/uploads/${safeName}`
}

// ── POST ──

export async function POST(request) {
  // 1) Authentication gate — always first
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  // 2) Origin + rate-limit
  const originError = ensureSameOrigin(request)
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, 'admin-post-upload', {
    limit: 10,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  // 3) Parse multipart body
  const formData = await request.formData()

  // ── Markdown file ──
  const mdFile = formData.get('file')
  if (!(mdFile instanceof File)) {
    return NextResponse.json({ error: '请选择 Markdown 文件。' }, { status: 400 })
  }

  const mdParsed = mdSchema.safeParse({
    name: mdFile.name,
    type: mdFile.type,
    size: mdFile.size,
  })
  if (!mdParsed.success) {
    return NextResponse.json({ error: 'Markdown 文件大小超过限制或无效。' }, { status: 400 })
  }

  if (containsPathTraversal(mdFile.name)) {
    return NextResponse.json({ error: '文件名包含不安全字符。' }, { status: 400 })
  }

  if (!/\.md$/i.test(mdFile.name)) {
    return NextResponse.json({ error: '只支持 .md 文件。' }, { status: 400 })
  }

  const mdMime = mdFile.type?.toLowerCase() ?? ''
  if (mdMime && !MD_MIME_WHITELIST.has(mdMime)) {
    return NextResponse.json({ error: 'Markdown 文件 MIME 类型无效。' }, { status: 400 })
  }

  // UTF-8 decode + binary guard
  const mdBuffer = await mdFile.arrayBuffer()
  const decoded = Buffer.from(mdBuffer).toString('utf8')
  if (decoded.includes('�') || decoded.includes('\x00')) {
    return NextResponse.json(
      { error: '文件编码无效或包含二进制内容，请确认是 UTF-8 编码的 Markdown。' },
      { status: 400 },
    )
  }

  const source = decoded.trim()
  if (!source) {
    return NextResponse.json({ error: 'Markdown 正文不能为空。' }, { status: 400 })
  }

  // ── Cover image (optional) ──
  let coverUrl = null
  const coverFile = formData.get('coverImageFile')

  if (coverFile instanceof File && coverFile.size > 0) {
    if (coverFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: '封面图大小不能超过 2MB。' }, { status: 400 })
    }

    const coverMime = coverFile.type?.toLowerCase() ?? ''
    if (!COVER_MIME_WHITELIST.includes(coverMime)) {
      return NextResponse.json({ error: '封面图只支持 JPEG、PNG、WebP 格式。' }, { status: 400 })
    }

    // Discard original filename — use UUID only
    try {
      coverUrl = await persistCoverImage(coverFile)
      if (!coverUrl) {
        return NextResponse.json({ error: '封面图格式不支持。' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: '封面图写入失败，请稍后重试。' }, { status: 500 })
    }
  }

  // ── Parse Markdown + persist ──
  try {
    const post = parseMarkdownUpload(mdFile.name, source)
    if (coverUrl) {
      post.coverImage = coverUrl // uploaded file overrides frontmatter
    }
    const created = await createPost(post, session.user.id)
    return NextResponse.json({
      post: {
        id: created.id,
        title: created.title,
        slug: created.slug,
        coverImage: created.coverImage,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败。' },
      { status: 400 },
    )
  }
}
