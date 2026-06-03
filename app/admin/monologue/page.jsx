import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ArrowLeft, UserCheck } from 'lucide-react'
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
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-5xl">
        
        {/* 顶部优雅面包屑 + 返回动作 */}
        <div className="mb-6">
          <Link 
            href="/admin/posts" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeft size={13} />
            <span>返回控制台</span>
          </Link>
        </div>

        {/* 沉浸式独白工作台底座 */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 md:p-10 shadow-sm shadow-slate-100/60 transition-all duration-300">
          
          {/* 工作台精致头部 */}
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Profile Settings</p>
            </div>
            
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-50 p-2 text-slate-700 border border-slate-100">
                  <UserCheck size={20} />
                </div>
                <h1 className="font-serif text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  修改个人独白
                </h1>
              </div>
              <p className="text-xs text-slate-400 sm:text-right">
                内容将实时同步至前台页面
              </p>
            </div>
          </div>

          {/* 核心表单组件载入区 */}
          <div className="mt-6">
            <MonologueForm monologue={monologue} />
          </div>

        </div>
      </div>
    </main>
  )
}