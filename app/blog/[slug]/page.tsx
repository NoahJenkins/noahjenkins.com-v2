import { notFound } from 'next/navigation'
import { CustomMDX } from 'app/components/mdx'
import { getBlogPosts } from 'app/blog/utils'
import { formatDate } from 'app/blog/format-date'
import { baseUrl } from 'app/sitemap'

export async function generateStaticParams() {
  let posts = getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  let post = getBlogPosts().find((post) => post.slug === params.slug)
  if (!post) {
    return
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata
  let ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function Blog({ params }: { params: { slug: string } }) {
  let post = getBlogPosts().find((post) => post.slug === params.slug)

  if (!post) {
    notFound()
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'Noah Jenkins',
            },
          }),
        }}
      />
      
      {/* Header Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #fecb3e 1px, transparent 0)`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-6">
            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
              <span className="flex items-center space-x-1">
                <span>📅</span>
                <span>{formatDate(post.metadata.publishedAt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{calculateReadTime(post.content)} min read</span>
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
              {post.metadata.title}
            </h1>
            
            {post.metadata.summary && (
              <p className="text-xl text-gray-300 leading-relaxed max-w-3xl">
                {post.metadata.summary}
              </p>
            )}
          </div>

          {/* Tags */}
          {post.metadata.tags && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.metadata.tags.map((tag: string) => (
                <span 
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-[#fecb3e]/20 to-[#ffb43f]/20 text-[#fecb3e] text-sm rounded-full border border-[#fecb3e]/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-code:text-[#fecb3e] prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-blockquote:border-l-[#fecb3e] prose-blockquote:text-gray-300 prose-a:text-[#fecb3e] prose-a:no-underline hover:prose-a:text-[#ffb43f] max-w-none">
            <CustomMDX source={post.content} />
          </article>
          
          {/* Back to Blog */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <a 
              href="/blog" 
              className="inline-flex items-center space-x-2 text-[#fecb3e] hover:text-[#ffb43f] transition-colors duration-300"
            >
              <span>←</span>
              <span>Back to Blog</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
