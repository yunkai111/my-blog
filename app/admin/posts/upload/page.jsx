import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UploadForm } from '@/components/upload-form'
import { authOptions } from '@/lib/auth'

export default async function UploadPostPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/posts" className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
            ← 返回文章后台
          </Link>
          <Link href="/admin/posts/new" className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-700">
            手动新建文章
          </Link>
        </div>
        <div className="mt-8 rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          <p className="text-xs tracking-[0.3em] text-slate-400">UPLOAD</p>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.12em] text-slate-900">导入 Markdown</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">上传 Markdown 文件后，系统会解析 frontmatter 与正文，并将文章安全写入 SQLite。</p>
          <div className="mt-8">
            <UploadForm />
          </div>
        </div>
      </div>
    </main>
  )
}
