/**
 * Search-related type definitions for the predictive search feature
 */

export interface ProductSuggestion {
  id: string
  title: string
  price: number
  salePrice: number | null
  image: string
  category: string
  slug: string
}

export interface CategorySuggestion {
  name: string
  count: number
}

export interface BlogPostSuggestion {
  id: string
  title: string
  slug: string
  coverImage: string | null
  category: string | null
  publishedAt: string
}

export interface SearchSuggestionsResponse {
  products: ProductSuggestion[]
  categories: CategorySuggestion[]
  blogPosts: BlogPostSuggestion[]
}

export interface SearchState {
  query: string
  isOpen: boolean
  isLoading: boolean
  error: string | null
  suggestions: SearchSuggestionsResponse | null
  recentSearches: string[]
  selectedIndex: number
}

export interface RecentSearch {
  query: string
  timestamp: number
}

export const RECENT_SEARCHES_KEY = 'link-flame-recent-searches'
export const MAX_RECENT_SEARCHES = 5
