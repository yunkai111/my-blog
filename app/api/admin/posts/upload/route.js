import { Buffer } from 'node:buffer'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { MAX_MARKDOWN_BYTES, parseMarkdownUpload } from '@/lib/markdown'
import { createPost } from '@/lib/posts'
import { enforceRateLimit, ensureSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'

const uploadSchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().optional(),
  size: z.number().int().positive().max(MAX_MARKDOWN_BYTES),
})

const allowedMimeTypes = new Set(['text/markdown', 'text/plain', 'text/x-markdown'])

export async function POST(request) {
  const originError = ensureSameOrigin(request)
  if (originError) {
    return originError
  }

  const rateLimitError = enforceRateLimit(request, 'admin-post-upload', {
    limit: 10,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    return rateLimitError
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请选择 Markdown 文件。' }, { status: 400 })
  }

  const parsedFile = uploadSchema.safeParse({
    name: file.name,
    type: file.type,
    size: file.size,
  })

  if (!parsedFile.success) {
    return NextResponse.json({ error: '文件大小超过限制或文件无效。' }, { status: 400 })
  }

  if (!/\.md$/i.test(file.name)) {
    return NextResponse.json({ error: '只支持 .md 文件。' }, { status: 400 })
  }

  // 浏览器/curl 上传 .md 时 file.type 常为空字符串;此时依赖 .md 后缀校验通过。
  // 一旦提供了 MIME,必须落在白名单内,杜绝 application/octet-stream 等异常类型。
  const mimeType = file.type?.toLowerCase() ?? ''
  if (mimeType && !allowedMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: '文件类型无效。' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const decoded = Buffer.from(arrayBuffer).toString('utf8')

  // UTF-8 解码失败会被替换为 �;\x00 表示混入二进制空字节。
  // 任一命中说明该文件不是合法 UTF-8 Markdown,直接拦截避免后续解析污染。
  if (decoded.includes('�') || decoded.includes('\x00')) {
    return NextResponse.json(
      { error: '文件编码无效或包含二进制内容,请确认是 UTF-8 编码的 Markdown。' },
      { status: 400 },
    )
  }

  const source = decoded.trim()
  if (!source) {
    return NextResponse.json({ error: 'Markdown 正文不能为空。' }, { status: 400 })
  }

  try {
    const post = parseMarkdownUpload(file.name, source)
    const created = await createPost(post, session.user.id)
    return NextResponse.json({
      post: {
        id: created.id,
        title: created.title,
        slug: created.slug,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败。' },
      { status: 400 },
    )
  }
}
