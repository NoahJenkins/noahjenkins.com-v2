import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { highlight } from 'sugar-high'
import React from 'react'
import sanitizeHtml from 'sanitize-html'

function Table({ data }: { data: { headers: string[], rows: string[][] } }) {
  let headers = data.headers.map((header, index) => (
    <th key={index} className="px-4 py-3 text-left text-[#fecb3e] font-semibold border-b border-[#fecb3e]/30">
      {header}
    </th>
  ))
  let rows = data.rows.map((row, index) => (
    <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
      {row.map((cell, cellIndex) => (
        <td key={cellIndex} className="px-4 py-3 text-gray-300">
          {cell}
        </td>
      ))}
    </tr>
  ))

  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full bg-black/30 border border-gray-800 rounded-lg">
        <thead className="bg-gray-900/50">
          <tr>{headers}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  )
}

function CustomLink(props: any) {
  let href = props.href

  if (href.startsWith('/')) {
    return (
      <Link href={href} {...props} className="text-[#fecb3e] hover:text-[#ffb43f] transition-colors duration-300 underline decoration-[#fecb3e]/50 hover:decoration-[#fecb3e]">
        {props.children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return <a {...props} className="text-[#fecb3e] hover:text-[#ffb43f] transition-colors duration-300" />
  }

  return (
    <a 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
      className="text-[#fecb3e] hover:text-[#ffb43f] transition-colors duration-300 underline decoration-[#fecb3e]/50 hover:decoration-[#fecb3e]"
    />
  )
}

function RoundedImage(props: any) {
  return (
    <div className="my-8">
      <Image 
        alt={props.alt} 
        className="rounded-lg border border-gray-800 shadow-xl" 
        {...props} 
      />
    </div>
  )
}

function Code({ children, ...props }: any) {
  let codeHTML = highlight(children)
  // Sanitize to prevent XSS from any malicious content in code blocks
  let sanitizedHTML = sanitizeHtml(codeHTML, {
    allowedTags: ['span'],
    allowedAttributes: { 'span': ['class', 'style'] }
  })
  return (
    <code 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
      className="bg-gray-900 text-[#fecb3e] px-1 py-0.5 rounded text-sm border border-gray-800"
      {...props} 
    />
  )
}

function Pre({ children, ...props }: any) {
  return (
    <pre 
      className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto my-6 text-sm"
      {...props}
    >
      {children}
    </pre>
  )
}

function slugify(str: any) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    let slug = slugify(children)
    const headingClasses = {
      1: 'text-3xl font-bold text-white mt-8 mb-4',
      2: 'text-2xl font-semibold text-white mt-8 mb-4 border-b border-gray-800 pb-2',
      3: 'text-xl font-semibold text-[#fecb3e] mt-6 mb-3',
      4: 'text-lg font-semibold text-white mt-6 mb-3',
      5: 'text-base font-semibold text-white mt-4 mb-2',
      6: 'text-sm font-semibold text-gray-300 mt-4 mb-2'
    }
    
    return React.createElement(
      `h${level}`,
      { 
        id: slug,
        className: headingClasses[level as keyof typeof headingClasses] || headingClasses[1]
      },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor hover:text-[#fecb3e] transition-colors duration-300',
        }),
      ],
      children
    )
  }

  Heading.displayName = `Heading${level}`

  return Heading
}

// Add a custom blockquote component
function CustomBlockquote({ children, ...props }: any) {
  return (
    <blockquote 
      className="border-l-4 border-[#fecb3e] pl-4 my-6 bg-gray-900/30 py-4 rounded-r-lg italic text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  )
}

// Add custom list components
function CustomUL({ children, ...props }: any) {
  return (
    <ul className="list-disc list-inside my-4 space-y-2 text-gray-300" {...props}>
      {children}
    </ul>
  )
}

function CustomOL({ children, ...props }: any) {
  return (
    <ol className="list-decimal list-inside my-4 space-y-2 text-gray-300" {...props}>
      {children}
    </ol>
  )
}

function CustomLI({ children, ...props }: any) {
  return (
    <li className="text-gray-300 leading-relaxed" {...props}>
      {children}
    </li>
  )
}

let components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  blockquote: CustomBlockquote,
  ul: CustomUL,
  ol: CustomOL,
  li: CustomLI,
  Table,
}

export function CustomMDX({ source, ...props }: { source: string; [key: string]: any }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ ...components, ...(props.components || {}) }}
    >
      {source}
    </ReactMarkdown>
  )
}
