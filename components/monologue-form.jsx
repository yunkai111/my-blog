'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function createInitialState(monologue) {
  return {
    title: monologue?.title ?? '独白',
    markdown: monologue?.markdown ?? '',
  }
}

export function MonologueForm({ monologue }) {
  const [form, setForm] = useState(() => createInitialState(monologue))
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const preview = useMemo(() => form.markdown || '在这里写下你的自我介绍。', [form.markdown])

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/monologue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => null)
    setPending(false)

    if (!response.ok) {
      setError(payload?.error ?? '保存失败。')
      return
    }

    setMessage('独白已保存。')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/posts" className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
          ← 返回文章后台
        </Link>
        <Link href="/monologue" className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
          前台查看
        </Link>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-600">标题</span>
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" />
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-600">Markdown 正文</label>
          <textarea value={form.markdown} onChange={(event) => setForm((current) => ({ ...current, markdown: event.target.value }))} rows={20} className="min-h-[28rem] w-full rounded-[2rem] border border-slate-200 bg-white px-5 py-4 font-mono text-sm leading-7 outline-none transition focus:border-amber-500" required />
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-600">实时预览</p>
          <div className="prose-custom min-h-[28rem] rounded-[2rem] border border-slate-200 bg-white px-5 py-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? '保存中…' : '保存独白'}
      </button>
    </form>
  )
}
