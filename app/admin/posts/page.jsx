import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Eye, Pencil, Calendar, Globe, FileText, ArrowUpRight } from 'lucide-react'
import { AdminPostDeleteButton } from '@/components/admin-post-delete-button'
import { SignOutButton } from '@/components/sign-out-button'
import { authOptions } from '@/lib/auth'
import { getAdminPosts } from '@/lib/posts'

export default async function AdminPostsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const posts = await getAdminPosts()

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-5xl">
        
        {/* 顶部优雅通栏头部 */}
        <div className="flex flex-col gap-6 border-b border-slate-200/60 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Control Center</p>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              文章控制台
            </h1>
            <p className="mt-2 text-xs text-slate-500">
              当前登录管理账号：<span className="font-medium text-slate-700">{session.user.email}</span>
            </p>
          </div>
          
          {/* 功能操作按钮组 */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link 
              href="/admin/posts/new" 
              className="group flex items-center gap-1.5 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-98"
            >
              <span>新建文章</span>
              <ArrowUpRight size={13} className="text-slate-400 transition group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link 
              href="/admin/posts/upload" 
              className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-slate-300 hover:text-slate-900 hover:bg-slate-5/50"
            >
              上传 Markdown
            </Link>
            <Link 
              href="/admin/monologue" 
              className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-slate-300 hover:text-slate-900 hover:bg-slate-5/50"
            >
              修改独白
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* 下方现代扁平列表流 */}
        <div className="mt-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-20 text-center">
              <div className="rounded-xl bg-slate-100 p-4 text-slate-400">
                <FileText size={28} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">空空如也</p>
              <p className="mt-1 text-xs text-slate-400">还没有文章，先新建一篇或上传一篇 Markdown 吧。</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 md:flex-row md:items-center md:p-6"
                >
                  {/* 左侧：标题 + Slug + 时间标签 */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* 语义化状态标签 */}
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/10">
                          <Globe size={11} /> 已发布
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-600/10">
                          <FileText size={11} /> 草稿
                        </span>
                      )}
                      
                      <h2 className="text-base font-bold text-slate-800 transition group-hover:text-slate-900 truncate max-w-[280px] sm:max-w-[450px]">
                        {post.title}
                      </h2>
                    </div>

                    {/* 低调的副文本区 */}
                    <div className="flex flex-col flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 sm:flex-row sm:items-center">
                      <span className="font-mono bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-[250px]">
                        /{post.slug}
                      </span>
                      <span className="flex items-center gap-1.5 sm:mt-0 mt-1">
                        <Calendar size={13} className="text-slate-300" />
                        {post.publishedAt.toLocaleString('zh-CN', { hour12: false })}
                      </span>
                    </div>
                  </div>

                  {/* 右侧：高度精致的操作按钮区 */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                    <Link
                      href={`/musings/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="在新标签页前台预览"
                      className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 shadow-2xs border border-slate-200/40 transition duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      title="编辑文章"
                      className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 shadow-2xs border border-slate-200/40 transition duration-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 active:scale-95"
                    >
                      <Pencil size={15} />
                    </Link>
                    <div className="scale-95 active:scale-90 transition-transform">
                      <AdminPostDeleteButton postId={post.id} postTitle={post.title} />
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}