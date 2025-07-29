import { BlogHero } from './components/blog-hero'
import { BlogPosts } from 'app/components/posts'
import { getBlogPosts } from './utils'

export const metadata = {
  title: 'Blog',
  description: 'Thoughts on technology, development, and life. Sharing insights from my journey as a cloud engineer, web developer, and voice actor.',
}

export default function Page() {
  const posts = getBlogPosts()
  return (
    <div className="min-h-screen bg-black text-white">
      <BlogHero />
      
      {/* Blog Posts Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Latest Posts
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Explore articles covering web development, cloud engineering, 
              best practices, and personal insights from the tech industry.
            </p>
          </div>

          <BlogPosts posts={posts} />
        </div>
      </section>
    </div>
  )
}
