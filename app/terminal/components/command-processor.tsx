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
    r2d2: this.r2d2.bind(this),
    darth: this.darth.bind(this),
    moria: this.moria.bind(this),
    precious: this.precious.bind(this),
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
      'Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor',
      '',
      'Cloud Administrator and full stack web developer with broad expertise in Azure, resource creation and administration, IAM tooling with app registrations and Entra ID, and automating life cycle management.',
      'Specializes in building applications with React JS and Node JS.',
      '',
      'Always learning, always building, always creating.',
    ]
  }

  private experience(): string[] {
    return [
      'Professional Experience:',
      '',
      '──────────────────────────────────────────────────────────',
      '🏢 Middleby, Cloud Engineer',
      '   📅 Mar 2025 – May 2025',
      '   • Set up and secured app registrations and API permissions for developer solutions',
      '   • Built custom Azure policy to maintain resource compliance (revealed 19% non-compliance)',
      '   • Migrated on-prem workloads to the cloud',
      '',
      '🏢 MSI, Cloud Administrator',
      '   📅 Jan 2025 – May 2025',
      '   • Managed and monitored resources in Azure and AWS for Production, Testing, and Development',
      '   • Automated processes using Azure Logic Apps and PowerShell (removed 20% empty groups)',
      '   • Administered M365 resources including Teams, SharePoint, Power Bi, Fabric, and Power Automate',
      '   • Set up Service Principals with API permissions to connect Azure resources to M365 platforms',
      '   • Developed and maintained internal documentation for infrastructure and security workflows',
      '',
      '🏢 MSI, Security Analyst - IAM Administrator',
      '   📅 Nov 2023 – Jan 2025',
      '   • Leveraged RBAC, ABAC, and Entitlement Management Access in Azure',
      '   • Conducted reviews of user access rights, rectified discrepancies and unauthorized access',
      '   • Automated identity management processes (Entra ID sync with Workday)',
      '   • Set up SSO with Entra ID using SAML and OAuth',
      '   • Set up PIM and Entitlement Management Access for JIT requests',
      '',
      '🏢 MSI, Technical Support Specialist',
      '   📅 May 2022 - Nov 2023',
      '   • Managed users across Azure AD, Microsoft 365 Admin, and Google Workspaces',
      '   • Supported mail solutions in Exchange Online Center and collaborative environments in Teams/SharePoint',
      '   • Managed asset distribution, retrieval, and refurbishment workflows',
      '   • Created internal service desk portal with SharePoint, Power Automate, and Forms',
      '',
      '🏢 Diligent Robotics, Technical Support Specialist - Clinical Robotic Operations',
      '   📅 July 2021 - May 2022',
      '   • Supported Moxi hospital robot, provided maintenance and technical support',
      '   • Worked with clinical staff to update and maintain workflows',
      '   • Created content and courses for LMS to standardize training material',
      '',
      '🏢 Charles Schwab, Technical Help Desk Associate & Identity Theft Team Member',
      '   📅 April 2020 - July 2021',
      '   • Supported clients, troubleshooting device OS and browser settings on iOS, Android, MacOS, Windows, and Linux',
    ]
  }

  private skills(): string[] {
    return [
      'Technical Skills:',
      '',
      '☁️  Cloud Platforms:',
      '    Azure: Azure Active Directory/Entra ID, PIM, RBAC, Intune, Sentinel, Azure Hybrid, KQL',
      '    AWS: EC2, S3, VPC, IAM Admin, CloudWatch',
      '',
      '🔒 Security:',
      '    IAM, Identity Governance, SAML, OAuth, SIEM, Network Security, MDM',
      '',
      '⚡ Automation:',
      '    Terraform, PowerShell, Logic Apps, Power Automate, Jest',
      '',
      '💻 Front End:',
      '    JavaScript, Typescript, React.JS',
      '',
      '🖥️ Back End:',
      '    Python, Node.JS, Express, Next.JS, Postgres, SQL',
      '',
      '📚 Certifications & Exams:',
      '    Azure Administrator (AZ 104), Azure Identity and Access Administrator (SC 300), Terraform Associate (HCTA 003), AWS Cloud Practitioner (AWS CCP)',
      '    Microsoft Fundamentals: Azure (AZ 900), Security and Compliance (SC 900), Data (DP 900), Microsoft 365 (MS 900), Power Platform (PL 900), GitHub Foundations',
      '    Security: CompTIA Sec+, ISC2 CC',
    ]
  }

  private education(): string[] {
    return [
      'Education:',
      '',
      '🎓 London App Brewery, Python Developer Bootcamp',
      '   📅 Aug 2023 – Dec 2023',
      '',
      '🎓 Tarrant County College, Associate of Arts',
      '   📅 Aug 2018 – May 2023',
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
      '📧 Email:     noah@noahjenkins.com',
      '🔗 LinkedIn:  linkedin.com/in/noah-jenkins/',
      '🐙 GitHub:    github.com/NoahJenkins',
      '🌐 Website:   noahjenkins.com',
      '📱 Phone:     817-898-0345',
      '',
      'Available for:',
      '• Cloud Administration & Engineering',
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

  private r2d2(): string[] {
    return [
      'Art by Shanaka Dias',
      '                    .==.',
      '                   ()\'\'()-.',
      '        .---.       ;--; /',
      '      .\'_:___". _..\'  __\'.',
      '      |__ --==|\'-\'\'\' \\...;',
      '      [  ]  :[|       |---\\',
      '      |__| I=[|     .\'    \'.',
      '      / / ____|     :       \'._',
      '     |-/.____.)      | :       :',
      'snd /___\\ /___\\      \'-\'._----\'',
      '',
      '*BEEP BOOP* R2-D2 reporting for duty!',
      'May the Force be with you, young padawan.',
    ]
  }

  private darth(): string[] {
    return [
      'Art by Shanaka Dias',
      '                       .-.',
      '                      |_:_|',
      '                     /(_Y_)\\',
      '.                   ( \\/M\\/ )',
      ' \'.               _.\'-/\'-\'\\-\'._',
      '   \':           _/.--\'[[[[]\'--.\\_',
      '     \':        /_\'  : |::"| :  \'\\',
      '       \':     //   ./ |oUU| \\.\'  :\\',
      '         \':  _:\'..\' \\_|___|_/ :   :|',
      '           \':.  .\'  |_[___]_|  :.\':\\',
      '            [::\ |  :  | |  :   ; : \\',
      '             \'-\'   \\/\'.| |.\' \\  .;.\' |',
      '             |\\_    \\  \'-\'   :       |',
      '             |  \\    \\ .:    :   |   |',
      '             |   \\    | \'.   :    \\  |',
      '             /       \\   :. .;       |',
      '            /     |   |  :__/     :  \\\\',
      '           |  |   |    \\:   | \\   |   ||',
      '          /    \\  : :  |:   /  |__|   /|',
      '      snd |     : : :_/_|  /\'._\\  \'--|_\\',
      '          /___.-/_|-\'   \\  \\',
      '                         \'-\'',
      '',
      'The Force is strong with this one...',
      'I find your lack of faith disturbing.',
      'You underestimate the power of the Dark Side.',
    ]
  }

  private moria(): string[] {
    return [
      '                             .     @$* @$3',
      '                            \'$Nueeed$ed$eeec$',
      '         ,            4$Lze@*$C2$b* ed(he*rb$CC$*$bc@$r',
      '   /@ |~~            .e$"W$B$B$**  ^$  e""##d?$Bd$$Nc. ..      @\\/~\\',
      '   \\==|         4$kd*Cr$6F#"`  **   .*==      # \'"**F#$I$b$*       |   I',
      '      |         d$5N@$"   ....eu$$$N$*$zbeuu     #$d$$b.     / @/',
      '     @/     . z$Ted*"$P zue$*9d$$@#       W$e@B$L.    "#@$E$b@N',
      '           #d$Id*P#  \'Nd$B$**"       .*,     "#*N$b$c   $$*$c',
      '          .d#+C6J   @@$B$*"          -***-        "#$$c   *$$#$u',
      '       ..u$l4@"^"zJ$7W*"              \'*`            ^*$@$$r "$E$@B>',
      '       *@$l$P"+Rd$N#"          *     /|\\     *        \'"$$c.. ?E$*b',
      '       z$ "*  .Jz$"           ***   / | \\   ***         \'*@N$b   d**N',
      '     .z$JBR^bs@$#          *   *   /  |  \\   *  *         "$l*9N "bN$Nee',
      '    4$.C*   dB@"          ***    _/  /^\\  \\_   ***         \'$$z> 3$b$#',
      '     $"$e$  @*$"        *   *     \\\\^|   |^//    *   *        $$u.^*$N$c',
      '    JPd$%  @@d"        ***        ***********       ***       \'$Ni$  $EP$',
      '  :e$"*$  :et$          *         ***********        *         ^$E  4$N$be',
      '  \')$ud"  @6$                                                   9$   $*@$"',
      '   @F*$   *4P                       ./                          \'$m#   .$.',
      'u*""""""""""""h                     ##=====                    e#""""""""""#',
      'E +e       ue. N                 ___##_______                 4F e=c     z*c',
      '#e$@e.. ..z6+6d"                #*************/               ^*cBe$u.  .$@',
      '   $ ^"""" 4F"  ze=eu              ********              z***hc ^"$ ""*"" $',
      '   $       ^F :*    3r                                  @"  e "b  $       $',
      ' .e$        N $  \'be$L...                            ...?be@F  $F $       9F',
      '4" $        $ $.  zm$*****h.                      ue""""*h6   J$" $       4%',
      '$  $        $ $u5e" .     "k                    d"       #$bu$F  $       4F',
      '"N $        $ ^d%P  dF      $  .            .e   $     -c  "N$F  .$       4F',
      ' #$        $  $4*. "N.    zP  3r ..    ..  $c   *u     $  u$K$  4F       4L',
      '  ^N$e.     3  F$k*. "*C$$# .z$" \'$    4L  "$c. \'#$eeedF  $$9r JF       J$',
      '   "$eu. 4  F3"K$ .e=*CB$$L .e$    \'$bc.u$***hd6C""  4kF$4F $F     u@$F',
      '   $   \'"*$*@u N\'L$B*"z*""     "$F" 4k 4c \'7$"      "*$eu 4\'L$J" $   .e$*"4F',
      '   $      \'"hC*$ "$#.P"          $me$"  #$*$       .  ^*INJL$"$  $e$*#   4F',
      '   $         $b"h ".F     $"     ^F        $       9r   #L#$FJEd#C@"      4L',
      '  .$         $Jb   J"..  4b      uF        *k      J%    #c^ $" d$        4L',
      ' :"$         $k9   $ $%4c $Bme.ze$         \'*$+eee@*$"  :r$    @L$        4$',
      ' $ $         $Jr  $d" \'$r "*==*"            "#**"" $r  4$3r  db$F        4F',
      ' $c$         *F  $"   \'$            /\\            $    *(L  $$F         k',
      ' #i*e.       $ 4>  $  ue $         \\`.||.\'         \'L c  $ .L$d         .$',
      '  "b."*e.    4 4   $  $%db=eL     `.<\\||/>.\'.      e*+$/$r  $ \'$"$       .d$',
      '   $^#+cC*mu 4r4   4r:6@F  $    -----++-----    <$. "N?N  F  $ $    ud$* $',
      '   $    "*eJ"@L4   4k*3Ic.*"      .\'\`.      #*5.J$..F  $ $ ue#2*"   $',
      '   $       "N."@r  4Fd" \'$r        /.\'||`.\\        4$ \'"N*d"  4Pu@"        $',
      '   $         "e^"  \'d" uz$%           \\/           \'$czr"k#"  4Pu@"        $',
      '',
      '"You cannot pass! I am a servant of the Secret Fire,',
      'wielder of the flame of Anor. The dark fire will not',
      'avail you, flame of Udûn. Go back to the Shadow!"',
      '- Gandalf the Grey',
    ]
  }


  private precious(): string[] {
    return [
      'Art by Anil K. Narayanan',
      '                                  ,----.__                         |',
      '                                ,\'        `.                       |',
      '                            _  /            :                      ,-.',
      '                           |.`:              :                    /  -',
      '            ,\'\'\'\'\'-.\_      | )               :                 _.\'  --',
      '           /         \'.  _.`.   (88o    _    |_           _.-\'\'      -',
      '           |           `/    |   """   9@8o  / )-..__._.-\'      ,/\'`-/',
      '           ]     \\    ,:     `.         ""  :_/              ,-\'  |',
      '            :     \\-_/        `. `a,    ,   :              ,\'    /',
      '             `.    Y\'       ,_  \\ "7888"  ,\'   _.--\'\'\'\'---\')     |',
      '               \\ .\'      _/\'  `._\\      ,\'---.<...        /     |',
      '               .\'      ,\' \'-.._   \':._,::...,\'   /\'     ,\'      /',
      '              /\'     ,/        \'`\'\'\'\'           /     ,\'       /',
      '             ,\'    /  :                        /    ,\'       ,-\'\'\'\'._',
      '             |    ()   :                      |    |      .-\'        \'',
      '             `.   :     ) __............____ .\'    |_ .--\'',
      '              `.   `.  ,\'                   `/       `\'-.__',
      '      _,....--\'>    : /                     |   __...-._   `\\',
      '   ,-\'       .\' |   `.                      "--\'        ` ._/\'--._',
      ' ,\'        /\'    |   `.                                           \'akn',
      '/         (.,   /|     :                                            \\.',
      '             `\'\' :     :\\',
      '                 )     :.:',
      '                 : ; . ; \'',
      '                 \'_: . \'',
      '                   \'_:\'',
      '',
      '"My precious... my precious..."',
      'We wants it, we needs it. Must have the precious!',
      'They stole it from us. Sneaky little hobbitses.',
      'Gollum! Gollum!',
    ]
  }
}