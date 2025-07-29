"use client"

import { motion } from "framer-motion"
import { ArrowRight, Github, Linkedin, Mail, Twitter, Code, Mic, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Typewriter } from "../components/animations/typewriter"
import { ScrollReveal } from "../components/animations/scroll-reveal"
import { GradientAnimation } from "../components/animations/gradient-animation"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <GradientAnimation className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        </GradientAnimation>
        
        <div className="relative z-20 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Noah Jenkins
            </h1>
            <div className="text-xl md:text-2xl text-gray-300 mb-8 h-16">
              <Typewriter 
                text="Cloud Engineer • Web Developer • Voice Actor"
                speed={1}
                delay={100}
                className="block"
              />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Passionate about building scalable cloud solutions, crafting elegant web experiences, 
            and bringing stories to life through voice. Always exploring the intersection of technology and creativity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button size="lg" className="group">
              View My Work
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a
                href="https://1drv.ms/w/c/a2b0a06449186268/EWhiGElkoLAggKJbKQMAAAABLokJe7naLe1OEKYi-Xd88g?e=awvhSH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
                Resume
              </a>
            </Button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="flex justify-center space-x-6"
          >
            {[
              {
                icon: Github,
                href: "https://github.com/noahjenkins",
                label: "GitHub",
              },
              {
                icon: Linkedin,
                href: "https://www.linkedin.com/in/noah-jenkins/",
                label: "LinkedIn",
              },
              {
                icon: Twitter,
                href: "https://x.com/GeekyVoices",
                label: "Twitter",
              },
              {
                icon: Mail,
                href: "mailto:noah@noahjenkins.com",
                label: "Email",
              },
            ].map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#fecb3e] hover:to-[#ffb43f] transition-all duration-300 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={label}
              >
                <Icon className="h-6 w-6 group-hover:text-black transition-colors" />
                <span className="sr-only">{label}</span>
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-gradient-to-b from-[#fecb3e] to-[#ffb43f] rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Work Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Featured Work
            </h2>
            <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
              Explore my diverse portfolio spanning cloud infrastructure, web development, and voice-over projects.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: "Cloud Solutions",
                description: "Scalable infrastructure and DevOps automation for modern applications.",
                href: "/blog"
              },
              {
                icon: FileText,
                title: "Web Development",
                description: "Full-stack applications with modern frameworks and best practices.",
                href: "/tools/css-generator"
              },
              {
                icon: Mic,
                title: "Voice Acting",
                description: "Professional voice-over work for commercials, audiobooks, and more.",
                href: "/voices"
              }
            ].map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 0.2}>
                <Link href={item.href}>
                  <Card className="h-full group cursor-pointer">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <item.icon className="h-6 w-6 text-black" />
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-[#fecb3e] group-hover:translate-x-2 transition-transform">
                        <span className="text-sm font-medium">Explore</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-gradient-to-r from-[#fecb3e]/5 to-[#ffb43f]/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              I'm always excited to collaborate on innovative projects. Whether you need cloud architecture, 
              web development, or professional voice work, let's create something extraordinary together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Link href="/about" className="flex items-center">
                  Get to Know Me
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg">
                <Mail className="mr-2 h-4 w-4" />
                Let's Connect
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </main>
  )
}
