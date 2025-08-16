"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Twitter, Home, ExternalLink } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export default function ConnectionsPage() {
  const connections = [
    {
      icon: Home,
      title: "Website",
      description: "My personal portfolio and blog",
      href: "https://noahjenkins.com",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Linkedin,
      title: "LinkedIn",
      description: "Professional network and career updates",
      href: "https://www.linkedin.com/in/noah-jenkins/",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Twitter,
      title: "Twitter",
      description: "Thoughts, tech updates, and voice work",
      href: "https://x.com/GeekyVoices",
      color: "from-sky-500 to-sky-600"
    },
    {
      icon: Github,
      title: "GitHub",
      description: "Open source projects and code repositories",
      href: "https://github.com/noahjenkins",
      color: "from-gray-700 to-gray-800"
    }
  ]

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Let's Connect
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Find me across the web
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {connections.map((connection, index) => (
              <motion.div
                key={connection.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full group cursor-pointer border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${connection.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <connection.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{connection.title}</CardTitle>
                    <CardDescription className="text-gray-400">{connection.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full border-white/20 hover:border-[#fecb3e] hover:bg-gradient-to-r hover:from-[#fecb3e] hover:to-[#ffb43f] hover:text-black transition-all duration-300"
                    >
                      <a
                        href={connection.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        Visit
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>
    </main>
  )
}