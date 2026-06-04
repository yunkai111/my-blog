import { BlogShell, MusingsPage } from '@/components/blog-shell'
import { getGroupedPosts } from '@/lib/posts'

export const dynamic = 'force-dynamic'

export default async function MusingsRoute() {
  const groups = await getGroupedPosts()

  return (
    <BlogShell>
      <MusingsPage groups={groups} />
    </BlogShell>
  )
}
