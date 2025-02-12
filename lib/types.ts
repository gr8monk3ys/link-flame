export interface Author {
  name: string
  image: string
  bio: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  coverImage: string
  publishedAt: Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
  featured?: boolean
  content?: string
}
