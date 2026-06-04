import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BlogShell } from '@/components/blog-shell'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { getPublishedPostBySlug } from '@/lib/posts'

export default async function PostDetailPage({ params }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <BlogShell>
      <article className="min-h-screen bg-[#fafaf8] px-6 pb-24 pt-36">
        <div className="mx-auto max-w-3xl">
          <Link href="/musings" className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
            ← 返回随写
          </Link>
          <header className="mt-10 border-b border-slate-200 pb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              {post.publishedAt.toLocaleDateString('zh-CN')}
            </p>
            {post.coverImage && (
              <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
                <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <h1 className="mt-6 font-serif text-4xl font-bold tracking-[0.1em] text-slate-900">{post.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{post.excerpt}</p>
          </header>
          <div className="mt-12">
            <MarkdownRenderer>{post.markdown}</MarkdownRenderer>
          </div>
        </div>
      </article>
    </BlogShell>
  )
}
