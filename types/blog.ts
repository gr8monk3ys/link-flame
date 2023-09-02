/**
 * Blog and Author type definitions
 * Consolidates types from types/post.ts and lib/types.ts
 */

export interface Author {
  id?: string;
  name: string;
  image: string;
  bio?: string;
  role?: string;
  blogPosts?: BlogPost[];
}

export interface Category {
  id: string;
  name: string;
  blogPosts?: BlogPost[];
}

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  publishedAt: Date | string;
  author: Author;
  authorId?: string;
  category?: string;
  categoryId?: string;
  tags: string[];
  readingTime?: string;
  featured?: boolean;
  content?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Alias for backward compatibility
 * @deprecated Use BlogPost instead
 */
export type Post = BlogPost;

/**
 * Blog post metadata (without full content)
 */
export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  publishedAt: Date | string;
  author: Author;
  category?: string;
  tags: string[];
  readingTime?: string;
  featured?: boolean;
}

/**
 * Blog post list response
 */
export interface BlogPostsListResponse {
  posts: BlogPost[];
  total: number;
  page?: number;
  limit?: number;
}
