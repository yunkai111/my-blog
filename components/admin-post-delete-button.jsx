'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

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
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      title="删除"
      className="inline-flex size-8 items-center justify-center rounded-full bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  )
}
