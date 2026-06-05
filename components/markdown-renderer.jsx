'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Children } from 'react'

const BLOCK_TYPES = new Set(['figure', 'div', 'section', 'article', 'blockquote', 'pre', 'ul', 'ol', 'table'])

function isBlockElement(child) {
  if (!child || typeof child !== 'object') return false
  const type = child.type
  if (typeof type === 'string') return BLOCK_TYPES.has(type)
  if (typeof type === 'function') {
    const name = type.displayName || type.name || ''
    return BLOCK_TYPES.has(name)
  }
  return false
}

/**
 * Custom <p> that unwraps when its children include block-level elements,
 * preventing invalid DOM nesting like <p><figure>...</figure></p>.
 */
function SafeParagraph({ children, ...props }) {
  const kids = Children.toArray(children)
  if (kids.some(isBlockElement)) {
    return <>{children}</>
  }
  return <p {...props}>{children}</p>
}

/**
 * Custom <img> renderer that wraps images in <figure> with optional
 * caption from alt text, bleed layout, and loading placeholder.
 */
function MarkdownImage({ src, alt }) {
  if (!src) return null

  return (
    <figure className="not-prose group relative my-10 md:-mx-12 lg:-mx-24">
      <div className="overflow-hidden rounded-2xl bg-slate-50 shadow-md shadow-slate-100">
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          className="w-full object-cover"
        />
      </div>
      {alt && (
        <figcaption className="mt-2 text-center text-xs italic text-slate-400">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

const components = {
  p: SafeParagraph,
  img: MarkdownImage,
}

export function MarkdownRenderer({ children }) {
  return (
    <div className="prose-custom space-y-6 text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
