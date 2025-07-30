"use client"

import { useState, useEffect, useRef, KeyboardEvent, MouseEvent } from "react"
import { CommandProcessor, CommandOutput } from "../app/terminal/components/command-processor"
import { TerminalOutput } from "../app/terminal/components/terminal-output"

interface TerminalModalProps {
  onClose?: () => void
}

export function TerminalModal({ onClose }: TerminalModalProps) {
  const [history, setHistory] = useState<CommandOutput[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isTyping, setIsTyping] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 800, height: 400 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const processor = useRef(new CommandProcessor())

  useEffect(() => {
    const welcomeOutput: CommandOutput = {
      command: "",
      output: [
        "Welcome to Noah Jenkins Interactive Resume Terminal",
        "",
        "Type 'help' to see available commands.",
        "Use UP/DOWN arrows to navigate command history.",
        "Press Escape or Ctrl/Cmd+` to close terminal.",
        "",
      ],
      timestamp: new Date()
    }
    setHistory([welcomeOutput])
  }, [])

  useEffect(() => {
    if (inputRef.current && !isTyping) {
      inputRef.current.focus()
    }
  }, [isTyping])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history, isTyping])

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      } else if (isResizing) {
        const newWidth = Math.max(300, e.clientX - position.x - resizeOffset.x)
        const newHeight = Math.max(200, e.clientY - position.y - resizeOffset.y)
        setSize({
          width: newWidth,
          height: newHeight
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, resizeOffset, position])

  const handleCommand = (input: string) => {
    if (input.trim() === "") return

    const output = processor.current.processCommand(input)
    
    if (output.output.includes("CLEAR_TERMINAL")) {
      setHistory([])
      setIsTyping(false)
      return
    }

    setHistory(prev => [...prev, output])
    
    setCommandHistory(prev => [...prev, input])
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isTyping) return

    if (e.key === "Enter") {
      e.preventDefault()
      if (currentInput.trim()) {
        setIsTyping(true)
        handleCommand(currentInput)
        setCurrentInput("")
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentInput("")
        } else {
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex])
        }
      }
    }
  }

  const handleTypingComplete = () => {
    setIsTyping(false)
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    setIsDragging(true)
  }

  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setResizeOffset({
      x: e.clientX - position.x - size.width,
      y: e.clientY - position.y - size.height
    })
    setIsResizing(true)
  }

  const handleClose = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    onClose?.()
  }

  return (
    <div 
      className="bg-black border-2 border-[#00ff00] rounded-lg shadow-2xl shadow-[#00ff00]/20 overflow-hidden"
      style={{
        position: 'relative',
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="bg-[#00ff00] text-black px-4 py-2 font-mono text-sm font-bold flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <span>noah@jenkins-terminal:~</span>
        <div className="flex space-x-2">
          <div 
            className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600 transition-colors" 
            onClick={handleClose}
            title="Close terminal"
          ></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>

      <div 
        ref={terminalRef}
        className="bg-black text-[#00ff00] p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-track-black scrollbar-thumb-[#00ff00]"
        style={{ height: `${size.height - 50}px` }}
      >
        {history.map((entry, index) => (
          <div key={index} className="mb-2">
            {entry.command && (
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[#00ff00]">noah@jenkins-terminal:~$</span>
                <span className="text-white">{entry.command}</span>
              </div>
            )}
            <TerminalOutput 
              lines={entry.output} 
              onComplete={index === history.length - 1 ? handleTypingComplete : undefined}
            />
          </div>
        ))}

        {!isTyping && (
          <div className="flex items-center space-x-2">
            <span className="text-[#00ff00]">noah@jenkins-terminal:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent outline-none flex-1 text-white caret-[#00ff00]"
              autoComplete="off"
              spellCheck="false"
            />
            <span className="animate-pulse text-[#00ff00]">█</span>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-[#00ff00] opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeMouseDown}
        style={{
          clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
        }}
      />
    </div>
  )
}