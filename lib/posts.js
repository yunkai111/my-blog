import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toChineseYear } from '@/lib/markdown'

/* ── Select shapes ── */
const adminPostSelect = {
  id: true, slug: true, title: true, excerpt: true, markdown: true,
  coverImage: true, isPublished: true,
  publishedAt: true, createdAt: true, updatedAt: true,
}

const publicPostSelect = {
  id: true, slug: true, title: true, excerpt: true, coverImage: true,
  markdown: true, publishedAt: true, createdAt: true, updatedAt: true,
}

/* ── Queries ── */

export async function getPublishedPosts() {
  noStore()
  return prisma.post.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: publicPostSelect,
  })
}

export function getHomepagePosts() {
  // Inline to avoid an extra async wrapper — getPublishedPosts is cached at
  // the call site (server component).
  return getPublishedPosts().then((posts) =>
    posts.slice(0, 3).map((p) => ({
      slug: p.slug, title: p.title, excerpt: p.excerpt, coverImage: p.coverImage,
    })),
  )
}

export async function getGroupedPosts() {
  const posts = await getPublishedPosts()
  const grouped = new Map()
  for (const p of posts) {
    const year = toChineseYear(p.publishedAt.getFullYear())
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year).push({
      slug: p.slug, title: p.title, excerpt: p.excerpt,
      publishedAt: p.publishedAt, coverImage: p.coverImage,
    })
  }
  return [...grouped.entries()].map(([year, pieces]) => ({ year, pieces }))
}

export async function getPublishedPostBySlug(slug) {
  noStore()
  return prisma.post.findFirst({
    where: { slug, isPublished: true },
    select: publicPostSelect,
  })
}

export async function getAdminPosts() {
  noStore()
  return prisma.post.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    select: adminPostSelect,
  })
}

export async function getAdminPostById(id) {
  noStore()
  return prisma.post.findUnique({ where: { id }, select: adminPostSelect })
}

/* ── Mutations ── */

export async function createPost(data, authorId) {
  const existing = await prisma.post.findUnique({ where: { slug: data.slug } })
  if (existing) throw new Error('同名 slug 的文章已存在，请修改 slug 或标题')
  return prisma.post.create({ data: { ...data, authorId }, select: adminPostSelect })
}

export async function updatePost(id, data) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) throw new Error('文章不存在')

  const dup = await prisma.post.findFirst({
    where: { slug: data.slug, id: { not: id } },
    select: { id: true },
  })
  if (dup) throw new Error('同名 slug 的文章已存在，请修改 slug 或标题')

  return prisma.post.update({ where: { id }, data, select: adminPostSelect })
}

export async function deletePost(id) {
  const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new Error('文章不存在')
  await prisma.post.delete({ where: { id } })
}
