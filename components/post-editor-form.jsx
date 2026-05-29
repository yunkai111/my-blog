'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const toolbarActions = [
  { label: 'H1', apply: (value) => `# ${value || '标题'}` },
  { label: 'B', apply: (value) => `**${value || '加粗文字'}**` },
  { label: 'I', apply: (value) => `*${value || '斜体文字'}*` },
  { label: 'Link', apply: (value) => `[${value || '链接文字'}](https://example.com)` },
  { label: 'List', apply: (value) => `- ${value || '列表项'}` },
  { label: 'Quote', apply: (value) => `> ${value || '引用内容'}` },
  { label: 'Code', apply: (value) => `\n\`\`\`js\n${value || '// code'}\n\`\`\`\n` },
]

function extractMarkdownTitle(markdown) {
  let inCodeBlock = false

  for (const rawLine of markdown.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim()

    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const match = rawLine.match(/^\s*#(?!#)\s+(.+?)\s*#*\s*$/)
    if (!match) {
      continue
    }

    return match[1].trim()
  }

  return ''
}

function replaceMarkdownTitle(markdown, title) {
  const lines = markdown.split(/\r?\n/)
  let inCodeBlock = false

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim()

    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    if (!/^\s*#(?!#)\s+/.test(lines[index])) {
      continue
    }

    const indent = lines[index].match(/^(\s*)/)?.[1] ?? ''
    lines[index] = `${indent}# ${title}`
    return lines.join('\n')
  }

  return markdown
}

function toDatetimeLocalInput(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16)
  }

  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function createInitialState(post) {
  const markdown = post?.markdown ?? ''

  return {
    title: extractMarkdownTitle(markdown) || (post?.title ?? ''),
    excerpt: post?.excerpt ?? '',
    slug: post?.slug ?? '',
    publishedAt: toDatetimeLocalInput(post?.publishedAt ?? new Date().toISOString()),
    isPublished: post?.isPublished ?? true,
    markdown,
  }
}

export function PostEditorForm({ mode, post }) {
  const [form, setForm] = useState(() => createInitialState(post))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const isEdit = mode === 'edit'

  const preview = useMemo(() => form.markdown || '在这里编写 Markdown，右侧会实时预览。', [form.markdown])

  function updateField(name, value) {
    setForm((current) => {
      if (name === 'markdown') {
        const nextTitle = extractMarkdownTitle(value)
        return {
          ...current,
          markdown: value,
          title: nextTitle || current.title,
        }
      }

      if (name === 'title') {
        return {
          ...current,
          title: value,
          markdown: replaceMarkdownTitle(current.markdown, value),
        }
      }

      return { ...current, [name]: value }
    })
  }

  function insertMarkdown(transform) {
    setForm((current) => {
      const nextValue = transform(current.markdown)
      return { ...current, markdown: nextValue }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')

    const response = await fetch(isEdit ? `/api/admin/posts/${post.id}` : '/api/admin/posts', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const payload = await response.json().catch(() => null)
    setPending(false)

    if (!response.ok) {
      setError(payload?.error ?? (isEdit ? '保存失败。' : '创建失败。'))
      return
    }

    setMessage(isEdit ? '文章已保存。' : '文章已创建。')

    if (!isEdit && payload?.post?.id) {
      window.location.href = `/admin/posts/${payload.post.id}/edit`
    }
  }

  async function handleDelete() {
    if (!post?.id) {
      return
    }

    const confirmed = window.confirm(`确定删除《${post.title}》吗？删除后无法恢复。`)
    if (!confirmed) {
      return
    }

    setPending(true)
    setError('')
    setMessage('')

    const response = await fetch(`/api/admin/posts/${post.id}`, {
      method: 'DELETE',
    })

    const payload = await response.json().catch(() => null)
    setPending(false)

    if (!response.ok) {
      setError(payload?.error ?? '删除失败。')
      return
    }

    window.location.href = '/admin/posts'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/posts" className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
          ← 返回文章后台
        </Link>
        {isEdit ? (
          <Link href={`/musings/${post.slug}`} className="text-sm tracking-[0.2em] text-slate-500 transition hover:text-amber-700">
            前台查看
          </Link>
        ) : null}
        <Link href="/admin/posts/upload" className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-700">
          上传 Markdown
        </Link>
        {isEdit ? (
          <button type="button" onClick={handleDelete} disabled={pending} className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-600 transition hover:border-rose-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
            删除文章
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">标题</span>
          <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">Slug</span>
          <input value={form.slug} onChange={(event) => updateField('slug', event.target.value.toLowerCase())} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" placeholder="留空时按标题生成" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm text-slate-600">摘要</span>
          <textarea value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" placeholder="留空时按正文自动生成摘要" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">发布时间</span>
          <input type="datetime-local" value={form.publishedAt} onChange={(event) => updateField('publishedAt', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" required />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" checked={form.isPublished} onChange={(event) => updateField('isPublished', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-500" />
          发布到前台
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {toolbarActions.map((action) => (
            <button key={action.label} type="button" onClick={() => insertMarkdown(action.apply)} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:border-amber-500 hover:text-amber-700">
              {action.label}
            </button>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-600">Markdown 正文</label>
            <textarea value={form.markdown} onChange={(event) => updateField('markdown', event.target.value)} rows={20} className="min-h-[28rem] w-full rounded-[2rem] border border-slate-200 bg-white px-5 py-4 font-mono text-sm leading-7 outline-none transition focus:border-amber-500" required />
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-600">实时预览</p>
            <div className="prose-custom min-h-[28rem] rounded-[2rem] border border-slate-200 bg-white px-5 py-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? (isEdit ? '保存中…' : '创建中…') : (isEdit ? '保存文章' : '创建文章')}
      </button>
    </form>
  )
}
