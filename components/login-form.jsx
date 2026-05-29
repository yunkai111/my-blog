'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError('')

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
      callbackUrl: '/admin/posts',
    })

    setPending(false)

    if (!result || result.error) {
      setError('用户名或密码不正确。')
      return
    }

    window.location.href = result.url ?? '/admin/posts'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-slate-600">用户名</label>
        <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" required />
      </div>
      <div>
        <label className="mb-2 block text-sm text-slate-600">密码</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-500" required />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? '登录中…' : '进入后台'}
      </button>
    </form>
  )
}
