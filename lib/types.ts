export interface Author {
  name: string
  image: string
  role: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  coverImage: string
  publishedAt: string | Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
  featured?: boolean
  content?: string
}
