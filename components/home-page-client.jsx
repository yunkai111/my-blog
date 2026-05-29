'use client'

import { BlogShell, HomePage } from '@/components/blog-shell'

export function HomePageClient({ articles }) {
  return (
    <BlogShell>
      <InnerHome articles={articles} />
    </BlogShell>
  )
}

function InnerHome({ articles }) {
  return <HomePage articles={articles} />
}
