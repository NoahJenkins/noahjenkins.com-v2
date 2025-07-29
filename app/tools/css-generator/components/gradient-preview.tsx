"use client"

import { motion } from "framer-motion"
import { useState } from "react"

interface GradientPreviewProps {
  gradient: string
}

export function GradientPreview({ gradient }: GradientPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'box' | 'text' | 'button'>('box')

  const previewModes = [
    { key: 'box' as const, label: 'Background' },
    { key: 'text' as const, label: 'Text' },
    { key: 'button' as const, label: 'Button' }
  ]

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex space-x-2">
        {previewModes.map(mode => (
          <button
            key={mode.key}
            onClick={() => setPreviewMode(mode.key)}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              previewMode === mode.key
                ? 'bg-[#fecb3e] text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Preview Container */}
      <div className="relative">
        <motion.div
          key={`${previewMode}-${gradient}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-64 rounded-xl border border-gray-700 overflow-hidden"
        >
          {previewMode === 'box' && (
            <div
              className="w-full h-full"
              style={{ background: gradient }}
            />
          )}

          {previewMode === 'text' && (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <h2
                className="text-6xl font-bold text-transparent bg-clip-text"
                style={{ backgroundImage: gradient }}
              >
                Gradient
              </h2>
            </div>
          )}

          {previewMode === 'button' && (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <motion.button
                className="px-8 py-4 text-white font-semibold rounded-xl shadow-lg"
                style={{ background: gradient }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Click Me
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Gradient Info Overlay */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-xs text-gray-300 font-mono">
            Preview: {previewMode}
          </div>
        </div>
      </div>

      {/* CSS Property Display */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
        <div className="text-xs text-gray-400 mb-1">CSS Property:</div>
        <code className="text-sm text-[#fecb3e] font-mono break-all">
          background: {gradient};
        </code>
      </div>
    </div>
  )
}