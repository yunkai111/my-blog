'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-700"
    >
      退出登录
    </button>
  )
}
