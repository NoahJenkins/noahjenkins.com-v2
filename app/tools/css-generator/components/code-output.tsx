"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CodeOutputProps {
  gradient: string
}

type OutputFormat = 'css' | 'scss' | 'tailwind'

export function CodeOutput({ gradient }: CodeOutputProps) {
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('css')
  const [copied, setCopied] = useState(false)

  const generateCode = useCallback((format: OutputFormat, gradient: string) => {
    switch (format) {
      case 'css':
        return `.gradient-element {
  background: ${gradient};
  /* Fallback for older browsers */
  background: #fecb3e;
}`

      case 'scss':
        return `$gradient: ${gradient};

.gradient-element {
  background: $gradient;
  // Fallback for older browsers
  background: #fecb3e;
}`

      case 'tailwind':
        // For Tailwind, we'll show how to add it to the config
        return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': '${gradient}',
      }
    }
  }
}

// Usage in HTML
<div class="bg-custom-gradient">
  <!-- Your content -->
</div>`

      default:
        return ''
    }
  }, [])

  const copyToClipboard = async () => {
    try {
      const code = generateCode(outputFormat, gradient)
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadCode = () => {
    const code = generateCode(outputFormat, gradient)
    const filename = `gradient-${Date.now()}.${outputFormat === 'tailwind' ? 'js' : outputFormat}`
    
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formats: { key: OutputFormat; label: string }[] = [
    { key: 'css', label: 'CSS' },
    { key: 'scss', label: 'SCSS' },
    { key: 'tailwind', label: 'Tailwind' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Code Output</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadCode}
            className="hover:text-[#fecb3e]"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="hover:text-[#fecb3e]"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Format Selector */}
      <div className="flex space-x-2">
        {formats.map(format => (
          <button
            key={format.key}
            onClick={() => setOutputFormat(format.key)}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              outputFormat === format.key
                ? 'bg-[#fecb3e] text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {format.label}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <motion.div
        key={`${outputFormat}-${gradient}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm">
          <code className="text-gray-300 font-mono whitespace-pre">
            {generateCode(outputFormat, gradient)}
          </code>
        </pre>
      </motion.div>

      {/* Quick CSS Copy */}
      <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Quick CSS Property:</span>
          <button
            onClick={() => navigator.clipboard.writeText(`background: ${gradient};`)}
            className="text-xs text-[#fecb3e] hover:text-[#ffb43f] transition-colors"
          >
            Copy Property
          </button>
        </div>
        <code className="text-sm text-white font-mono">
          background: {gradient};
        </code>
      </div>

      {/* Usage Tips */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Usage Tips:</h4>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-start space-x-2">
            <div className="w-1 h-1 bg-[#fecb3e] rounded-full mt-2 flex-shrink-0" />
            <span>Always provide a fallback color for older browsers</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1 h-1 bg-[#fecb3e] rounded-full mt-2 flex-shrink-0" />
            <span>Use gradients for backgrounds, not directly on text for better accessibility</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1 h-1 bg-[#fecb3e] rounded-full mt-2 flex-shrink-0" />
            <span>Test your gradient on different screen sizes and devices</span>
          </div>
        </div>
      </div>
    </div>
  )
}