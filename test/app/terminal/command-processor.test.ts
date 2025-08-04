import { CommandProcessor } from '../../../app/terminal/components/command-processor'

describe('CommandProcessor', () => {
  let processor: CommandProcessor

  beforeEach(() => {
    processor = new CommandProcessor()
  })

  describe('processCommand', () => {
    it('should return empty output for empty command', () => {
      const result = processor.processCommand('')
      
      expect(result.command).toBe('')
      expect(result.output).toEqual([])
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should return empty output for whitespace-only command', () => {
      const result = processor.processCommand('   ')
      
      expect(result.command).toBe('   ')
      expect(result.output).toEqual([])
    })

    it('should handle unknown commands', () => {
      const result = processor.processCommand('unknown-command')
      
      expect(result.command).toBe('unknown-command')
      expect(result.output).toEqual([
        'Command not found: unknown-command',
        "Type 'help' for available commands."
      ])
    })

    it('should be case insensitive', () => {
      const lowerResult = processor.processCommand('help')
      const upperResult = processor.processCommand('HELP')
      const mixedResult = processor.processCommand('Help')
      
      expect(lowerResult.output).toEqual(upperResult.output)
      expect(lowerResult.output).toEqual(mixedResult.output)
    })

    it('should handle commands with extra spaces', () => {
      const result = processor.processCommand('  help  ')
      
      expect(result.command).toBe('  help  ')
      expect(result.output).toContain('Available commands:')
    })
  })

  describe('help command', () => {
    it('should return list of available commands', () => {
      const result = processor.processCommand('help')
      
      expect(result.output).toContain('Available commands:')
      expect(result.output).toContain('  help           - Show this help message')
      expect(result.output).toContain('  about          - Personal summary')
      expect(result.output).toContain('  clear       - Clear terminal')
      expect(result.output).toContain('  secrets     - Hmmm, what could this be?')
    })
  })

  describe('about command', () => {
    it('should return personal information', () => {
      const result = processor.processCommand('about')
      
      expect(result.output).toContain('Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor')
      expect(result.output).toContain('Always learning, always building, always creating.')
    })
  })

  describe('experience command', () => {
    it('should return work experience', () => {
      const result = processor.processCommand('experience')
      
      expect(result.output).toContain('Professional Experience:')
      expect(result.output).toContain('🏢 Middleby, Cloud Engineer')
      expect(result.output).toContain('🏢 MSI, Cloud Administrator')
    })
  })

  describe('skills command', () => {
    it('should return technical skills', () => {
      const result = processor.processCommand('skills')
      
      expect(result.output).toContain('Technical Skills:')
      expect(result.output).toContain('☁️  Cloud Platforms:')
      expect(result.output).toContain('🔒 Security:')
      expect(result.output).toContain('⚡ Automation:')
    })
  })

  describe('education command', () => {
    it('should return educational background', () => {
      const result = processor.processCommand('education')
      
      expect(result.output).toContain('Education:')
      expect(result.output).toContain('🎓 London App Brewery, Python Developer Bootcamp')
      expect(result.output).toContain('🎓 Tarrant County College, Associate of Arts')
    })
  })

  describe('projects command', () => {
    it('should return notable projects', () => {
      const result = processor.processCommand('projects')
      
      expect(result.output).toContain('Notable Projects:')
      expect(result.output).toContain('🌐 Noah Jenkins Portfolio v2 (Active)')
      expect(result.output).toContain('☕ Coffee Shop Mobile App (Completed)')
    })
  })

  describe('certifications command', () => {
    it('should return certifications and exams', () => {
      const result = processor.processCommand('certifications')
      
      expect(result.output).toContain('Certifications & Exams:')
      expect(result.output).toContain('🎓 Professional Certifications:')
      expect(result.output).toContain('📚 Microsoft Fundamentals:')
    })
  })

  describe('contact command', () => {
    it('should return contact information', () => {
      const result = processor.processCommand('contact')
      
      expect(result.output).toContain('Contact Information:')
      expect(result.output).toContain('📧 Email:     noah@noahjenkins.com')
      expect(result.output).toContain('🔗 LinkedIn:  linkedin.com/in/noah-jenkins/')
    })
  })

  describe('clear command', () => {
    it('should return clear terminal signal', () => {
      const result = processor.processCommand('clear')
      
      expect(result.output).toEqual(['CLEAR_TERMINAL'])
    })
  })

  describe('whoami command', () => {
    it('should return user information', () => {
      const result = processor.processCommand('whoami')
      
      expect(result.output).toContain('noah@jenkins-terminal:~$ whoami')
      expect(result.output).toContain('Noah Jenkins')
      expect(result.output).toContain('Current session: Interactive Resume Terminal')
    })
  })

  describe('ls command', () => {
    it('should list available files', () => {
      const result = processor.processCommand('ls')
      
      expect(result.output).toContain('Available sections:')
      expect(result.output).toContain('about.txt         experience.txt    skills.txt')
      expect(result.output).toContain('Use "cat [filename]" to view contents')
    })
  })

  describe('cat command', () => {
    it('should display file contents for valid files', () => {
      const result = processor.processCommand('cat about.txt')
      
      expect(result.output).toContain('Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor')
    })

    it('should display certifications file contents', () => {
      const result = processor.processCommand('cat certifications.txt')
      
      expect(result.output).toContain('Certifications & Exams:')
      expect(result.output).toContain('🎓 Professional Certifications:')
    })

    it('should handle invalid file names', () => {
      const result = processor.processCommand('cat nonexistent.txt')
      
      expect(result.output).toEqual(['cat: nonexistent.txt: No such file or directory'])
    })

    it('should handle cat command without arguments', () => {
      const result = processor.processCommand('cat')
      
      expect(result.output).toEqual([
        'Command not found: cat',
        "Type 'help' for available commands."
      ])
    })

    it('should handle multiple arguments (using first one)', () => {
      const result = processor.processCommand('cat about.txt extra arguments')
      
      expect(result.output).toContain('Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor')
    })
  })

  describe('Easter egg commands', () => {
    it('should handle r2d2 command', () => {
      const result = processor.processCommand('r2d2')
      
      expect(result.output).toContain('Art by Shanaka Dias')
      expect(result.output).toContain('*BEEP BOOP* R2-D2 reporting for duty!')
      expect(result.output).toContain('May the Force be with you, young padawan.')
    })

    it('should handle darth command', () => {
      const result = processor.processCommand('darth')
      
      expect(result.output).toContain('Art by Shanaka Dias')
      expect(result.output).toContain('The Force is strong with this one...')
      expect(result.output).toContain('I find your lack of faith disturbing.')
    })

    it('should handle moria command', () => {
      const result = processor.processCommand('moria')
      
      expect(result.output).toContain('"You cannot pass! I am a servant of the Secret Fire,')
      expect(result.output).toContain('- Gandalf the Grey')
    })

    it('should handle precious command', () => {
      const result = processor.processCommand('precious')
      
      expect(result.output).toContain('Art by Anil K. Narayanan')
      expect(result.output).toContain('"My precious... my precious..."')
      expect(result.output).toContain('Gollum! Gollum!')
    })

    it('should handle secrets command', () => {
      const result = processor.processCommand('secrets')
      
      expect(result.output).toContain('Hidden ASCII Art Commands:')
      expect(result.output).toContain('  r2d2      - R2-D2 from Star Wars')
      expect(result.output).toContain('  darth     - Darth Vader from Star Wars')
      expect(result.output).toContain('  moria     - Gandalf from Lord of the Rings')
      expect(result.output).toContain('  precious  - Gollum from Lord of the Rings')
    })
  })

  describe('timestamp', () => {
    it('should include timestamp in all responses', () => {
      const before = new Date()
      const result = processor.processCommand('help')
      const after = new Date()
      
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})