"use client"

// Static generation - this page doesn't change often
export const dynamic = 'force-static'

import { motion } from "framer-motion"
import { Mic, Headphones, Radio, BookOpen, Play } from "lucide-react"
import { ScrollReveal } from "../../components/animations/scroll-reveal"
import { DemoShowcase } from "./components/demo-showcase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export default function VoicesPage() {
  const services = [
    {
      icon: Radio,
      title: "Commercial Voice-Over",
      description: "Engaging commercial reads for TV, radio, and digital advertising campaigns with authentic, relatable delivery."
    },
    {
      icon: BookOpen,
      title: "Audiobook Narration", 
      description: "Long-form narration with consistent character voices, proper pacing, and professional studio quality recording."
    },
    {
      icon: Headphones,
      title: "E-Learning Content",
      description: "Clear, educational voice-over for training modules, online courses, and instructional content that keeps learners engaged."
    },
    {
      icon: Mic,
      title: "Corporate Narration",
      description: "Professional corporate videos, presentations, and internal communications with authoritative yet approachable tone."
    }
  ]

  const equipment = [
    "AKG C214 Microphone",
    "Focusrite 2i2 3rd Gen Interface",
    "Comprehensive acoustic treatment and isolation",
    "Logic Pro X & Audacity DAWs",
    "Source Connect Ready capability",
    "JS2 XLR Splitter for secure track management"
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
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
                <Mic className="h-16 w-16 text-[#fecb3e]" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Voice Acting
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional voice-over services combining technical expertise with creative expression. 
              From commercial campaigns to audiobook narration, I bring stories and brands to life 
              with authentic, engaging vocal performances.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center justify-center space-x-2 text-gray-400 mb-8"
            >
              <Play className="h-5 w-5 text-[#fecb3e]" />
              <span>Listen to samples below</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo Showcase */}
      <DemoShowcase />

      {/* Services Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/5 to-[#ffb43f]/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
              Voice-Over Services
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Specialized voice-over services tailored to your project needs, delivered with 
              professional quality and quick turnaround times.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ScrollReveal key={service.title} delay={index * 0.1}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-black" />
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Setup Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-3xl font-bold mb-6 text-white">
                  Professional Home Studio
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  My dedicated home studio is equipped with broadcast-quality equipment and 
                  professional acoustic treatment, ensuring every recording meets industry standards 
                  for clarity, consistency, and audio fidelity.
                </p>
                <div className="space-y-3">
                  {equipment.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] rounded-full" />
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-[#fecb3e]/20 to-[#ffb43f]/20 rounded-2xl border border-[#fecb3e]/30 flex items-center justify-center">
                  <div className="text-center">
                    <Headphones className="h-24 w-24 text-[#fecb3e] mx-auto mb-4" />
                    <p className="text-gray-400">Professional Studio Setup</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] rounded-full opacity-20" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-[#ffb43f] to-[#fecb3e] rounded-full opacity-10" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Experience & Credentials */}
      <ScrollReveal>
        <section className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/10 to-[#ffb43f]/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-white">
              Experience & Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <div className="text-3xl font-bold text-[#fecb3e] mb-2">7+</div>
                <div className="text-gray-300">Years Experience</div>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-[#fecb3e] mb-2">1000+</div>
                <div className="text-gray-300">Hours Behind the Mic</div>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-[#fecb3e] mb-2">24hr</div>
                <div className="text-gray-300">Average Turnaround</div>
              </div>
            </div>
            <p className="text-gray-300 mt-8 max-w-2xl mx-auto leading-relaxed">
              Professionally trained with ongoing coaching in commercial
              technique, character development, and audio production. Specialized in authentic,
              conversational reads that connect with modern audiences.
            </p>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}