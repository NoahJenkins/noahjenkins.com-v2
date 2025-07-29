"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Github, Download, Calendar, MapPin } from "lucide-react"
import { getGitHubReadme, getGitHubStats, getFeaturedRepos, GitHubStats, GitHubRepo } from "../../lib/github-api"
import { GitHubStatsComponent } from "../../components/ui/github-stats"
import { RepoCard } from "../../components/ui/repo-card"
import { ScrollReveal } from "../../components/animations/scroll-reveal"
import { Button } from "../../components/ui/button"

export default function AboutPage() {
  const [readme, setReadme] = useState<string>("")
  const [stats, setStats] = useState<GitHubStats | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [readmeData, statsData, reposData] = await Promise.all([
          getGitHubReadme(),
          getGitHubStats(),
          getFeaturedRepos()
        ])
        
        setReadme(readmeData)
        setStats(statsData)
        setRepos(reposData)
      } catch (error) {
        console.error('Failed to fetch GitHub data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatMarkdown = (markdown: string) => {
    // Enhanced markdown parser for better GitHub README rendering
    let html = markdown
      // Headers with proper sizing
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl md:text-2xl font-semibold mb-4 text-white mt-8 first:mt-0">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg md:text-xl font-semibold mb-3 text-white mt-6">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 class="text-base md:text-lg font-semibold mb-3 text-white mt-4">$1</h4>')
      
      // Convert HTML p align="left" blocks with multiple badges to flex containers
      .replace(/<p align="left">([\s\S]*?)<\/p>/g, (match, content) => {
        // Check if this p block contains multiple image links (badges)
        const imageCount = (content.match(/<img/g) || []).length
        if (imageCount >= 2) {
          return `<div class="flex flex-wrap gap-2 mb-4">${content}</div>`
        }
        return match // Keep original if not a badge group
      })
      
      // Images (badges, icons, etc.) - make them inline
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="inline h-5 mr-1 mb-1" />')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#fecb3e] hover:text-[#ffb43f] underline">$1</a>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-200 italic">$1</em>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-gray-800 rounded text-[#fecb3e] font-mono text-sm">$1</code>')
      
      // Code blocks
      .replace(/```([\\s\\S]*?)```/g, '<pre class="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-[#fecb3e] font-mono text-sm">$1</code></pre>')

    // Split into lines for processing
    const lines = html.split('\n')
    const processedLines: string[] = []
    let inList = false
    let listItems: string[] = []
    let badgeGroup: string[] = []
    let inFlexContainer = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Check if we're entering or leaving a flex container
      if (line.includes('<div class="flex flex-wrap gap-2 mb-4">')) {
        inFlexContainer = true
        processedLines.push(line)
        continue
      } else if (line.includes('</div>') && inFlexContainer) {
        inFlexContainer = false
        processedLines.push(line)
        continue
      }
      
      // If we're in a flex container, just pass through the content
      if (inFlexContainer) {
        processedLines.push(line)
        continue
      }
      
      // Check if this line contains only badges/images (GitHub README pattern)
      const isBadgeLine = line.includes('<img') && !line.includes('<h') && 
                         (line.match(/<img/g) || []).length >= 1 &&
                         line.replace(/<img.*?>/g, '').trim().length < 10 // Minimal text besides images
      
      if (isBadgeLine) {
        badgeGroup.push(line)
        continue
      } else if (badgeGroup.length > 0) {
        // Close badge group and render horizontally
        processedLines.push(`<div class="flex flex-wrap gap-2 mb-4">${badgeGroup.join(' ')}</div>`)
        badgeGroup = []
      }
      
      // Handle list items
      if (line.match(/^[\-\*\+] /)) {
        const listContent = line.replace(/^[\-\*\+] /, '')
        listItems.push(`<li class="text-gray-300">${listContent}</li>`)
        inList = true
      } else {
        // Close previous list if we were in one
        if (inList) {
          processedLines.push(`<ul class="flex flex-wrap gap-2 mb-4 list-none">${listItems.join('')}</ul>`)
          listItems = []
          inList = false
        }
        
        // Process regular lines
        if (line === '') {
          processedLines.push('<div class="mb-2"></div>')
        } else if (line.includes('<h') || line.includes('<pre')) {
          processedLines.push(line)
        } else if (!line.includes('<')) {
          processedLines.push(`<p class="text-gray-300 leading-relaxed mb-4">${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
    }
    
    // Don't forget to close any remaining groups
    if (badgeGroup.length > 0) {
      processedLines.push(`<div class="flex flex-wrap gap-2 mb-4">${badgeGroup.join(' ')}</div>`)
    }
    if (inList) {
      processedLines.push(`<ul class="flex flex-wrap gap-2 mb-4 list-none">${listItems.join('')}</ul>`)
    }

    return processedLines.join('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#fecb3e] border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #fecb3e 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] p-1">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Github className="h-16 w-16 text-[#fecb3e]" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              About Me
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Dynamically rendered from my GitHub profile • Always up-to-date
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/NoahJenkins"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Button>
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </a>
              <Button variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GitHub Stats */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              GitHub Activity
            </h2>
          </ScrollReveal>
          
          {stats && (
            <ScrollReveal delay={0.2}>
              <GitHubStatsComponent stats={stats} />
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* README Content */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/5 to-[#ffb43f]/5">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Profile README</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Auto-updated</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>GitHub</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="bg-black/50 rounded-lg p-8 border border-gray-800 backdrop-blur-sm">
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(readme) }}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Repositories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-4 text-white">
              Featured Projects
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              A showcase of my most popular and interesting repositories
            </p>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo, index) => (
              <RepoCard key={repo.name} repo={repo} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <ScrollReveal>
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Want to Collaborate?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              I'm always open to interesting projects and opportunities. 
              Let's build something amazing together!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:noah@noahjenkins.com"
                className="inline-block"
              >
                <Button size="lg">
                  Get In Touch
                </Button>
              </a>
              <Button variant="secondary" size="lg">
                View My Work
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}