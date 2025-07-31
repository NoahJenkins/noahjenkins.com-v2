import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { GlobalTerminal } from '../components/global-terminal'
import { baseUrl } from './sitemap'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Noah Jenkins - Cloud Engineer & Web Developer',
    template: '%s | Noah Jenkins',
  },
  description: 'Cloud Engineer, Web Developer, and Voice Actor passionate about building scalable solutions and bringing stories to life. Explore my portfolio featuring cloud infrastructure, full-stack applications, and professional voice work.',
  keywords: ['Noah Jenkins', 'Cloud Engineer', 'Web Developer', 'Voice Actor', 'AWS', 'React', 'Next.js', 'DevOps', 'Full Stack', 'Voice Over'],
  authors: [{ name: 'Noah Jenkins', url: 'https://noahjenkins.com' }],
  creator: 'Noah Jenkins',
  openGraph: {
    title: 'Noah Jenkins - Cloud Engineer & Web Developer',
    description: 'Cloud Engineer, Web Developer, and Voice Actor passionate about building scalable solutions and bringing stories to life.',
    url: baseUrl,
    siteName: 'Noah Jenkins Portfolio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/assets/images/Icon.jpeg',
        width: 1200,
        height: 630,
        alt: 'Noah Jenkins - Cloud Engineer & Web Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noah Jenkins - Cloud Engineer & Web Developer',
    description: 'Cloud Engineer, Web Developer, and Voice Actor passionate about building scalable solutions.',
    creator: '@GeekyVoices',
    images: ['/assets/images/Icon.jpeg'],
  },
  icons: {
    icon: '/assets/images/Icon.webp',
    shortcut: '/assets/images/Icon.webp',
    apple: '/assets/images/Icon.jpeg', // Keep JPEG for Apple (better compatibility)
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes: (string | undefined | null)[]) => classes.filter(Boolean).join(' ');

import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname
  // For SSR, fallback to '' (will be ignored for hydration)
  const isHome = pathname === '/' || typeof window === 'undefined'
  return (
    <html
      lang="en"
      className={cx(
        'text-black bg-white dark:text-white',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <head>
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="preconnect" href="https://vercel.live" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body className="antialiased min-h-screen w-full m-0 p-0 bg-black">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Analytics />
          <SpeedInsights />
          <GlobalTerminal />
        </div>
      </body>
    </html>
  )
}
