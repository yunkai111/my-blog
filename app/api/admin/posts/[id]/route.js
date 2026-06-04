import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { parseEditorPostInput } from '@/lib/markdown'
import { deletePost, updatePost } from '@/lib/posts'
import { enforceRateLimit, ensureSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'

export async function PATCH(request, { params }) {
  const originError = ensureSameOrigin(request)
  if (originError) {
    return originError
  }

  const rateLimitError = enforceRateLimit(request, 'admin-post-update', {
    limit: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    return rateLimitError
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  const { id } = await params
  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ error: '请求内容无效。' }, { status: 400 })
  }

  try {
    const input = parseEditorPostInput(payload)
    const updated = await updatePost(id, input)

    return NextResponse.json({
      post: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        coverImage: updated.coverImage,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败。'
    const status = message === '文章不存在' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request, { params }) {
  const originError = ensureSameOrigin(request)
  if (originError) {
    return originError
  }

  const rateLimitError = enforceRateLimit(request, 'admin-post-delete', {
    limit: 15,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    return rateLimitError
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录。' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deletePost(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败。'
    const status = message === '文章不存在' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
