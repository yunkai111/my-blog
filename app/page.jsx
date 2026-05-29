import { HomePageClient } from '@/components/home-page-client'
import { getHomepagePosts } from '@/lib/posts'

export default async function Home() {
  const articles = await getHomepagePosts()

  return <HomePageClient articles={articles} />
}
