import { hash } from 'bcryptjs'
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient()
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const name = process.env.ADMIN_NAME?.trim() || 'Yunkai'
const password = process.env.ADMIN_PASSWORD?.trim()

if (!email || !password) {
  throw new Error('请先在 .env.local 中设置 ADMIN_EMAIL 和 ADMIN_PASSWORD')
}

const passwordHash = await hash(password, 12)

await prisma.user.upsert({
  where: { email },
  update: {
    name,
    passwordHash,
  },
  create: {
    email,
    name,
    passwordHash,
  },
})

console.log(`Admin user ready: ${email}`)
await prisma.$disconnect()
