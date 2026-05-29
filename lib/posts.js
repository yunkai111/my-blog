import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toChineseYear } from '@/lib/markdown'

const adminPostSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  markdown: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
}

export async function getPublishedPosts() {
  noStore()
  return prisma.post.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      markdown: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getHomepagePosts() {
  const posts = await getPublishedPosts()
  return posts.slice(0, 3).map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
  }))
}

export async function getGroupedPosts() {
  const posts = await getPublishedPosts()
  const grouped = new Map()

  for (const post of posts) {
    const yearNumber = post.publishedAt.getFullYear()
    const year = toChineseYear(yearNumber)
    if (!grouped.has(year)) {
      grouped.set(year, [])
    }
    grouped.get(year).push({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
    })
  }

  return [...grouped.entries()].map(([year, pieces]) => ({ year, pieces }))
}

export async function getPublishedPostBySlug(slug) {
  noStore()
  return prisma.post.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      markdown: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getAdminPosts() {
  noStore()
  return prisma.post.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getAdminPostById(id) {
  noStore()
  return prisma.post.findUnique({
    where: { id },
    select: adminPostSelect,
  })
}

export async function createPost(data, authorId) {
  const existing = await prisma.post.findUnique({ where: { slug: data.slug } })
  if (existing) {
    throw new Error('同名 slug 的文章已存在，请修改 slug 或标题')
  }

  return prisma.post.create({
    data: {
      ...data,
      authorId,
    },
    select: adminPostSelect,
  })
}

export async function updatePost(id, data) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('文章不存在')
  }

  const duplicated = await prisma.post.findFirst({
    where: {
      slug: data.slug,
      id: { not: id },
    },
    select: { id: true },
  })

  if (duplicated) {
    throw new Error('同名 slug 的文章已存在，请修改 slug 或标题')
  }

  return prisma.post.update({
    where: { id },
    data,
    select: adminPostSelect,
  })
}

export async function deletePost(id) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw new Error('文章不存在')
  }

  await prisma.post.delete({ where: { id } })
}
