import { z } from 'zod'
import matter from 'gray-matter'

const slugPattern = /^[a-z0-9-]+$/

const frontmatterSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  excerpt: z.string().trim().min(1).max(240).optional(),
  slug: z.string().trim().min(1).max(120).regex(slugPattern).optional(),
  publishedAt: z.string().trim().optional(),
  isPublished: z.boolean().optional(),
})

const editorPostSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(120, '标题不能超过 120 个字符'),
  excerpt: z.string().trim().max(240, '摘要不能超过 240 个字符').optional(),
  slug: z.string().trim().max(120, 'slug 不能超过 120 个字符').optional(),
  markdown: z.string().min(1, 'Markdown 正文不能为空'),
  publishedAt: z.string().trim().min(1, '请选择发布时间'),
  isPublished: z.boolean(),
})

const monologueSchema = z.object({
  title: z.string().trim().max(120, '标题不能超过 120 个字符').optional(),
  markdown: z.string().min(1, 'Markdown 正文不能为空'),
})



export const MAX_MARKDOWN_BYTES = 1024 * 1024

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function fallbackSlug() {
  return `post-${Date.now()}`
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[>#*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractFirstMarkdownTitle(markdown) {
  let inCodeBlock = false

  for (const rawLine of markdown.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim()

    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const match = rawLine.match(/^\s*#(?!#)\s+(.+?)\s*#*\s*$/)
    if (!match) {
      continue
    }

    return stripMarkdown(match[1]).slice(0, 120)
  }

  return ''
}

function getByteLength(value) {
  return new TextEncoder().encode(value).length
}

function ensureMarkdownWithinLimit(markdown) {
  if (getByteLength(markdown) > MAX_MARKDOWN_BYTES) {
    throw new Error('Markdown 内容超过 1MB 限制')
  }
}

export function parseMarkdownUpload(fileName, source) {
  const { data, content } = matter(source)
  const parsed = frontmatterSchema.safeParse(data)

  if (!parsed.success) {
    throw new Error('Markdown frontmatter 不合法')
  }

  const trimmedContent = content.trim()
  if (!trimmedContent) {
    throw new Error('Markdown 正文不能为空')
  }

  ensureMarkdownWithinLimit(trimmedContent)

  const markdownTitle = extractFirstMarkdownTitle(trimmedContent)
  const inferredTitle = parsed.data.title ?? markdownTitle ?? fileName.replace(/\.md$/i, '').replace(/[-_]/g, ' ').trim()
  const title = inferredTitle || '未命名文章'
  const generatedSlug = parsed.data.slug ?? slugify(title) ?? ''
  const slug = generatedSlug || fallbackSlug()
  const excerpt = parsed.data.excerpt ?? stripMarkdown(trimmedContent).slice(0, 120)
  const publishedAt = parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date()

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error('publishedAt 不是有效日期')
  }

  return {
    title,
    slug,
    excerpt: excerpt || '暂无摘要',
    markdown: trimmedContent,
    publishedAt,
    isPublished: parsed.data.isPublished ?? true,
  }
}

export function parseEditorPostInput(input) {
  const parsed = editorPostSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? '文章内容不合法')
  }

  const explicitTitle = parsed.data.title.trim()
  const markdown = parsed.data.markdown.trim()
  if (!markdown) {
    throw new Error('Markdown 正文不能为空')
  }

  ensureMarkdownWithinLimit(markdown)

  const markdownTitle = extractFirstMarkdownTitle(markdown)
  const title = markdownTitle || explicitTitle

  const rawSlug = parsed.data.slug?.trim() ?? ''
  const normalizedSlug = rawSlug ? rawSlug.toLowerCase() : slugify(title)
  const slug = normalizedSlug || fallbackSlug()

  if (!slugPattern.test(slug)) {
    throw new Error('slug 只能包含小写字母、数字和连字符')
  }

  const publishedAt = new Date(parsed.data.publishedAt)
  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error('发布时间不是有效日期')
  }

  const excerpt = parsed.data.excerpt?.trim() || stripMarkdown(markdown).slice(0, 120)

  return {
    title,
    slug,
    excerpt: excerpt || '暂无摘要',
    markdown,
    publishedAt,
    isPublished: parsed.data.isPublished,
  }
}

export function parseMonologueInput(input) {
  const parsed = monologueSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? '内容不合法')
  }

  const title = parsed.data.title?.trim() || '独白'
  const markdown = parsed.data.markdown.trim()
  if (!markdown) {
    throw new Error('Markdown 正文不能为空')
  }

  ensureMarkdownWithinLimit(markdown)

  return {
    title,
    markdown,
  }
}

export function toChineseYear(year) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  return String(year)
    .split('')
    .map((digit) => digits[Number(digit)] ?? digit)
    .join('')
}
