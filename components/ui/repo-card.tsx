"use client"

import { motion } from "framer-motion"
import { Star, GitFork, ExternalLink } from "lucide-react"
import { GitHubRepo } from "../../lib/github-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface RepoCardProps {
  repo: GitHubRepo
  index: number
}

export function RepoCard({ repo, index }: RepoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Go': '#00ADD8',
      'Java': '#b07219',
      'Shell': '#89e051',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'PHP': '#4F5D95'
    }
    return colors[language] || '#8b949e'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full group hover:scale-[1.02] transition-transform duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-[#fecb3e] transition-colors">
                {repo.name}
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {repo.description || 'No description available'}
              </CardDescription>
            </div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-gray-400 hover:text-[#fecb3e]" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              {repo.language && (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  <span>{repo.language}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{repo.stargazers_count}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitFork className="h-3 w-3" />
                <span>{repo.forks_count}</span>
              </div>
            </div>
            <span className="text-xs">
              Updated {formatDate(repo.updated_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}