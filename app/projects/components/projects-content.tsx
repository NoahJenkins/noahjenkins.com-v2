"use client"

import { motion } from "framer-motion"
import { Code, Server, ExternalLink, Github, Globe, Smartphone, Cloud, Mic } from "lucide-react"
import { ScrollReveal } from "@/components/animations/scroll-reveal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  title: string
  description: string
  category: "Web/Mobile Development" | "Cloud/Infrastructure" | "Acting/Voice Work"
  technologies: string[]
  liveUrl?: string
  githubUrl?: string
  featured: boolean
  status: "Active" | "In Development" | "Completed"
}

interface ActingCredit {
  id: string
  roles: string[]
  project: string
  studio: string
  type: "Podcast" | "Film/TV" | "Commercial" | "Animation" | "Trailer" | "Video Game"
  url?: string
}

const projects: Project[] = [
  {
    id: "noahjenkins-com-v2",
    title: "Noah Jenkins Portfolio v2",
    description: "Current portfolio website built with Next.js 13+ featuring dynamic GitHub integration, interactive terminal, voice demos, and a modern responsive design.",
    category: "Web/Mobile Development",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel", "Jest", "Playwright"],
    liveUrl: "https://www.noahjenkins.com",
    githubUrl: "https://github.com/NoahJenkins/noahjenkins.com-v2",
    featured: true,
    status: "Active"
  },
  {
    id: "css-generator",
    title: "CSS Gradient Generator",
    description: "Interactive tool for creating custom CSS gradients with real-time preview, code generation, and modern UI components.",
    category: "Web/Mobile Development",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "CSS"],
    liveUrl: "https://noahjenkins.com/tools/css-generator",
    featured: false,
    status: "Active"
  },
  {
    id: "coffee-shop-app",
    title: "Coffee Shop Mobile App",
    description: "React Native mobile application for a local coffee shop featuring menu browsing, order management, and customer loyalty features.",
    category: "Web/Mobile Development",
    technologies: ["React Native", "TypeScript", "Expo"],
    githubUrl: "https://github.com/NoahJenkins/coffee-expo-app",
    featured: true,
    status: "Completed"
  },
  {
    id: "coffee-shop-website",
    title: "Coffee Shop Website",
    description: "Modern coffee shop website built with Next.js featuring responsive design, menu showcase, and optimized performance. Deployed with Vercel for fast global delivery.",
    category: "Web/Mobile Development",
    technologies: ["Next.js", "React", "CSS", "Vercel"],
    liveUrl: "https://coffee-shop-next-js-site.vercel.app",
    githubUrl: "https://github.com/NoahJenkins/Coffee-Shop-Next-JS-Site",
    featured: true,
    status: "Completed"
  },
  {
    id: "noahjenkins-com-v1",
    title: "Noah Jenkins Portfolio v1",
    description: "First version of my personal portfolio website showcasing early web development skills and design approach.",
    category: "Web/Mobile Development",
    technologies: ["HTML", "CSS", "JavaScript", "Bootstrap", "GitHub Actions", "Jest"],
    liveUrl: "https://noahjenkins.github.io/noahjenkins.com-v1/",
    githubUrl: "https://github.com/NoahJenkins/noahjenkins.com-v1",
    featured: false,
    status: "Completed"
  },
  {
    id: "mutts-n-such",
    title: "Mutts N Such",
    description: "My first professional website for a local animal rescue, built using Wix platform with custom CSS styling. Features service showcases, contact information, and business branding.",
    category: "Web/Mobile Development",
    technologies: ["Wix", "Custom CSS", "Web Design"],
    liveUrl: "https://www.muttsnsuch.com",
    featured: true,
    status: "Completed"
  },
  {
    id: "homelab-infrastructure",
    title: "Homelab Infrastructure",
    description: "Complete homelab setup with containerized services, monitoring, backup solutions, and infrastructure as code using modern DevOps practices.",
    category: "Cloud/Infrastructure",
    technologies: ["Docker", "Terraform", "Proxmox", "AWS", "Linux"],
    githubUrl: "https://github.com/NoahJenkins/Home-Lab-Projects",
    featured: true,
    status: "Active"
  }
]

const actingCredits: ActingCredit[] = [
  {
    id: "cross-cutting-concerns",
    roles: ["Narrator"],
    project: "Podcast 122 - Everybody's Free to Write Unit Tests",
    studio: "Cross Cutting Concerns",
    type: "Podcast",
    url: "https://open.spotify.com/episode/13E7xbTnoXgWpKtZtXdNso?si=mc8S2QSDRfOS3dmOc4rVoA"
  },
  {
    id: "hot-hot-hot-trailer",
    roles: ["Narrator"],
    project: "Hot Hot Hot (Trailer)",
    studio: "Space Indie Studios",
    type: "Trailer",
    url: "https://youtu.be/dU_6qfiDft4?t=1076"
  },
  {
    id: "the-chosen",
    roles: ["Roman Soldier", "Roman Citizen", "Jewish Citizen"],
    project: "The Chosen",
    studio: "Angel Studios",
    type: "Film/TV"
  },
  {
    id: "ballot-box",
    roles: ["Burger Spokesman"],
    project: "The Ballot Box",
    studio: "Tubi",
    type: "Film/TV",
    url: "https://www.youtube.com/watch?v=X81YvsItrgY"
  },
  {
    id: "panda-dynasty",
    roles: ["Adventurer", "The Pilot"],
    project: "Panda Dynasty",
    studio: "Space Indie Studios",
    type: "Video Game"
  },
  {
    id: "sol705",
    roles: ["Gabriel"],
    project: "SOL705",
    studio: "Space Indie Studios",
    type: "Video Game",
    url: "https://store.steampowered.com/app/1316770/Sol_705/"
  }
]

const ActingCreditCard = ({ credit, index }: { credit: ActingCredit; index: number }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Podcast":
        return "text-purple-400"
      case "Film/TV":
        return "text-red-400"
      case "Commercial":
        return "text-green-400"
      case "Animation":
        return "text-blue-400"
      case "Trailer":
        return "text-yellow-400"
      case "Video Game":
        return "text-cyan-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <ScrollReveal delay={index * 0.1}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center">
              <Mic className="h-6 w-6 text-black" />
            </div>
            <div className="flex items-center space-x-1">
              <div className={`text-xs font-medium ${getTypeColor(credit.type)}`}>
                {credit.type}
              </div>
            </div>
          </div>
          <CardTitle className="text-lg">{credit.project}</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            {credit.studio}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Role{credit.roles.length > 1 ? 's' : ''}</h4>
              <div className="flex flex-wrap gap-2">
                {credit.roles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded-md"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Link if available */}
            {credit.url && (
              <div className="pt-2">
                <Button size="sm" asChild>
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    {credit.type === "Podcast" ? "Listen" : 
                     credit.type === "Video Game" ? "Play" : "Watch"}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  )
}

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const getCategoryIcon = (category: string) => {
    return category === "Web/Mobile Development" ? Code : Cloud
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-400"
      case "In Development":
        return "text-yellow-400"
      case "Completed":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const CategoryIcon = getCategoryIcon(project.category)

  return (
    <ScrollReveal delay={index * 0.1}>
      <Card className={`h-full ${project.featured ? 'ring-2 ring-[#fecb3e]/30' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center">
              <CategoryIcon className="h-6 w-6 text-black" />
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
              <span className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
          <CardTitle className="text-xl">{project.title}</CardTitle>
          <CardDescription className="leading-relaxed">
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Technologies */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="flex space-x-2 pt-2">
              {project.liveUrl && (
                <Button size="sm" asChild>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button variant="secondary" size="sm" asChild>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Github className="mr-2 h-3 w-3" />
                    Code
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  )
}

export function ProjectsContent() {
  const webMobileProjects = projects.filter(p => p.category === "Web/Mobile Development")
  const cloudInfraProjects = projects.filter(p => p.category === "Cloud/Infrastructure")

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #fecb3e 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] p-1">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Code className="h-16 w-16 text-[#fecb3e]" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">
              Projects
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              A showcase of my work across web development, mobile applications, and cloud infrastructure. 
              Each project represents a journey of learning, building, and solving real-world problems.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center space-x-2 text-gray-400">
                <Globe className="h-5 w-5 text-[#fecb3e]" />
                <span>Web & Mobile</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Server className="h-5 w-5 text-[#fecb3e]" />
                <span>Cloud & Infrastructure</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Mic className="h-5 w-5 text-[#fecb3e]" />
                <span>Acting & Voice Work</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Web/Mobile Development Section */}
      <section id="web-mobile" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center mb-12">
              <Smartphone className="h-8 w-8 text-[#fecb3e] mr-4" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Web & Mobile Development
                </h2>
                <p className="text-gray-400 mt-2">
                  Modern web applications and mobile experiences built with cutting-edge technologies
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webMobileProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Cloud/Infrastructure Section */}
      <section id="cloud-infrastructure" className="py-16 px-4 bg-gradient-to-r from-[#fecb3e]/5 to-[#ffb43f]/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center mb-12">
              <Cloud className="h-8 w-8 text-[#fecb3e] mr-4" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Cloud & Infrastructure
                </h2>
                <p className="text-gray-400 mt-2">
                  Scalable cloud solutions and infrastructure automation using DevOps best practices
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cloudInfraProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Acting/Voice Work Section */}
      <section id="acting" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center mb-12">
              <Mic className="h-8 w-8 text-[#fecb3e] mr-4" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Acting & Voice Work
                </h2>
                <p className="text-gray-400 mt-2">
                  Professional acting and voice-over credits across film, television, animation, and digital media
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actingCredits.map((credit, index) => (
              <ActingCreditCard key={credit.id} credit={credit} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <ScrollReveal>
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Have a Project in Mind?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              I'm always excited to take on new challenges and collaborate on innovative projects. 
              Whether you need web development, mobile apps, or cloud infrastructure solutions, let's discuss how we can bring your ideas to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:noah@noahjenkins.com">
                  Start a Conversation
                </a>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <a href="/about">
                  Learn More About Me
                </a>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}