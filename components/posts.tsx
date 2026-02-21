"use client"

import Link from 'next/link'
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { formatDate } from 'app/blog/format-date'

interface BlogPost {
  slug: string
  metadata: {
    title: string
    publishedAt: string
    summary?: string
    tags?: string[]
  }
  content: string
}

interface BlogPostsProps {
  posts: BlogPost[]
}

export function BlogPosts({ posts }: BlogPostsProps) {
  let allBlogs = posts

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  return (
    <div className="grid gap-6">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post, index) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group"
          >
            <Link href={`/blog/${post.slug}`}>
              <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-[#fecb3e]/30 transition-all duration-300 hover:bg-black/70">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-[#fecb3e] transition-colors duration-300">
                      {post.metadata.title}
                    </h2>
                    
                    {post.metadata.summary && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">
                        {post.metadata.summary}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(post.metadata.publishedAt, false)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{calculateReadTime(post.content)} min read</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-5 w-5 text-[#fecb3e]" />
                  </div>
                </div>

                {/* Tags if they exist */}
                {post.metadata.tags && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.metadata.tags.map((tag: string) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-gradient-to-r from-[#fecb3e]/20 to-[#ffb43f]/20 text-[#fecb3e] text-xs rounded-full border border-[#fecb3e]/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </motion.article>
        ))}
    </div>
  )
}
