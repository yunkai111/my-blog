import { BlogShell, HomePage } from '@/components/blog-shell'
import { getHomepagePosts } from '@/lib/posts'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const articles = await getHomepagePosts()

  return (
    <BlogShell>
      <HomePage articles={articles} />
    </BlogShell>
  )
}
