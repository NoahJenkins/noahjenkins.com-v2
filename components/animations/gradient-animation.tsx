"use client"

import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

interface GradientAnimationProps {
  children: React.ReactNode
  className?: string
}

export function GradientAnimation({ children, className }: GradientAnimationProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#fecb3e] via-[#ffb43f] to-[#fecb3e] opacity-20"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear"
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}