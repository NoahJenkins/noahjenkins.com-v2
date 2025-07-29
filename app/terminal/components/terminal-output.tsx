"use client"

import { useState, useEffect } from "react"

interface TerminalOutputProps {
  lines: string[]
  onComplete?: () => void
}

import { useRef } from "react"

export function TerminalOutput({ lines, onComplete }: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      onComplete?.()
      return
    }

    const currentLine = lines[currentLineIndex] || ""
    
    if (currentCharIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev]
          newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1)
          return newLines
        })
        setCurrentCharIndex(prev => prev + 1)
      }, 5) // Even faster typing speed

      return () => clearTimeout(timeout)
    } else {
      // Move to next line
      const timeout = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)
        setDisplayedLines(prev => [...prev, ""])
      }, 20)

      return () => clearTimeout(timeout)
    }
    // Auto-scroll to bottom as text renders
    if (containerRef.current) {
      // TypeScript fix: check for null before assignment
      const el = containerRef.current
      if (el) {
        // @ts-expect-error: TypeScript null check is handled above
        el.scrollTop = el.scrollHeight
      }
    }
  }, [currentLineIndex, currentCharIndex, lines, onComplete])

  // Reset when lines change
  useEffect(() => {
    setDisplayedLines([])
    setCurrentLineIndex(0)
    setCurrentCharIndex(0)
  }, [lines])

  return (
    <div ref={containerRef} className="font-mono text-sm">
      {displayedLines.map((line, index) => (
        <div key={index} className="min-h-[1.2em]">
          {line}
        </div>
      ))}
    </div>
  )
}