"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from "lucide-react"
import WaveSurfer from "wavesurfer.js"
import { Waveform } from "./waveform"
import { Button } from "../../../components/ui/button"

interface AudioPlayerProps {
  title: string
  description: string
  audioUrl: string
  category: string
  duration?: string
}

export function AudioPlayer({ 
  title, 
  description, 
  audioUrl, 
  category, 
  duration 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [playbackRate, setPlaybackRate] = useState(1)
  const wavesurferRef = useRef<WaveSurfer | null>(null)

  const handleWaveformReady = (wavesurfer: WaveSurfer) => {
    wavesurferRef.current = wavesurfer
    setTotalDuration(wavesurfer.getDuration())
    wavesurfer.setVolume(volume)

    // Update current time
    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time)
    })

    wavesurfer.on('finish', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })
  }

  const handlePlay = () => {
    console.log('Audio player received play event')
    setIsPlaying(true)
  }

  const handlePause = () => {
    console.log('Audio player received pause event')
    setIsPlaying(false)
  }

  const togglePlayPause = async () => {
    if (wavesurferRef.current) {
      console.log('Toggle play/pause, currently playing:', isPlaying)
      console.log('Wavesurfer instance:', wavesurferRef.current)
      try {
        if (isPlaying) {
          wavesurferRef.current.pause()
        } else {
          console.log('Starting playback...')
          // Use await for play() to handle promise properly
          await wavesurferRef.current.play()
        }
      } catch (error) {
        console.error('Error playing audio:', error)
        // Reset loading state if play fails
        setIsPlaying(false)
      }
    } else {
      console.log('Wavesurfer not ready')
    }
  }

  const skipBackward = () => {
    if (wavesurferRef.current) {
      const currentTime = wavesurferRef.current.getCurrentTime()
      wavesurferRef.current.seekTo(Math.max(0, currentTime - 10) / totalDuration)
    }
  }

  const skipForward = () => {
    if (wavesurferRef.current) {
      const currentTime = wavesurferRef.current.getCurrentTime()
      wavesurferRef.current.seekTo(Math.min(totalDuration, currentTime + 10) / totalDuration)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(speed)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title.replace(/\\s+/g, '_')}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-[#fecb3e]/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] text-black text-xs font-semibold rounded-full">
              {category}
            </span>
            {totalDuration > 0 && (
              <span className="text-gray-400 text-sm">{formatTime(totalDuration)}</span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="ml-4 hover:text-[#fecb3e]"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <Waveform
          audioUrl={audioUrl}
          onReady={handleWaveformReady}
          onPlay={handlePlay}
          onPause={handlePause}
          height={100}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Main Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="hover:text-[#fecb3e]"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] hover:from-[#ffb43f] hover:to-[#fecb3e] text-black"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="hover:text-[#fecb3e]"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="text-sm text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col md:flex-row items-end md:items-center space-y-2 md:space-y-0 md:space-x-4">
          {/* Speed Control */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-[#fecb3e] outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}