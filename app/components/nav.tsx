"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState } from 'react'

const navItems = {
  '/': {
    name: 'Home',
  },
  '/about': {
    name: 'About',
  },
  '/resume': {
    name: 'Resume',
  },
  '/voices': {
    name: 'Voices',
  },
  '/tools/css-generator': {
    name: 'CSS Generator',
  },
  '/blog': {
    name: 'Blog',
  },
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="w-full bg-black/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center">
              <span className="text-black font-bold text-sm">NJ</span>
            </div>
            <span className="text-white font-semibold text-lg">Noah Jenkins</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {Object.entries(navItems).map(([path, { name }]) => {
              const isActive = pathname === path
              return (
                <Link
                  key={path}
                  href={path}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg group"
                >
                  <span
                    className={`relative z-10 ${
                      isActive
                        ? 'text-black'
                        : 'text-gray-300 group-hover:text-white'
                    }`}
                  >
                    {name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] rounded-lg"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNav navItems={navItems} currentPath={pathname} />
          </div>
        </div>
      </div>
    </nav>
  )
}

function MobileNav({ navItems, currentPath }: { navItems: Record<string, { name: string }>, currentPath: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-300 hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 py-4"
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col space-y-2">
              {Object.entries(navItems).map(([path, { name }]) => {
                const isActive = currentPath === path
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] text-black'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {name}
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
