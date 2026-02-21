"use client"
import { Rss, Linkedin, Twitter, Mail } from "lucide-react"
import { useState, useEffect } from "react"
import Script from "next/script"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])
  
  return (
    <footer className="border-t border-gray-800 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center">
                <span className="text-black font-bold text-sm">NJ</span>
              </div>
              <span className="text-white font-semibold text-lg">Noah Jenkins</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Cloud Engineer, Web Developer, and Voice Actor crafting digital experiences 
              and bringing stories to life.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <a 
                href="/" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                Home
              </a>
              <a 
                href="/about" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                About
              </a>
              <a 
                href="/blog" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                Blog
              </a>
              <a 
                href="/projects" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                Projects
              </a>
              <a 
                href="/tools/css-generator" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                CSS Generator
              </a>
              <a 
                href="/voices" 
                className="block text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
              >
                Voices
              </a>
            </div>
          </div>

          {/* Connect Section */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Connect</h3>
            <div className="space-y-2">
              <a
                href="/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
                aria-label="RSS Feed"
              >
                <Rss className="h-4 w-4" />
                <span>RSS Feed</span>
              </a>
              <a
                href="https://www.linkedin.com/in/noah-jenkins/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
                aria-label="LinkedIn (Noah Jenkins)"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:noah@noahjenkins.com"
                className="flex items-center space-x-2 text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
                aria-label="Email Noah Jenkins"
              >
                <Mail className="h-4 w-4" />
                <span>noah@noahjenkins.com</span>
              </a>
              <a
                href="https://x.com/GeekyVoices"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-[#fecb3e] transition-colors duration-300 text-sm"
                aria-label="X (formerly Twitter) GeekyVoices"
              >
                <Twitter className="h-4 w-4" />
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-gray-400 text-sm">© {currentYear} NoahJenkins.com</p>
              <p className="text-gray-400 text-sm">© {currentYear} GeekyVoices.com</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end space-y-1">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Built with</span>
                <span className="text-[#fecb3e]">Next.js</span>
                <span>&</span>
                <span className="text-[#fecb3e]">Tailwind CSS</span>
              </div>
              <div className="text-xs text-gray-500">
                Press <kbd className="px-1 py-0.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300">{isMac ? 'Cmd+`' : 'Ctrl+`'}</kbd> to open terminal
              </div>
            </div>
          </div>
        </div>
      </div>
      <Script
        id="metricool-tracker"
        src="https://tracker.metricool.com/resources/be.js"
        onLoad={() => {
          // @ts-ignore
          beTracker.t({ hash: "4a08abc20a32716c21f3d50190045039" })
        }}
      />
    </footer>
  )
}
