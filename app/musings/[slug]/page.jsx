import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogShell } from '@/components/blog-shell'
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
            <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.1em] text-slate-900">{post.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{post.excerpt}</p>
          </header>
          <div className="prose-custom mt-12 space-y-6 text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
          </div>
        </div>
      </article>
    </BlogShell>
  )
}
