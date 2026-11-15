import type { Metadata } from 'next'
import VoicesPage from './page-content'

export const metadata: Metadata = {
  title: 'Voice Acting',
  description: 'Voice acting demos and services from Noah Jenkins: commercial, narration and character work, with audio samples to listen to.',
}

export default function Page() {
  return <VoicesPage />
}
