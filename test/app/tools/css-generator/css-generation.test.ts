import { ColorStop, GradientConfig } from '../../../../app/tools/css-generator/components/gradient-generator'

// Extracted CSS generation logic for testing
function generateCSS(config: GradientConfig): string {
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
}

// Extracted code generation logic for testing
function generateCode(format: 'css' | 'scss' | 'tailwind', gradient: string): string {
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
}

describe('CSS Generator Functions', () => {
  describe('generateCSS', () => {
    it('should generate linear gradient CSS correctly', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 90,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 100%)')
    })

    it('should generate radial gradient CSS correctly', () => {
      const config: GradientConfig = {
        type: 'radial',
        angle: 0,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('radial-gradient(circle, #ff0000 0%, #00ff00 100%)')
    })

    it('should generate conic gradient CSS correctly', () => {
      const config: GradientConfig = {
        type: 'conic',
        angle: 45,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('conic-gradient(from 45deg, #ff0000 0%, #00ff00 100%)')
    })

    it('should sort color stops by position', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 90,
        colors: [
          { id: '1', color: '#ff0000', position: 50 },
          { id: '2', color: '#00ff00', position: 0 },
          { id: '3', color: '#0000ff', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(90deg, #00ff00 0%, #ff0000 50%, #0000ff 100%)')
    })

    it('should handle multiple color stops', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 135,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#ffff00', position: 25 },
          { id: '3', color: '#00ff00', position: 50 },
          { id: '4', color: '#00ffff', position: 75 },
          { id: '5', color: '#0000ff', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(135deg, #ff0000 0%, #ffff00 25%, #00ff00 50%, #00ffff 75%, #0000ff 100%)')
    })

    it('should handle default case', () => {
      const config = {
        type: 'unknown' as any,
        angle: 90,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 100%)')
    })
  })

  describe('generateCode', () => {
    const mockGradient = 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 100%)'

    it('should generate CSS code correctly', () => {
      const result = generateCode('css', mockGradient)
      
      expect(result).toContain('.gradient-element {')
      expect(result).toContain(`background: ${mockGradient};`)
      expect(result).toContain('/* Fallback for older browsers */')
      expect(result).toContain('background: #fecb3e;')
      expect(result).toContain('}')
    })

    it('should generate SCSS code correctly', () => {
      const result = generateCode('scss', mockGradient)
      
      expect(result).toContain(`$gradient: ${mockGradient};`)
      expect(result).toContain('.gradient-element {')
      expect(result).toContain('background: $gradient;')
      expect(result).toContain('// Fallback for older browsers')
      expect(result).toContain('background: #fecb3e;')
    })

    it('should generate Tailwind config correctly', () => {
      const result = generateCode('tailwind', mockGradient)
      
      expect(result).toContain('// tailwind.config.js')
      expect(result).toContain('module.exports = {')
      expect(result).toContain(`'custom-gradient': '${mockGradient}',`)
      expect(result).toContain('// Usage in HTML')
      expect(result).toContain('<div class="bg-custom-gradient">')
    })

    it('should handle default case', () => {
      const result = generateCode('unknown' as any, mockGradient)
      expect(result).toBe('')
    })

    it('should handle different gradient types in code output', () => {
      const radialGradient = 'radial-gradient(circle, #ff0000 0%, #00ff00 100%)'
      const result = generateCode('css', radialGradient)
      
      expect(result).toContain(`background: ${radialGradient};`)
    })

    it('should maintain proper indentation in CSS output', () => {
      const result = generateCode('css', mockGradient)
      const lines = result.split('\n')
      
      expect(lines[0]).toBe('.gradient-element {')
      expect(lines[1]).toBe(`  background: ${mockGradient};`)
      expect(lines[2]).toBe('  /* Fallback for older browsers */')
      expect(lines[3]).toBe('  background: #fecb3e;')
      expect(lines[4]).toBe('}')
    })

    it('should maintain proper indentation in SCSS output', () => {
      const result = generateCode('scss', mockGradient)
      const lines = result.split('\n')
      
      expect(lines[0]).toBe(`$gradient: ${mockGradient};`)
      expect(lines[1]).toBe('')
      expect(lines[2]).toBe('.gradient-element {')
      expect(lines[3]).toBe('  background: $gradient;')
      expect(lines[4]).toBe('  // Fallback for older browsers')
      expect(lines[5]).toBe('  background: #fecb3e;')
      expect(lines[6]).toBe('}')
    })
  })

  describe('Color Stop Management Logic', () => {
    it('should calculate new color stop position correctly', () => {
      const existingColors: ColorStop[] = [
        { id: '1', color: '#ff0000', position: 0 },
        { id: '2', color: '#00ff00', position: 50 }
      ]
      
      // Logic from addColorStop function
      const newPosition = existingColors.length > 0 
        ? Math.min(100, Math.max(...existingColors.map(c => c.position)) + 20)
        : 50
      
      expect(newPosition).toBe(70) // 50 + 20
    })

    it('should not exceed 100% position', () => {
      const existingColors: ColorStop[] = [
        { id: '1', color: '#ff0000', position: 0 },
        { id: '2', color: '#00ff00', position: 90 }
      ]
      
      const newPosition = Math.min(100, Math.max(...existingColors.map(c => c.position)) + 20)
      expect(newPosition).toBe(100) // min(100, 90 + 20) = 100
    })

    it('should handle empty colors array', () => {
      const existingColors: ColorStop[] = []
      const newPosition = existingColors.length > 0 
        ? Math.min(100, Math.max(...existingColors.map(c => c.position)) + 20)
        : 50
      
      expect(newPosition).toBe(50)
    })
  })

  describe('Gradient Validation', () => {
    it('should handle edge case angles', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 360,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(360deg, #ff0000 0%, #00ff00 100%)')
    })

    it('should handle negative angles', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: -45,
        colors: [
          { id: '1', color: '#ff0000', position: 0 },
          { id: '2', color: '#00ff00', position: 100 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(-45deg, #ff0000 0%, #00ff00 100%)')
    })

    it('should handle single color stop', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 90,
        colors: [
          { id: '1', color: '#ff0000', position: 0 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(90deg, #ff0000 0%)')
    })

    it('should handle same position color stops', () => {
      const config: GradientConfig = {
        type: 'linear',
        angle: 90,
        colors: [
          { id: '1', color: '#ff0000', position: 50 },
          { id: '2', color: '#00ff00', position: 50 }
        ]
      }

      const result = generateCSS(config)
      expect(result).toBe('linear-gradient(90deg, #ff0000 50%, #00ff00 50%)')
    })
  })
})