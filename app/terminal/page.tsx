import type { Metadata } from 'next'
import ResumePage from './page-content'

export const metadata: Metadata = {
  title: 'Terminal Resume',
  description: 'An interactive terminal-style resume for Noah Jenkins. Type commands to explore skills, experience and projects.',
}

export default function Page() {
  return <ResumePage />
}
