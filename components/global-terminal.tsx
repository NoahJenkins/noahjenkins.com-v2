"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { TerminalModal } from './terminal-modal'

export function GlobalTerminal() {
  const [isVisible, setIsVisible] = useState(false)
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

  if (!isVisible) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setIsVisible(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <TerminalModal onClose={() => setIsVisible(false)} />
      </div>
    </div>
  )
}