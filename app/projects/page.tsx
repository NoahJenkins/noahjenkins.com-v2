import { ProjectsContent } from './components/projects-content'

// Static generation - this page doesn't change often  
export const dynamic = 'force-static'

export const metadata = {
  title: 'Projects',
  description: 'Portfolio of web development, mobile applications, and cloud infrastructure projects by Noah Jenkins. Showcasing modern technologies and innovative solutions.',
}

export default function ProjectsPage() {
  return <ProjectsContent />
}