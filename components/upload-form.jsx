'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Edit3, Eye, FileText, Upload, X } from 'lucide-react'

const MD_MAX = 1024 * 1024
const IMG_MAX = 2 * 1024 * 1024
const IMG_ACCEPT = 'image/jpeg,image/png,image/webp'
const IMG_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const IMG_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

function fmtKB(b) { return `${(b / 1024).toFixed(1)} KB` }

export function UploadForm() {
  const [mdFile, setMdFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [mdDrag, setMdDrag] = useState(false)
  const [coverDrag, setCoverDrag] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [createdPost, setCreatedPost] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const mdCounter = useRef(0)
  const cvCounter = useRef(0)
  const mdRef = useRef(null)
  const cvRef = useRef(null)
  const formRef = useRef(null)
  const prevCoverUrl = useRef(null)

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (prevCoverUrl.current) URL.revokeObjectURL(prevCoverUrl.current) }
  }, [])

  /* ── Select with validation ── */
  const pickMd = useCallback((file) => {
    setError('')
    if (!file) return
    if (!/\.md$/i.test(file.name)) { setError('只支持 .md 后缀的文件。'); return }
    if (file.size > MD_MAX) { setError(`MD 文件不超过 1MB（当前 ${fmtKB(file.size)}）。`); return }
    setMdFile(file)
  }, [])

  const pickCover = useCallback((file) => {
    setError('')
    if (!file) return
    const mime = (file.type || '').toLowerCase()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!IMG_MIMES.has(mime) && !IMG_EXTS.has(ext)) { setError('封面图只支持 JPEG / PNG / WebP。'); return }
    if (file.size > IMG_MAX) { setError(`封面图不超过 2MB（当前 ${fmtKB(file.size)}）。`); return }
    if (prevCoverUrl.current) URL.revokeObjectURL(prevCoverUrl.current)
    const url = URL.createObjectURL(file)
    prevCoverUrl.current = url
    setCoverFile(file)
  }, [])

  /* ── MD drag ── */
  const mdOver  = (e) => { e.preventDefault(); e.stopPropagation() }
  const mdEnter = (e) => { e.preventDefault(); e.stopPropagation(); mdCounter.current++; setMdDrag(true) }
  const mdLeave = (e) => { e.preventDefault(); e.stopPropagation(); mdCounter.current--; if (mdCounter.current <= 0) { mdCounter.current = 0; setMdDrag(false) } }
  const mdDrop  = (e) => {
    e.preventDefault(); e.stopPropagation()
    mdCounter.current = 0; setMdDrag(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) { if (mdRef.current) mdRef.current.files = e.dataTransfer.files; pickMd(f) }
  }

  /* ── Cover drag ── */
  const cvOver  = (e) => { e.preventDefault(); e.stopPropagation() }
  const cvEnter = (e) => { e.preventDefault(); e.stopPropagation(); cvCounter.current++; setCoverDrag(true) }
  const cvLeave = (e) => { e.preventDefault(); e.stopPropagation(); cvCounter.current--; if (cvCounter.current <= 0) { cvCounter.current = 0; setCoverDrag(false) } }
  const cvDrop  = (e) => {
    e.preventDefault(); e.stopPropagation()
    cvCounter.current = 0; setCoverDrag(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) { if (cvRef.current) cvRef.current.files = e.dataTransfer.files; pickCover(f) }
  }

  const clearCover = () => {
    if (prevCoverUrl.current) URL.revokeObjectURL(prevCoverUrl.current)
    prevCoverUrl.current = null
    setCoverFile(null)
    if (cvRef.current) cvRef.current.value = ''
  }

  const clearMd = () => {
    setMdFile(null)
    if (mdRef.current) mdRef.current.value = ''
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    setPending(true); setError(''); setCreatedPost(null)

    const fd = new FormData(form)
    if (coverFile) fd.set('coverImageFile', coverFile)

    const res = await fetch('/api/admin/posts/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => null)
    setPending(false)

    if (!res.ok) { setError(data?.error ?? '上传失败。'); return }

    form.reset()
    if (mdRef.current) mdRef.current.value = ''
    if (cvRef.current) cvRef.current.value = ''
    setMdFile(null); setCoverFile(null)
    setCreatedPost(data.post); setShowModal(true)
  }

  /* ── Render ── */
  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit}
        className="space-y-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/70 p-8 backdrop-blur">

        {/* ═══ Markdown ═══ */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">Markdown 文件</label>
          <div onDragOver={mdOver} onDragEnter={mdEnter} onDragLeave={mdLeave} onDrop={mdDrop}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
              mdDrag ? 'border-amber-400 bg-amber-50/60' : mdFile ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 bg-white'}`}>
            {/* Invisible input overlay — only interactive when no file selected */}
            {!mdFile && (
              <input ref={mdRef} name="file" type="file" accept=".md,text/markdown,text/plain"
                className="absolute inset-0 z-0 cursor-pointer opacity-0"
                onChange={(e) => pickMd(e.target.files?.[0])} required />
            )}
            {mdFile ? (
              <div className="relative z-10 flex items-center justify-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><FileText size={20} /></div>
                <div className="text-left"><p className="text-sm font-medium text-slate-700">{mdFile.name}</p><p className="text-xs text-slate-400">{fmtKB(mdFile.size)}</p></div>
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearMd() }}
                  className="relative z-20 ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>
              </div>
            ) : (<p className="pointer-events-none text-sm text-slate-500">{mdDrag ? '松开鼠标以上传' : '拖拽 .md 文件到此处，或点击选择'}</p>)}
          </div>
          <p className="mt-2 text-xs text-slate-500">仅限 .md 后缀，不超过 1MB。支持 frontmatter 元数据。</p>
        </div>

        {/* ═══ Cover ═══ */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">封面图（可选）</label>

          {/* wrapper */}
          <div onDragOver={cvOver} onDragEnter={cvEnter} onDragLeave={cvLeave} onDrop={cvDrop}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
              coverDrag ? 'border-amber-400 bg-amber-50/40' : coverFile ? 'border-emerald-300' : 'border-slate-300 bg-white'} ${
              coverFile ? 'py-0' : 'py-10'}`}>

            {/* Input overlay — only interactive when empty */}
            {!coverFile && (
              <input ref={cvRef} type="file" accept={IMG_ACCEPT}
                className="absolute inset-0 z-0 cursor-pointer opacity-0"
                onChange={(e) => pickCover(e.target.files?.[0])} />
            )}

            {/* ── SELECTED STATE ── */}
            {coverFile && (
              <div className="relative z-10 flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Upload size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{coverFile.name}</p>
                  <p className="text-xs text-slate-400">{fmtKB(coverFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearCover() }}
                  className="relative z-20 ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {!coverFile && (
              <div className="pointer-events-none flex flex-col items-center gap-2 px-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100"><Upload size={18} /></div>
                <span className="text-sm text-slate-500">{coverDrag ? '松开鼠标以添加' : '拖拽图片到此处，或点击上传'}</span>
                <span className="text-xs text-slate-400">JPEG / PNG / WebP · 最大 2MB</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle size={16} className="shrink-0" />{error}
          </motion.div>
        )}

        {/* ── Submit ── */}
        <button type="submit" disabled={pending || !mdFile}
          className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? '导入中…' : '开始解析并导入'}
        </button>
      </form>

      {/* ═══ Success Modal ═══ */}
      <AnimatePresence>
        {showModal && createdPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] p-6"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/50">
              <div className="flex justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100"><CheckCircle2 size={28} className="text-emerald-600" /></motion.div>
              </div>
              <div className="mt-5 text-center">
                <p className="text-xs font-bold tracking-[0.2em] text-emerald-600 uppercase">导入成功</p>
                <h3 className="mt-2 font-serif text-xl font-bold text-slate-900">{createdPost.title}</h3>
              </div>
              {createdPost.coverImage && (
                <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
                  <img src={createdPost.coverImage} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="mt-8 flex flex-col gap-3">
                <Link href={`/admin/posts/${createdPost.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]">
                  <Edit3 size={16} />编辑这篇文章</Link>
                <Link href={`/musings/${createdPost.slug}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">
                  <Eye size={16} />前台预览</Link>
              </div>
              <button onClick={() => setShowModal(false)}
                className="mt-5 w-full rounded-xl py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">继续上传</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
