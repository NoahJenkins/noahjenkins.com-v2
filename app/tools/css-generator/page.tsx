"use client"

// Static generation - this page doesn't change often
export const dynamic = 'force-static'

import { motion } from "framer-motion"
import { Palette, Code, Download, Wand2 } from "lucide-react"
import { ScrollReveal } from "@/components/animations/scroll-reveal"
import { GradientGenerator } from "./components/gradient-generator"

export default function CSSGeneratorPage() {
  const features = [
    {
      icon: Palette,
      title: "Live Preview",
      description: "See your gradient changes in real-time with an interactive preview panel."
    },
    {
      icon: Code,
      title: "Multiple Formats",
      description: "Export your gradients as CSS, SCSS, or Tailwind CSS classes."
    },
    {
      icon: Wand2,
      title: "Gradient Types",
      description: "Create linear, radial, and conic gradients with precise control."
    },
    {
      icon: Download,
      title: "Save & Load",
      description: "Save your favorite gradients and load them later for reuse."
    }
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
                <Palette className="h-16 w-16 text-[#fecb3e]" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              CSS Gradient Generator
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create beautiful CSS gradients with ease. Design, customize, and export 
              professional-grade gradients for your web projects with real-time preview 
              and multiple export formats.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center justify-center space-x-2 text-gray-400 mb-8"
            >
              <Code className="h-5 w-5 text-[#fecb3e]" />
              <span>Interactive gradient designer</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/5 to-[#ffb43f]/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Powerful Features
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.1}>
                <motion.div
                  className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-[#fecb3e]/30 transition-all duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Main Generator Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Start Creating
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Use the interactive gradient generator below to create your perfect gradient. 
                Adjust colors, directions, and export when ready.
              </p>
            </div>
          </ScrollReveal>

          <GradientGenerator />
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/10 to-[#ffb43f]/10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Pro Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black/30 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-[#fecb3e] mb-3">Color Harmony</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Use complementary colors for vibrant gradients, or analogous colors 
                  for smooth, natural transitions. Consider the emotional impact of your color choices.
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-[#fecb3e] mb-3">Performance</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  CSS gradients are more performant than images. Use them for backgrounds, 
                  overlays, and decorative elements to improve page load times.
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-[#fecb3e] mb-3">Browser Support</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Modern gradients work in all current browsers. For older browser support, 
                  consider providing fallback solid colors.
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-[#fecb3e] mb-3">Accessibility</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Ensure sufficient contrast when placing text over gradients. 
                  Test with color blindness simulators for inclusive design.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}