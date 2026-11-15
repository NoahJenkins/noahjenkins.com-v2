"use client"

import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"

interface WaveformProps {
  audioUrl: string
  /** Called as soon as the instance exists. No audio is fetched until the caller calls `load`. */
  onInit?: (wavesurfer: WaveSurfer) => void
  onReady?: (wavesurfer: WaveSurfer) => void
  onPlay?: () => void
  onPause?: () => void
  height?: number
}

export function Waveform({ 
  audioUrl, 
  onInit,
  onReady, 
  onPlay, 
  onPause, 
  height = 80 
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let isMounted = true
    let wavesurfer: WaveSurfer | null = null

    const initWaveSurfer = async () => {
      try {
        if (!containerRef.current || !isMounted) return

        // preload="none" and no src: nothing is downloaded until the first play
        // calls wavesurfer.load(audioUrl).
        const media = new Audio()
        media.preload = 'none'

        wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          media,
          waveColor: '#fecb3e',
          progressColor: '#ffb43f',
          barWidth: 2,
          barGap: 1,
          barRadius: 1,
          normalize: true,
          height: height,
          cursorColor: '#ffffff',
          cursorWidth: 2,
        })

        if (!isMounted) {
          wavesurfer.destroy()
          return
        }

        wavesurferRef.current = wavesurfer
        onInit?.(wavesurfer)

        // Event listeners
        wavesurfer.on('load', () => {
          if (isMounted) {
            setIsLoading(true)
            setHasError(false)
          }
        })

        wavesurfer.on('ready', () => {
          if (isMounted) {
            setIsLoading(false)
            setHasError(false)
            onReady?.(wavesurfer!)
          }
        })

        wavesurfer.on('play', () => {
          if (isMounted) {
            onPlay?.()
          }
        })

        wavesurfer.on('pause', () => {
          if (isMounted) {
            onPause?.()
          }
        })

        wavesurfer.on('error', (error) => {
          console.error('Waveform error:', error)
          if (isMounted && !error.message.includes('AbortError')) {
            setIsLoading(false)
            setHasError(true)
          }
        })

      } catch (error) {
        console.error('Failed to initialize wavesurfer:', error)
        if (isMounted) {
          setIsLoading(false)
          setHasError(true)
        }
      }
    }

    initWaveSurfer()

    return () => {
      isMounted = false
      if (wavesurfer) {
        try {
          wavesurfer.destroy()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      wavesurferRef.current = null
    }
  }, [audioUrl, height]) // Removed callback dependencies to prevent re-renders

  return (
    <div className="relative">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
          <div className="w-6 h-6 border-2 border-[#fecb3e] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
          <div className="text-center text-gray-400">
            <p className="text-sm">Unable to load audio</p>
            <p className="text-xs mt-1">Please check your connection</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="rounded-lg overflow-hidden bg-black/30 border border-gray-700"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}