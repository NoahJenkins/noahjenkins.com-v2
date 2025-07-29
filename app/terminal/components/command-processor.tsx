export interface CommandOutput {
  command: string
  output: string[]
  timestamp: Date
}

export class CommandProcessor {
  private commands: Record<string, () => string[]> = {
    help: this.help.bind(this),
    about: this.about.bind(this),
    experience: this.experience.bind(this),
    skills: this.skills.bind(this),
    education: this.education.bind(this),
    projects: this.projects.bind(this),
    contact: this.contact.bind(this),
    clear: this.clear.bind(this),
    whoami: this.whoami.bind(this),
    ls: this.ls.bind(this),
  }

  processCommand(input: string): CommandOutput {
    const [command, ...args] = input.trim().toLowerCase().split(' ')
    
    if (command === '') {
      return {
        command: input,
        output: [],
        timestamp: new Date()
      }
    }

    if (command === 'cat' && args.length > 0) {
      return {
        command: input,
        output: this.catFile(args[0]),
        timestamp: new Date()
      }
    }

    if (this.commands[command]) {
      return {
        command: input,
        output: this.commands[command](),
        timestamp: new Date()
      }
    }

    return {
      command: input,
      output: [`Command not found: ${command}`, `Type 'help' for available commands.`],
      timestamp: new Date()
    }
  }

  private help(): string[] {
    return [
      'Available commands:',
      '',
      '  help        - Show this help message',
      '  about       - Personal summary',
      '  experience  - Work history',
      '  skills      - Technical skills',
      '  education   - Educational background',
      '  projects    - Notable projects',
      '  contact     - Contact information',
      '  whoami      - Current user info',
      '  ls          - List available sections',
      '  cat [file]  - Display file contents',
      '  clear       - Clear terminal',
      '',
      'Navigate with UP/DOWN arrow keys for command history.',
    ]
  }

  private about(): string[] {
    return [
      'Noah Jenkins - Cloud Engineer, Web Developer & Voice Actor',
      '',
      'Passionate about building scalable cloud solutions, crafting elegant',
      'web experiences, and bringing stories to life through voice.',
      '',
      'With a unique blend of technical expertise and creative expression,',
      'I bridge the gap between complex infrastructure and user-friendly',
      'applications while exploring the art of voice acting.',
      '',
      'Always learning, always building, always creating.',
    ]
  }

  private experience(): string[] {
    return [
      'Professional Experience:',
      '',
      '──────────────────────────────────────────────────────────',
      '🏢 Senior Cloud Engineer | TechCorp Inc.',
      '   📅 2022 - Present',
      '   🔧 AWS, Kubernetes, Terraform, Docker',
      '   • Architected scalable microservices infrastructure',
      '   • Reduced deployment time by 60% with CI/CD optimization',
      '   • Led cloud migration for 15+ legacy applications',
      '',
      '🏢 Full Stack Developer | StartupXYZ',
      '   📅 2020 - 2022',
      '   🔧 React, Node.js, PostgreSQL, Redis',
      '   • Built real-time collaboration platform from scratch',
      '   • Implemented OAuth and payment processing systems',
      '   • Mentored junior developers and led code reviews',
      '',
      '🏢 DevOps Engineer | CloudFirst Solutions',
      '   📅 2019 - 2020',
      '   🔧 Jenkins, Ansible, AWS, Linux',
      '   • Automated infrastructure provisioning and monitoring',
      '   • Improved system reliability to 99.9% uptime',
      '   • Created comprehensive documentation and runbooks',
    ]
  }

  private skills(): string[] {
    return [
      'Technical Skills:',
      '',
      '☁️  Cloud Platforms:',
      '    AWS (EC2, S3, Lambda, RDS, CloudFormation)',
      '    Google Cloud Platform, Azure',
      '',
      '🛠️  DevOps & Infrastructure:',
      '    Kubernetes, Docker, Terraform, Ansible',
      '    Jenkins, GitHub Actions, ArgoCD',
      '    Prometheus, Grafana, ELK Stack',
      '',
      '💻 Programming Languages:',
      '    JavaScript/TypeScript, Python, Go, Bash',
      '    SQL, YAML, JSON, HCL',
      '',
      '🌐 Web Development:',
      '    React, Next.js, Node.js, Express',
      '    PostgreSQL, Redis, MongoDB',
      '    REST APIs, GraphQL, WebSockets',
      '',
      '🎙️  Voice Acting:',
      '    Commercial narration, Audiobook recording',
      '    Character voices, E-learning content',
      '    Professional home studio setup',
      '',
      '📚 Certifications:',
      '    AWS Solutions Architect Professional',
      '    Certified Kubernetes Administrator (CKA)',
      '    Google Cloud Professional Cloud Architect',
    ]
  }

  private education(): string[] {
    return [
      'Education:',
      '',
      '🎓 Bachelor of Science in Computer Science',
      '   University of Technology',
      '   📅 2015 - 2019',
      '   🏆 Magna Cum Laude, Dean\'s List',
      '',
      '📜 Relevant Coursework:',
      '   • Distributed Systems & Cloud Computing',
      '   • Software Engineering & Architecture',
      '   • Database Design & Management',
      '   • Network Security & Cryptography',
      '',
      '🎭 Voice Acting Training:',
      '   Voice Over Academy - Professional Certification',
      '   📅 2020 - 2021',
      '   • Commercial & Narration Techniques',
      '   • Audio Production & Studio Setup',
      '   • Character Development & Script Analysis',
    ]
  }

  private projects(): string[] {
    return [
      'Notable Projects:',
      '',
      '🚀 CloudDeploy - Kubernetes Deployment Platform',
      '   GitOps-based deployment system with 200+ active users',
      '   Tech: Go, Kubernetes, React, PostgreSQL',
      '   github.com/noahjenkins/clouddeploy',
      '',
      '🎵 AudioStream - Real-time Audio Processing',
      '   WebRTC-based audio streaming with voice effects',
      '   Tech: Node.js, WebRTC, Web Audio API, Docker',
      '   github.com/noahjenkins/audiostream',
      '',
      '📊 InfraMonitor - Infrastructure Monitoring Dashboard',
      '   Custom monitoring solution for hybrid cloud environments',
      '   Tech: Python, Prometheus, Grafana, AWS',
      '   github.com/noahjenkins/inframonitor',
      '',
      '🎙️  VoicePortfolio - Professional Demo Showcase',
      '   Interactive portfolio with waveform visualization',
      '   Tech: Next.js, WaveSurfer.js, Vercel',
      '   noahjenkins.com/voices',
      '',
      '🛠️  DevTools Collection - Development Utilities',
      '   CSS generators, color palette tools, and more',
      '   Tech: React, TypeScript, Tailwind CSS',
      '   noahjenkins.com/tools',
    ]
  }

  private contact(): string[] {
    return [
      'Contact Information:',
      '',
      '📧 Email:     noah.jenkins@example.com',
      '🔗 LinkedIn:  linkedin.com/in/noahjenkins',
      '🐙 GitHub:    github.com/noahjenkins',
      '🌐 Website:   noahjenkins.com',
      '🎙️  Voice:     noah.jenkins.voice@example.com',
      '',
      '📍 Location:  San Francisco, CA',
      '🕐 Timezone:  PST (UTC-8)',
      '',
      'Available for:',
      '• Cloud Architecture Consulting',
      '• Full-Stack Development Projects',
      '• Voice-Over Work & Narration',
      '• Technical Writing & Documentation',
      '',
      'Feel free to reach out for collaboration opportunities!',
    ]
  }

  private clear(): string[] {
    return ['CLEAR_TERMINAL']
  }

  private whoami(): string[] {
    return [
      'noah@jenkins-terminal:~$ whoami',
      'Noah Jenkins',
      '',
      'Current session: Interactive Resume Terminal',
      'Shell: /bin/zsh',
      'OS: macOS Sonoma',
      'Terminal: iTerm2 with custom theme',
    ]
  }

  private ls(): string[] {
    return [
      'Available sections:',
      '',
      'about.txt      experience.txt    skills.txt',
      'education.txt  projects.txt      contact.txt',
      '',
      'Use "cat [filename]" to view contents',
      'Example: cat about.txt',
    ]
  }

  private catFile(filename: string): string[] {
    const files: Record<string, () => string[]> = {
      'about.txt': this.about.bind(this),
      'experience.txt': this.experience.bind(this),
      'skills.txt': this.skills.bind(this),
      'education.txt': this.education.bind(this),
      'projects.txt': this.projects.bind(this),
      'contact.txt': this.contact.bind(this),
    }

    if (files[filename]) {
      return files[filename]()
    }

    return [`cat: ${filename}: No such file or directory`]
  }
}