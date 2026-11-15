import type { Metadata } from 'next'
import CSSGeneratorPage from './page-content'

export const metadata: Metadata = {
  title: 'CSS Gradient Generator',
  description: 'A free CSS gradient generator. Pick colors and angles, preview the result live and copy the CSS.',
}

export default function Page() {
  return <CSSGeneratorPage />
}
