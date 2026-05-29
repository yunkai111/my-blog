import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { MonologueForm } from '@/components/monologue-form'
import { authOptions } from '@/lib/auth'
import { getMonologue } from '@/lib/site-content'

export default async function AdminMonologuePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const monologue = await getMonologue()

  return (
    <main className="min-h-screen bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-xs tracking-[0.3em] text-slate-400">EDIT MONOLOGUE</p>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.12em] text-slate-900">修改独白</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">在这里编辑你的自我介绍。内容会同步到前台独白页。</p>
        <div className="mt-8">
          <MonologueForm monologue={monologue} />
        </div>
      </div>
    </main>
  )
}
