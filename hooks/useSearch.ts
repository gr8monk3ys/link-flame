'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  SearchSuggestionsResponse,
  RecentSearch,
  RECENT_SEARCHES_KEY,
  MAX_RECENT_SEARCHES,
} from '@/lib/types/search'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  isLoading: boolean
  error: string | null
  suggestions: SearchSuggestionsResponse | null
  recentSearches: string[]
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  removeRecentSearch: (query: string) => void
  clearSearch: () => void
}

/**
 * Custom hook for predictive search functionality
 *
 * Features:
 * - Debounced API calls (300ms default)
 * - Recent searches in localStorage
 * - Loading and error states
 * - Automatic cleanup on unmount
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minQueryLength = 2 } = options

  const [query, setQueryState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const searches: RecentSearch[] = JSON.parse(stored)
        // Sort by timestamp descending and extract queries
        const sortedQueries = searches
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_RECENT_SEARCHES)
          .map((s) => s.query)
        setRecentSearches(sortedQueries)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    if (typeof window === 'undefined') return

    try {
      const recentSearchData: RecentSearch[] = searches.map((q, index) => ({
        query: q,
        timestamp: Date.now() - index, // Preserve order
      }))
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearchData))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Add a search query to recent searches
  const addRecentSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      if (!trimmed || trimmed.length < minQueryLength) return

      setRecentSearches((prev) => {
        // Remove duplicate if exists, then add to front
        const filtered = prev.filter(
          (s) => s.toLowerCase() !== trimmed.toLowerCase()
        )
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
        saveRecentSearches(updated)
        return updated
      })
    },
    [minQueryLength, saveRecentSearches]
  )

  // Remove a specific recent search
  const removeRecentSearch = useCallback(
    (searchQuery: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter(
          (s) => s.toLowerCase() !== searchQuery.toLowerCase()
        )
        saveRecentSearches(updated)
        return updated
      })
    },
    [saveRecentSearches]
  )

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    }
  }, [])

  // Fetch search suggestions from API
  const fetchSuggestions = useCallback(
    async (searchQuery: string, signal: AbortSignal) => {
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`,
          { signal }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData?.error?.message || `Search failed (${response.status})`
          )
        }

        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data)
          setError(null)
        } else {
          throw new Error(data.error?.message || 'Search failed')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, ignore
          return
        }
        setError(err instanceof Error ? err.message : 'Search failed')
        setSuggestions(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Set query with debounced search
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery)

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Clear suggestions if query is too short
      if (newQuery.trim().length < minQueryLength) {
        setSuggestions(null)
        setError(null)
        setIsLoading(false)
        return
      }

      // Set loading state immediately for UI feedback
      setIsLoading(true)
      setError(null)

      // Debounce the API call
      debounceTimerRef.current = setTimeout(() => {
        abortControllerRef.current = new AbortController()
        fetchSuggestions(newQuery.trim(), abortControllerRef.current.signal)
      }, debounceMs)
    },
    [debounceMs, minQueryLength, fetchSuggestions]
  )

  // Clear search state
  const clearSearch = useCallback(() => {
    setQueryState('')
    setSuggestions(null)
    setError(null)
    setIsLoading(false)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    query,
    setQuery,
    isLoading,
    error,
    suggestions,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
    clearSearch,
  }
}
