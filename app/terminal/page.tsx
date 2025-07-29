"use client"

import { Terminal } from "./components/terminal"

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Terminal />
      </div>
    </div>
  )
}