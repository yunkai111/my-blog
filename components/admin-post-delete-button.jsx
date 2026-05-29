'use client'

import { useState } from 'react'

export function AdminPostDeleteButton({ postId, postTitle }) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(`确定删除《${postTitle}》吗？删除后无法恢复。`)
    if (!confirmed) {
      return
    }

    setPending(true)

    const response = await fetch(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
    })

    setPending(false)

    if (response.ok) {
      window.location.reload()
      return
    }

    const payload = await response.json().catch(() => null)
    window.alert(payload?.error ?? '删除失败。')
  }

  return (
    <button type="button" onClick={handleDelete} disabled={pending} className="text-slate-500 transition hover:text-rose-600 disabled:opacity-50">
      -
    </button>
  )
}
