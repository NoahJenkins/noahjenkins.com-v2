"use client"

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { TerminalModal } from './terminal-modal'

export function GlobalTerminal() {
  const [isVisible, setIsVisible] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        setIsVisible(prev => !prev)
      }
      
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible])

  useEffect(() => {
    setIsVisible(false)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current)
      }
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop and not during any interaction
    if (e.target === e.currentTarget && !isInteracting) {
      setIsVisible(false)
    }
  }

  const handleInteractionStart = () => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current)
    }
    setIsInteracting(true)
  }

  const handleInteractionEnd = () => {
    // Use a timeout to ensure the interaction state persists briefly
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false)
    }, 150)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <TerminalModal 
          onClose={() => setIsVisible(false)} 
          onInteractionStart={handleInteractionStart}
          onInteractionEnd={handleInteractionEnd}
        />
      </div>
    </div>
  )
}