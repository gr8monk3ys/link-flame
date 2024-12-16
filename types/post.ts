export interface Author {
  name: string
  image: string
  bio: string
}

export interface Post {
  title: string
  slug: string
  coverImage: string
  description: string
  date: string
  author: Author
  category: string
  tags: string[]
  featured: boolean
  content: string
}
