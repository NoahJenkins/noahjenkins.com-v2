export interface GitHubRepo {
  name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
}

export interface GitHubStats {
  publicRepos: number
  followers: number
  following: number
  totalStars: number
  totalForks: number
  languages: { [key: string]: number }
}

export async function getGitHubReadme(username: string = 'noahjenkins') {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${username}/${username}/readme`,
      { 
        headers: { 
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'NextJS-App'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );
    
    if (!response.ok) {
      // Fallback content if README doesn't exist
      return `# Hi there! 👋

I'm Noah Jenkins, a passionate Cloud Engineer, Web Developer, and Voice Actor.

## About Me

I love building scalable cloud solutions, crafting elegant web experiences, and bringing stories to life through voice. With a unique blend of technical expertise and creative expression, I bridge the gap between complex infrastructure and user-friendly applications.

## What I Do

- 🏗️ **Cloud Engineering**: Architecting scalable infrastructure on AWS, GCP, and Azure
- 💻 **Web Development**: Building modern applications with React, Next.js, and Node.js
- 🎙️ **Voice Acting**: Creating compelling narratives for commercials, audiobooks, and more
- 📝 **Technical Writing**: Documenting complex systems and best practices

## Current Focus

- Learning new cloud technologies and DevOps practices
- Contributing to open source projects
- Exploring the intersection of AI and creative industries
- Building tools that make developers' lives easier

## Let's Connect!

Always excited to collaborate on innovative projects. Feel free to reach out!`
    }
    
    return response.text()
  } catch (error) {
    console.error('Failed to fetch GitHub README:', error)
    return `# About Noah Jenkins

Thanks for visiting my portfolio! I'm currently updating this section with content from my GitHub profile.

In the meantime, feel free to explore my work and get in touch if you'd like to collaborate!`
  }
}

export async function getGitHubStats(username: string = 'noahjenkins'): Promise<GitHubStats> {
  try {
    // Get user info
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'NextJS-App' },
      next: { revalidate: 3600 }
    })
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data')
    }
    
    const userData = await userResponse.json()
    
    // Get repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { 'User-Agent': 'NextJS-App' },
      next: { revalidate: 3600 }
    })
    
    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories')
    }
    
    const repos: GitHubRepo[] = await reposResponse.json()
    
    // Calculate stats
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)
    
    const languages: { [key: string]: number } = {}
    repos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1
      }
    })
    
    return {
      publicRepos: userData.public_repos || repos.length,
      followers: userData.followers || 0,
      following: userData.following || 0,
      totalStars,
      totalForks,
      languages
    }
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error)
    // Return mock data as fallback
    return {
      publicRepos: 25,
      followers: 150,
      following: 75,
      totalStars: 234,
      totalForks: 89,
      languages: {
        'JavaScript': 12,
        'TypeScript': 8,
        'Python': 5,
        'Go': 3,
        'Shell': 2
      }
    }
  }
}

export async function getFeaturedRepos(username: string = 'noahjenkins'): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`, {
      headers: { 'User-Agent': 'NextJS-App' },
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories')
    }
    
    const repos: GitHubRepo[] = await response.json()
    return repos.filter(repo => !repo.name.includes(username)) // Exclude profile repo
  } catch (error) {
    console.error('Failed to fetch featured repos:', error)
    // Return mock data as fallback
    return [
      {
        name: 'clouddeploy',
        description: 'Kubernetes deployment platform with GitOps workflow',
        html_url: 'https://github.com/noahjenkins/clouddeploy',
        stargazers_count: 89,
        forks_count: 23,
        language: 'Go',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        name: 'audiostream',
        description: 'Real-time audio processing with WebRTC and voice effects',
        html_url: 'https://github.com/noahjenkins/audiostream',
        stargazers_count: 156,
        forks_count: 34,
        language: 'JavaScript',
        updated_at: '2024-01-10T14:20:00Z'
      },
      {
        name: 'inframonitor',
        description: 'Custom monitoring solution for hybrid cloud environments',
        html_url: 'https://github.com/noahjenkins/inframonitor',
        stargazers_count: 67,
        forks_count: 19,
        language: 'Python',
        updated_at: '2024-01-08T09:15:00Z'
      }
    ]
  }
}