"use client"

import { motion } from "framer-motion"
import { GitFork, Star, Users, Folder, Code } from "lucide-react"
import { GitHubStats } from "../../lib/github-api"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface GitHubStatsProps {
  stats: GitHubStats
}

export function GitHubStatsComponent({ stats }: GitHubStatsProps) {
  const statItems = [
    { icon: Folder, label: "Repositories", value: stats.publicRepos },
    { icon: Star, label: "Total Stars", value: stats.totalStars },
    { icon: GitFork, label: "Total Forks", value: stats.totalForks },
    { icon: Users, label: "Followers", value: stats.followers },
  ]

  const topLanguages = Object.entries(stats.languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="text-center">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] flex items-center justify-center mb-2">
                <item.icon className="h-4 w-4 text-black" />
              </div>
              <CardTitle className="text-lg">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-400">{item.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      
      {/* Languages Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="md:col-span-2 lg:col-span-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Top Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topLanguages.map(([language, count]) => (
                <div
                  key={language}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-[#fecb3e]/20 to-[#ffb43f]/20 border border-[#fecb3e]/30 text-sm"
                >
                  {language} ({count})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}