import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogShell } from '@/components/blog-shell'
import { getMonologue } from '@/lib/site-content'

export default async function MonologueRoute() {
  const monologue = await getMonologue()

  return (
    <BlogShell>
      <article className="min-h-screen bg-[#fafaf8] px-6 pb-24 pt-36">
        <div className="mx-auto max-w-xl">
          <p className="text-xs tracking-[0.3em] text-slate-500 font-medium">独白</p>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.2em] text-slate-900">{monologue.title}</h1>
          <div className="prose-custom mt-12 space-y-6 text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{monologue.markdown}</ReactMarkdown>
          </div>
        </div>
      </article>
    </BlogShell>
  )
}
