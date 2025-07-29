"use client"

import { useState, useEffect } from "react"

interface TerminalOutputProps {
  lines: string[]
  onComplete?: () => void
}

export function TerminalOutput({ lines, onComplete }: TerminalOutputProps) {
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
      }, 20) // Fast typing speed

      return () => clearTimeout(timeout)
    } else {
      // Move to next line
      const timeout = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)
        setDisplayedLines(prev => [...prev, ""])
      }, 50)

      return () => clearTimeout(timeout)
    }
  }, [currentLineIndex, currentCharIndex, lines, onComplete])

  // Reset when lines change
  useEffect(() => {
    setDisplayedLines([])
    setCurrentLineIndex(0)
    setCurrentCharIndex(0)
  }, [lines])

  return (
    <div className="font-mono text-sm">
      {displayedLines.map((line, index) => (
        <div key={index} className="min-h-[1.2em]">
          {line}
        </div>
      ))}
    </div>
  )
}