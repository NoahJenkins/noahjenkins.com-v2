import sanitizeHtml from 'sanitize-html'

function formatMarkdown(markdown: string): string {
  // Enhanced markdown parser for better GitHub README rendering
  let html = markdown
    // Headers with proper sizing
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#fecb3e] to-[#ffb43f] bg-clip-text text-transparent">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl md:text-2xl font-semibold mb-4 text-white mt-8 first:mt-0">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg md:text-xl font-semibold mb-3 text-white mt-6">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-base md:text-lg font-semibold mb-3 text-white mt-4">$1</h4>')
    
    // Convert HTML p align="left" blocks with multiple badges to flex containers
    .replace(/<p align="left">([\s\S]*?)<\/p>/g, (match, content) => {
      // Check if this p block contains multiple image links (badges)
      const imageCount = (content.match(/<img/g) || []).length
      if (imageCount >= 2) {
        return `<div class="flex flex-wrap gap-2 mb-4">${content}</div>`
      }
      return match // Keep original if not a badge group
    })
    
    // Images (badges, icons, etc.) - make them inline
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="inline h-5 mr-1 mb-1" />')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#fecb3e] hover:text-[#ffb43f] underline">$1</a>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-200 italic">$1</em>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-gray-800 rounded text-[#fecb3e] font-mono text-sm">$1</code>')
    
    // Code blocks
    .replace(/```([\\s\\S]*?)```/g, '<pre class="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-[#fecb3e] font-mono text-sm">$1</code></pre>')

  // Split into lines for processing
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inList = false
  let listItems: string[] = []
  let badgeGroup: string[] = []
  let inFlexContainer = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if we're entering or leaving a flex container
    if (line.includes('<div class="flex flex-wrap gap-2 mb-4">')) {
      inFlexContainer = true
      processedLines.push(line)
      continue
    } else if (line.includes('</div>') && inFlexContainer) {
      inFlexContainer = false
      processedLines.push(line)
      continue
    }
    
    // If we're in a flex container, just pass through the content
    if (inFlexContainer) {
      processedLines.push(line)
      continue
    }
    
    // Check if this line contains only badges/images (GitHub README pattern)
    const isBadgeLine = line.includes('<img') && !line.includes('<h') && 
                       (line.match(/<img/g) || []).length >= 1 &&
                       line.replace(/<img.*?>/g, '').trim().length < 10 // Minimal text besides images
    
    if (isBadgeLine) {
      badgeGroup.push(line)
      continue
    } else if (badgeGroup.length > 0) {
      // Close badge group and render horizontally
      processedLines.push(`<div class="flex flex-wrap gap-2 mb-4">${badgeGroup.join(' ')}</div>`)
      badgeGroup = []
    }
    
    // Handle list items
    if (line.match(/^[\-\*\+] /)) {
      const listContent = line.replace(/^[\-\*\+] /, '')
      listItems.push(`<li class="text-gray-300">${listContent}</li>`)
      inList = true
    } else {
      // Close previous list if we were in one
      if (inList) {
        processedLines.push(`<ul class="flex flex-wrap gap-2 mb-4 list-none">${listItems.join('')}</ul>`)
        listItems = []
        inList = false
      }
      
      // Process regular lines
      if (line === '') {
        processedLines.push('<div class="mb-2"></div>')
      } else if (line.includes('<h') || line.includes('<pre')) {
        processedLines.push(line)
      } else if (!line.includes('<')) {
        processedLines.push(`<p class="text-gray-300 leading-relaxed mb-4">${line}</p>`)
      } else {
        processedLines.push(line)
      }
    }
  }
  
  // Don't forget to close any remaining groups
  if (badgeGroup.length > 0) {
    processedLines.push(`<div class="flex flex-wrap gap-2 mb-4">${badgeGroup.join(' ')}</div>`)
  }
  if (inList) {
    processedLines.push(`<ul class="flex flex-wrap gap-2 mb-4 list-none">${listItems.join('')}</ul>`)
  }

  return processedLines.join('')
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'a', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'br'],
  allowedAttributes: {
    '*': ['class', 'style'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height']
  },
  transformTags: {
    'img': (tagName, attribs) => {
      const newAttribs = { ...attribs };
      let style = newAttribs.style || '';
      
      // Map height attribute to inline style to override global CSS
      if (newAttribs.height && !style.includes('height:')) {
        const h = newAttribs.height.replace('px', ''); // benign strip if exists
        style += `; height: ${h}px`;
        // If height is set but width is missing, force auto width to maintain aspect ratio
        if (!newAttribs.width && !style.includes('width:')) {
          style += '; width: auto';
        }
      }
      
      // Map width attribute to inline style
      if (newAttribs.width && !style.includes('width:')) {
          const w = newAttribs.width.replace('px', '');
          style += `; width: ${w}px`;
      }

      newAttribs.style = style.replace(/^; /, '').trim();
      return { tagName: 'img', attribs: newAttribs };
    }
  }
}

/** Server-only: turns the profile README markdown into sanitized HTML. */
export function renderReadmeHtml(markdown: string): string {
  return sanitizeHtml(formatMarkdown(markdown), sanitizeOptions)
}
