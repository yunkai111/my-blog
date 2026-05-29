import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { PostEditorForm } from '@/components/post-editor-form'
import { authOptions } from '@/lib/auth'
import { getAdminPostById } from '@/lib/posts'

export default async function EditPostPage({ params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const { id } = await params
  const post = await getAdminPostById(id)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-xs tracking-[0.3em] text-slate-400">EDIT POST</p>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.12em] text-slate-900">编辑文章</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">在这里修改文章内容、发布时间和发布状态。预览区会按前台同样的 Markdown 规则渲染。</p>
        <div className="mt-8">
          <PostEditorForm mode="edit" post={{ ...post, publishedAt: post.publishedAt.toISOString() }} />
        </div>
      </div>
    </main>
  )
}
