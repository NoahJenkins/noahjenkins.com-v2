import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-colors duration-700"
      style={{ fontFamily: 'Geist, Inter, sans-serif', background: 'linear-gradient(to right, #fecb3e, #ffb43f)' }}
    >
      <section className="w-full max-w-2xl text-center animate-fade-in">
        <h1 className="mb-8 text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#47a3f3] via-[#7f5af0] to-[#16161a] dark:from-[#7f5af0] dark:via-[#47a3f3] dark:to-[#16161a]">
          My Portfolio
        </h1>
        <p className="mb-6 text-lg md:text-xl text-neutral-800 dark:text-neutral-200 transition-colors duration-700">
          {`I'm a Vim enthusiast and tab advocate, finding unmatched efficiency in Vim's keystroke commands and tabs' flexibility for personal viewing preferences. This extends to my support for static typing, where its early error detection ensures cleaner code, and my preference for dark mode, which eases long coding sessions by reducing eye strain.`}
        </p>
        <div className="my-8">
          <BlogPosts />
        </div>
      </section>
    </main>
  )
}
