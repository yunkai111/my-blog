'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

export function UploadForm() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [createdPost, setCreatedPost] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer?.files
    if (files?.length && fileInputRef.current) {
      fileInputRef.current.files = files
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setError('')
    setCreatedPost(null)

    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/posts/upload', {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => null)
    setPending(false)

    if (!response.ok) {
      setError(payload?.error ?? '上传失败，请稍后再试。')
      return
    }

    event.currentTarget.reset()
    setCreatedPost(payload.post)
    setMessage(`文章《${payload.post.title}》已导入。`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-slate-200 bg-white/70 p-8 backdrop-blur">
      <div>
        <label className="mb-2 block text-sm text-slate-600">Markdown 文件</label>
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
            dragOver
              ? 'border-amber-400 bg-amber-50/60'
              : 'border-slate-300 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept=".md,text/markdown,text/plain"
            className="absolute inset-0 cursor-pointer opacity-0"
            required
          />
          <p className="pointer-events-none text-sm text-slate-500">
            {dragOver ? '松开鼠标以上传文件' : '将 .md 文件拖拽到此处，或点击选择文件'}
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          只允许 .md 文件，大小不超过 1MB。支持 frontmatter: title、excerpt、slug、publishedAt、isPublished。
        </p>
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {createdPost ? (
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/admin/posts/${createdPost.id}/edit`} className="text-slate-600 transition hover:text-amber-700">
            继续编辑这篇文章
          </Link>
          <Link href={`/musings/${createdPost.slug}`} className="text-slate-600 transition hover:text-amber-700">
            前台查看
          </Link>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? '上传中…' : '上传文章'}
      </button>
    </form>
  )
}
