"use client"

import { motion } from "framer-motion"
import { BookOpen, Calendar } from "lucide-react"
import { ScrollReveal } from "@/components/animations/scroll-reveal"

export function BlogHero() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #fecb3e 1px, transparent 0)`,
          backgroundSize: '60px 60px'
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
              <BookOpen className="h-16 w-16 text-[#fecb3e]" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
            Blog
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Thoughts on technology, development, and life. Sharing insights from 
            my journey as a cloud engineer, web developer, and voice actor.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center space-x-2 text-gray-400 mb-8"
          >
            <Calendar className="h-5 w-5 text-[#fecb3e]" />
            <span>Latest thoughts and tutorials</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}