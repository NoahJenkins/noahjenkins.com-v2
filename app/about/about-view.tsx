"use client"

import { motion } from "framer-motion"
import { Download, Calendar, MapPin } from "lucide-react"
import { GithubIcon as Github } from "@/components/icons/brand-icons"
import type { GitHubStats } from "../../lib/github-api"
import { GitHubStatsComponent } from "@/components/ui/github-stats"
import { ScrollReveal } from "@/components/animations/scroll-reveal"
import { Button } from "@/components/ui/button"

export default function AboutView({ readmeHtml, stats }: { readmeHtml: string; stats: GitHubStats | null }) {
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
              <Button variant="secondary" asChild>
                <a
                  href="https://1drv.ms/w/c/a2b0a06449186268/EWhiGElkoLAggKJbKQMAAAABLokJe7naLe1OEKYi-Xd88g?e=awvhSH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GitHub Stats (hidden when the GitHub API is unavailable) */}
      {stats && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center mb-12 text-white">
                GitHub Activity
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <GitHubStatsComponent stats={stats} />
            </ScrollReveal>
          </div>
        </section>
      )}

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
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            </div>
          </ScrollReveal>
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
              <Button variant="secondary" size="lg" asChild>
                <a href="/projects">
                  View My Work
                </a>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
