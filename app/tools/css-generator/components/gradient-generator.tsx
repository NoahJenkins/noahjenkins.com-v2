"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Minus, Copy, Download, RotateCcw, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientPreview } from "./gradient-preview"
import { CodeOutput } from "./code-output"

export interface ColorStop {
  id: string
  color: string
  position: number
}

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic'
  angle: number
  colors: ColorStop[]
}

const DEFAULT_GRADIENT: GradientConfig = {
  type: 'linear',
  angle: 90,
  colors: [
    { id: '1', color: '#fecb3e', position: 0 },
    { id: '2', color: '#ffb43f', position: 100 }
  ]
}

const PRESET_GRADIENTS: GradientConfig[] = [
  {
    type: 'linear',
    angle: 45,
    colors: [
      { id: '1', color: '#ff6b6b', position: 0 },
      { id: '2', color: '#4ecdc4', position: 100 }
    ]
  },
  {
    type: 'linear',
    angle: 135,
    colors: [
      { id: '1', color: '#667eea', position: 0 },
      { id: '2', color: '#764ba2', position: 100 }
    ]
  },
  {
    type: 'radial',
    angle: 0,
    colors: [
      { id: '1', color: '#ff9a9e', position: 0 },
      { id: '2', color: '#fecfef', position: 50 },
      { id: '3', color: '#fecfef', position: 100 }
    ]
  },
  {
    type: 'linear',
    angle: 90,
    colors: [
      { id: '1', color: '#a8edea', position: 0 },
      { id: '2', color: '#fed6e3', position: 100 }
    ]
  }
]

export function GradientGenerator() {
  const [gradient, setGradient] = useState<GradientConfig>(DEFAULT_GRADIENT)
  const [activeColorId, setActiveColorId] = useState<string>('1')

  const generateCSS = useCallback((config: GradientConfig) => {
    const colorStops = config.colors
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ')

    switch (config.type) {
      case 'linear':
        return `linear-gradient(${config.angle}deg, ${colorStops})`
      case 'radial':
        return `radial-gradient(circle, ${colorStops})`
      case 'conic':
        return `conic-gradient(from ${config.angle}deg, ${colorStops})`
      default:
        return `linear-gradient(${config.angle}deg, ${colorStops})`
    }
  }, [])

  const addColorStop = () => {
    const newPosition = gradient.colors.length > 0 
      ? Math.min(100, Math.max(...gradient.colors.map(c => c.position)) + 20)
      : 50

    const newColor: ColorStop = {
      id: Date.now().toString(),
      color: '#ffffff',
      position: newPosition
    }

    setGradient(prev => ({
      ...prev,
      colors: [...prev.colors, newColor].sort((a, b) => a.position - b.position)
    }))
    setActiveColorId(newColor.id)
  }

  const removeColorStop = (id: string) => {
    if (gradient.colors.length <= 2) return

    setGradient(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c.id !== id)
    }))

    if (activeColorId === id) {
      setActiveColorId(gradient.colors.find(c => c.id !== id)?.id || '')
    }
  }

  const updateColorStop = (id: string, updates: Partial<ColorStop>) => {
    setGradient(prev => ({
      ...prev,
      colors: prev.colors.map(color => 
        color.id === id ? { ...color, ...updates } : color
      )
    }))
  }

  const updateGradientType = (type: GradientConfig['type']) => {
    setGradient(prev => ({ ...prev, type }))
  }

  const updateAngle = (angle: number) => {
    setGradient(prev => ({ ...prev, angle }))
  }

  const resetGradient = () => {
    setGradient(DEFAULT_GRADIENT)
    setActiveColorId('1')
  }

  const loadPreset = (preset: GradientConfig) => {
    setGradient(preset)
    setActiveColorId(preset.colors[0]?.id || '')
  }

  const activeColor = gradient.colors.find(c => c.id === activeColorId)

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
      {/* Preview Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Preview</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGradient}
              className="hover:text-[#fecb3e]"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
        <GradientPreview gradient={generateCSS(gradient)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Controls Section */}
        <div className="p-6 border-r border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
          
          {/* Gradient Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gradient Type
            </label>
            <div className="flex space-x-2">
              {(['linear', 'radial', 'conic'] as const).map(type => (
                <Button
                  key={type}
                  variant={gradient.type === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateGradientType(type)}
                  className={gradient.type === type ? 
                    "bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] text-black" : 
                    "hover:text-[#fecb3e]"
                  }
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Angle Control */}
          {(gradient.type === 'linear' || gradient.type === 'conic') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Angle: {gradient.angle}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={gradient.angle}
                onChange={(e) => updateAngle(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          )}

          {/* Color Stops */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Color Stops
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addColorStop}
                className="hover:text-[#fecb3e]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {gradient.colors.map((color, index) => (
                <motion.div
                  key={color.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                    activeColorId === color.id
                      ? 'border-[#fecb3e] bg-[#fecb3e]/5'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setActiveColorId(color.id)}
                >
                  <div className="relative">
                    <input
                      type="color"
                      value={color.color}
                      onChange={(e) => updateColorStop(color.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={color.color}
                      onChange={(e) => updateColorStop(color.id, { color: e.target.value })}
                      className="w-full bg-transparent text-white text-sm border-none outline-none"
                      placeholder="#ffffff"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={color.position}
                      onChange={(e) => updateColorStop(color.id, { position: Number(e.target.value) })}
                      className="w-16 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    />
                    <span className="text-gray-400 text-sm">%</span>
                    
                    {gradient.colors.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColorStop(color.id)}
                        className="hover:text-red-400 p-1"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_GRADIENTS.map((preset, index) => (
                <motion.button
                  key={index}
                  onClick={() => loadPreset(preset)}
                  className="h-12 rounded-lg border border-gray-700 hover:border-[#fecb3e]/50 transition-all"
                  style={{ background: generateCSS(preset) }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Code Output Section */}
        <div className="p-6">
          <CodeOutput gradient={generateCSS(gradient)} />
        </div>
      </div>
    </div>
  )
}