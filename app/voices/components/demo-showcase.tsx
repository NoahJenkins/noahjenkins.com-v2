"use client"

import { motion } from "framer-motion"
import { ScrollReveal } from "@/components/animations/scroll-reveal"
import { AudioPlayer } from "./audio-player"

interface VoiceDemo {
  id: string
  title: string
  description: string
  audioUrl: string // M4A file for streaming (better performance)
  downloadUrl?: string // MP3 file for downloads (better compatibility)
  category: string
}

const voiceDemos: VoiceDemo[] = [
  {
    id: "commercial-1",
    title: "Commercial Voice Demo",
    description: "This demo showcases voice work for all types of commercials. From conversational reads to authoritative announcements, demonstrating the range and versatility needed for various commercial applications.",
    audioUrl: "/assets/audio/Noah_Jenkins_Commercial_compressed.m4a", // Compressed for streaming
    downloadUrl: "/assets/audio/Noah_Jenkins_Commercial.mp3", // Original MP3 for downloads
    category: "Commercial"
  },
  {
    id: "character-1", 
    title: "Character Voice Demo",
    description: "Dynamic character voice work showcasing range and versatility. This demo highlights the ability to create distinct, memorable characters with unique vocal qualities perfect for animation, gaming, and audiobook projects.",
    audioUrl: "/assets/audio/NoahJenkins_CharacterDemo_compressed.m4a", // Compressed for streaming
    downloadUrl: "/assets/audio/NoahJenkins_CharacterDemo.mp3", // Original MP3 for downloads
    category: "Character"
  }
]

export function DemoShowcase() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Voice Demo Reel
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional voice-over samples showcasing range, versatility, and technical excellence. 
              Each demo is recorded in a professional home studio with broadcast-quality equipment.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {voiceDemos.map((demo, index) => (
            <ScrollReveal key={demo.id} delay={index * 0.2}>
              <AudioPlayer
                title={demo.title}
                description={demo.description}
                audioUrl={demo.audioUrl}
                downloadUrl={demo.downloadUrl}
                category={demo.category}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Call to Action */}
        <ScrollReveal delay={0.6}>
          <div className="mt-16 text-center p-8 bg-gradient-to-r from-[#fecb3e]/10 to-[#ffb43f]/10 rounded-xl border border-[#fecb3e]/20">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Ready to Work Together?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              I'm available for commercial voice-over, narration, audiobook recording, 
              e-learning content, and custom voice projects. Let's discuss your next project!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="mailto:voice@noahjenkins.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] text-black font-semibold rounded-lg hover:from-[#ffb43f] hover:to-[#fecb3e] transition-all duration-300"
              >
                Get a Custom Quote
              </motion.a>
              <motion.a
                href="/projects#acting"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border-2 border-[#fecb3e] text-[#fecb3e] font-semibold rounded-lg hover:bg-[#fecb3e] hover:text-black transition-all duration-300"
              >
                View Full Portfolio
              </motion.a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}