import 'server-only'
import { PrismaClient } from '@prisma/client'

/**
 * 开发环境下 Next.js 的 HMR 会反复执行模块,若每次都 new PrismaClient
 * 会迅速耗尽数据库连接池。把实例挂到 globalThis 上即可在重新加载后复用。
 * 生产环境每个 lambda/Node 进程只加载一次,无需挂载。
 *
 * @type {{ prisma?: import('@prisma/client').PrismaClient }}
 */
const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
