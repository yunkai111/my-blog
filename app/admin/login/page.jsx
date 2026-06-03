import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { LoginForm } from '@/components/login-form'
import { authOptions } from '@/lib/auth'

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.email) {
    redirect('/admin/posts')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-xs tracking-[0.3em] text-slate-400">ADMIN</p>
        <h1 className="mt-4 font-serif text-3xl font-bold tracking-[0.12em] text-slate-900">登录后台</h1>
<div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
