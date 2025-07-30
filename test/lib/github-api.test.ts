import { getGitHubReadme, getGitHubStats, getFeaturedRepos, GitHubStats, GitHubRepo } from '../../lib/github-api'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('github-api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getGitHubReadme', () => {
    it('should fetch README successfully', async () => {
      const mockReadme = '# Test README\nThis is a test'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockReadme)
      } as any)

      const result = await getGitHubReadme('testuser')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testuser/testuser/readme',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'NextJS-App'
          })
        })
      )
      expect(result).toBe(mockReadme)
    })

    it('should return fallback content when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as any)

      const result = await getGitHubReadme('testuser')
      
      expect(result).toContain('Hi there! 👋')
      expect(result).toContain("I'm Noah Jenkins")
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getGitHubReadme('testuser')
      
      expect(result).toContain('About Noah Jenkins')
      expect(result).toContain('Thanks for visiting my portfolio!')
    })

    it('should use default username when none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('README content')
      } as any)

      await getGitHubReadme()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/noahjenkins/noahjenkins/readme',
        expect.any(Object)
      )
    })
  })

  describe('getGitHubStats', () => {
    const mockUser = {
      public_repos: 25,
      followers: 100,
      following: 50
    }

    const mockRepos: GitHubRepo[] = [
      {
        name: 'repo1',
        description: 'Test repo 1',
        html_url: 'https://github.com/test/repo1',
        stargazers_count: 10,
        forks_count: 5,
        language: 'JavaScript',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        name: 'repo2',
        description: 'Test repo 2',
        html_url: 'https://github.com/test/repo2',
        stargazers_count: 15,
        forks_count: 3,
        language: 'TypeScript',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]

    it('should fetch and calculate stats correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockUser)
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockRepos)
        } as any)

      const result = await getGitHubStats('testuser')

      expect(result).toEqual({
        publicRepos: 25,
        followers: 100,
        following: 50,
        totalStars: 25,
        totalForks: 8,
        languages: {
          'JavaScript': 1,
          'TypeScript': 1
        }
      })
    })

    it('should handle user fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as any)

      const result = await getGitHubStats('testuser')

      expect(result).toEqual({
        publicRepos: 25,
        followers: 150,
        following: 75,
        totalStars: 234,
        totalForks: 89,
        languages: expect.any(Object)
      })
    })

    it('should handle repos fetch failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockUser)
        } as any)
        .mockResolvedValueOnce({
          ok: false
        } as any)

      const result = await getGitHubStats('testuser')

      expect(result.publicRepos).toBe(25)
      expect(result.followers).toBe(150)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getGitHubStats('testuser')

      expect(result).toEqual({
        publicRepos: 25,
        followers: 150,
        following: 75,
        totalStars: 234,
        totalForks: 89,
        languages: expect.any(Object)
      })
    })
  })

  describe('getFeaturedRepos', () => {
    const mockRepos: GitHubRepo[] = [
      {
        name: 'awesome-project',
        description: 'An awesome project',
        html_url: 'https://github.com/test/awesome-project',
        stargazers_count: 100,
        forks_count: 25,
        language: 'JavaScript',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        name: 'testuser',
        description: 'Profile repo',
        html_url: 'https://github.com/test/testuser',
        stargazers_count: 5,
        forks_count: 1,
        language: 'Markdown',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]

    it('should fetch featured repos and exclude profile repo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRepos)
      } as any)

      const result = await getFeaturedRepos('testuser')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('awesome-project')
      expect(result[0]).not.toEqual(expect.objectContaining({ name: 'testuser' }))
    })

    it('should handle fetch failure with mock data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as any)

      const result = await getFeaturedRepos('testuser')

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('clouddeploy')
      expect(result[1].name).toBe('audiostream')
      expect(result[2].name).toBe('inframonitor')
    })

    it('should handle network errors with mock data', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getFeaturedRepos('testuser')

      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'clouddeploy' }),
        expect.objectContaining({ name: 'audiostream' }),
        expect.objectContaining({ name: 'inframonitor' })
      ]))
    })
  })
})