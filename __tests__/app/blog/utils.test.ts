import fs from 'fs'
import path from 'path'
import { getBlogPosts } from '../../../app/blog/utils'

// Mock fs module
jest.mock('fs')
jest.mock('path')

const mockFs = fs as jest.Mocked<typeof fs>
const mockPath = path as jest.Mocked<typeof path>

describe('blog utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getBlogPosts', () => {
    it('should parse MDX files and return blog posts', () => {
      const mockMdxContent = `---
title: Test Post
publishedAt: 2024-07-30
summary: This is a test post
tags: test, jest
---

# Test Content

This is the content of the test post.`

      // Mock file system calls
      mockFs.readdirSync.mockReturnValue(['test-post.mdx', 'another-post.mdx'] as any)
      mockFs.readFileSync.mockReturnValue(mockMdxContent)
      
      // Mock path calls
      mockPath.extname
        .mockReturnValueOnce('.mdx')
        .mockReturnValueOnce('.mdx')
      mockPath.join
        .mockReturnValueOnce('/test/project/app/blog/posts')
        .mockReturnValueOnce('/test/project/app/blog/posts/test-post.mdx')
        .mockReturnValueOnce('/test/project/app/blog/posts/another-post.mdx')
      mockPath.basename
        .mockReturnValueOnce('test-post')
        .mockReturnValueOnce('another-post')

      const result = getBlogPosts()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        metadata: {
          title: 'Test Post',
          publishedAt: '2024-07-30',
          summary: 'This is a test post',
          tags: ['test', 'jest']
        },
        slug: 'test-post',
        content: '# Test Content\n\nThis is the content of the test post.'
      })
    })

    it('should filter out non-MDX files', () => {
      mockFs.readdirSync.mockReturnValue(['test-post.mdx', 'readme.md', 'config.json'] as any)
      mockPath.extname
        .mockReturnValueOnce('.mdx')
        .mockReturnValueOnce('.md')  
        .mockReturnValueOnce('.json')

      // Only expect calls for .mdx files
      mockFs.readFileSync.mockReturnValue(`---
title: Test
publishedAt: 2024-07-30
summary: Test
---
Content`)
      
      mockPath.join
        .mockReturnValueOnce('/test/project/app/blog/posts')
        .mockReturnValueOnce('/test/project/app/blog/posts/test-post.mdx')
      mockPath.basename.mockReturnValueOnce('test-post')

      const result = getBlogPosts()

      expect(result).toHaveLength(1)
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1)
    })

    it('should handle posts without tags', () => {
      const mockMdxContent = `---
title: No Tags Post
publishedAt: 2024-07-30
summary: Post without tags
---

Content here.`

      mockFs.readdirSync.mockReturnValue(['no-tags.mdx'] as any)
      mockFs.readFileSync.mockReturnValue(mockMdxContent)
      mockPath.extname.mockReturnValue('.mdx')
      mockPath.join
        .mockReturnValueOnce('/test/project/app/blog/posts')
        .mockReturnValueOnce('/test/project/app/blog/posts/no-tags.mdx')
      mockPath.basename.mockReturnValue('no-tags')

      const result = getBlogPosts()

      expect(result[0].metadata).toEqual({
        title: 'No Tags Post',
        publishedAt: '2024-07-30',
        summary: 'Post without tags'
      })
    })

    it('should handle metadata with quotes', () => {
      const mockMdxContent = `---
title: "Quoted Title"
publishedAt: '2024-07-30'
summary: "This has quotes around it"
---

Content.`

      mockFs.readdirSync.mockReturnValue(['quoted.mdx'] as any)
      mockFs.readFileSync.mockReturnValue(mockMdxContent)
      mockPath.extname.mockReturnValue('.mdx')
      mockPath.join
        .mockReturnValueOnce('/test/project/app/blog/posts')
        .mockReturnValueOnce('/test/project/app/blog/posts/quoted.mdx')
      mockPath.basename.mockReturnValue('quoted')

      const result = getBlogPosts()

      expect(result[0].metadata).toEqual({
        title: 'Quoted Title',
        publishedAt: '2024-07-30',
        summary: 'This has quotes around it'
      })
    })

    it('should handle complex tag lists', () => {
      const mockMdxContent = `---
title: Complex Tags
publishedAt: 2024-07-30
summary: Testing complex tags
tags: javascript, react.js, next.js, typescript, testing
---

Content.`

      mockFs.readdirSync.mockReturnValue(['complex-tags.mdx'] as any)
      mockFs.readFileSync.mockReturnValue(mockMdxContent)
      mockPath.extname.mockReturnValue('.mdx')
      mockPath.join
        .mockReturnValueOnce('/test/project/app/blog/posts')
        .mockReturnValueOnce('/test/project/app/blog/posts/complex-tags.mdx')
      mockPath.basename.mockReturnValue('complex-tags')

      const result = getBlogPosts()

      expect(result[0].metadata.tags).toEqual([
        'javascript',
        'react.js', 
        'next.js',
        'typescript',
        'testing'
      ])
    })

    it('should handle empty directory', () => {
      mockFs.readdirSync.mockReturnValue([] as any)
      mockPath.join.mockReturnValue('/test/project/app/blog/posts')

      const result = getBlogPosts()

      expect(result).toEqual([])
    })
  })
})