import 'server-only'
import { prisma } from '@/lib/prisma'
import { parseMonologueInput } from '@/lib/markdown'

const MONOLOGUE_KEY = 'monologue'

const monologueSelect = {
  key: true,
  title: true,
  markdown: true,
  updatedAt: true,
  createdAt: true,
}

export async function getMonologue() {
  const content = await prisma.siteContent.findUnique({
    where: { key: MONOLOGUE_KEY },
    select: monologueSelect,
  })

  if (content) {
    return content
  }

  return {
    key: MONOLOGUE_KEY,
    title: '独白',
    markdown: '留下一段关于自己的介绍。',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateMonologue(input) {
  const data = parseMonologueInput(input)

  return prisma.siteContent.upsert({
    where: { key: MONOLOGUE_KEY },
    create: {
      key: MONOLOGUE_KEY,
      title: data.title,
      markdown: data.markdown,
    },
    update: {
      title: data.title,
      markdown: data.markdown,
    },
    select: monologueSelect,
  })
}
