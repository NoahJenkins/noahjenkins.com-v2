import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { baseUrl } from './sitemap'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Next.js Portfolio Starter',
    template: '%s | Next.js Portfolio Starter',
  },
  description: 'This is my portfolio.',
  openGraph: {
    title: 'My Portfolio',
    description: 'This is my portfolio.',
    url: baseUrl,
    siteName: 'My Portfolio',
    locale: 'en_US',
    type: 'website',
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
      <body
        className={
          isHome
            ? 'antialiased min-h-screen w-full m-0 p-0'
            : 'antialiased max-w-xl mx-4 mt-8 lg:mx-auto'
        }
      >
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0 vibrant-bg">
          <div className="header-bg">
            <Navbar />
          </div>
          {/* DEBUG: Main content area */}
          <div className="content-area" style={{ border: '2px dashed green', padding: '2px' }}>
            {children}
          </div>
          <div className="footer-bg">
            {/* DEBUG: Footer section */}
            <div style={{ border: '2px dashed blue', padding: '2px' }}>
              <Footer />
            </div>
          </div>
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  )
}
