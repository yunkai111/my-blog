import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { PostEditorForm } from '@/components/post-editor-form'
import { authOptions } from '@/lib/auth'

export default async function NewPostPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-xs tracking-[0.3em] text-slate-400">NEW POST</p>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.12em] text-slate-900">新建文章</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">使用可视化 Markdown 编辑器创建文章，保存后即可在后台继续修改。</p>
        <div className="mt-8">
          <PostEditorForm mode="create" />
        </div>
      </div>
    </main>
  )
}
