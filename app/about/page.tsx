import type { Metadata } from 'next'
import { getGitHubReadme, getGitHubStats } from '@/lib/github-api'
import { renderReadmeHtml } from '@/lib/about-readme'
import AboutView from './about-view'

// Fetch GitHub data on the server so it is cached, not requested by every visitor's browser.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About',
  description: 'About Noah Jenkins: cloud engineer, web developer and voice actor. Profile, GitHub activity and background.',
}

export default async function AboutPage() {
  const [readme, stats] = await Promise.all([getGitHubReadme(), getGitHubStats()])
  return <AboutView readmeHtml={renderReadmeHtml(readme)} stats={stats} />
}
