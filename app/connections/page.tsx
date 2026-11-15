import type { Metadata } from 'next'
import ConnectionsPage from './page-content'

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Ways to connect with Noah Jenkins: social profiles, professional networks and contact links.',
}

export default function Page() {
  return <ConnectionsPage />
}
