import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
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
    <main className="min-h-screen bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-slate-400">ADMIN</p>
            <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.12em] text-slate-900">文章后台</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">当前登录：{session.user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/posts/new" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              新建文章
            </Link>
            <Link href="/admin/posts/upload" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-amber-500 hover:text-amber-700">
              上传 Markdown
            </Link>
            <Link href="/admin/monologue" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-amber-500 hover:text-amber-700">
              修改独白
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">标题</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium">状态</th>
                <th className="px-6 py-4 font-medium">发布时间</th>
                <th className="px-6 py-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-slate-500">还没有文章，先新建一篇或上传一篇 Markdown 吧。</td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 font-medium text-slate-800">{post.title}</td>
                    <td className="px-6 py-4 text-slate-500">{post.slug}</td>
                    <td className="px-6 py-4 text-slate-500">{post.isPublished ? '已发布' : '草稿'}</td>
                    <td className="px-6 py-4 text-slate-500">{post.publishedAt.toLocaleString('zh-CN')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/musings/${post.slug}`} className="text-slate-500 transition hover:text-amber-700">
                          前台查看
                        </Link>
                        <Link href={`/admin/posts/${post.id}/edit`} className="text-slate-500 transition hover:text-amber-700">
                          编辑
                        </Link>
                        <AdminPostDeleteButton postId={post.id} postTitle={post.title} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
