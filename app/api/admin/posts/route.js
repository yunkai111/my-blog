import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { parseEditorPostInput } from '@/lib/markdown'
import { createPost } from '@/lib/posts'
import { enforceRateLimit, ensureSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'

export async function POST(request) {
  const originError = ensureSameOrigin(request)
  if (originError) {
    return originError
  }

  const rateLimitError = enforceRateLimit(request, 'admin-post-create', {
    limit: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    return rateLimitError
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ error: '请求内容无效。' }, { status: 400 })
  }

  try {
    const input = parseEditorPostInput(payload)
    const created = await createPost(input, session.user.id)

    return NextResponse.json({
      post: {
        id: created.id,
        slug: created.slug,
        title: created.title,
        coverImage: created.coverImage,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '创建失败。' }, { status: 400 })
  }
}
