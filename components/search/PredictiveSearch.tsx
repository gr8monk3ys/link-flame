'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/hooks/useSearch'
import { SearchSuggestions } from './SearchSuggestions'

interface PredictiveSearchProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  onClose?: () => void
}

export function PredictiveSearch({
  className,
  placeholder = 'Search products, categories, and blogs...',
  autoFocus = false,
  onClose,
}: PredictiveSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const {
    query,
    setQuery,
    isLoading,
    error,
    suggestions,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearSearch,
  } = useSearch()

  // Calculate total navigable items
  const getTotalItems = useCallback(() => {
    if (!query.trim() && recentSearches.length > 0) {
      return recentSearches.length
    }
    if (suggestions) {
      return (
        suggestions.products.length +
        suggestions.categories.length +
        suggestions.blogPosts.length
      )
    }
    return 0
  }, [query, recentSearches, suggestions])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const totalItems = getTotalItems()

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) =>
            prev < totalItems - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : totalItems - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0) {
            handleSelectByIndex(selectedIndex)
          } else if (query.trim()) {
            handleSearch()
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          inputRef.current?.blur()
          onClose?.()
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [getTotalItems, selectedIndex, query, onClose]
  )

  // Handle selecting an item by index (for keyboard navigation)
  const handleSelectByIndex = useCallback(
    (index: number) => {
      // If showing recent searches
      if (!query.trim() && recentSearches.length > 0) {
        const recentQuery = recentSearches[index]
        if (recentQuery) {
          setQuery(recentQuery)
          addRecentSearch(recentQuery)
        }
        return
      }

      // If showing suggestions
      if (suggestions) {
        let currentIndex = 0

        // Check products
        if (index < currentIndex + suggestions.products.length) {
          const product = suggestions.products[index - currentIndex]
          if (product) {
            addRecentSearch(query)
            setIsOpen(false)
            router.push(`/products/${product.slug}`)
            onClose?.()
          }
          return
        }
        currentIndex += suggestions.products.length

        // Check categories
        if (index < currentIndex + suggestions.categories.length) {
          const category = suggestions.categories[index - currentIndex]
          if (category) {
            addRecentSearch(query)
            setIsOpen(false)
            router.push(`/collections?category=${encodeURIComponent(category.name)}`)
            onClose?.()
          }
          return
        }
        currentIndex += suggestions.categories.length

        // Check blog posts
        if (index < currentIndex + suggestions.blogPosts.length) {
          const post = suggestions.blogPosts[index - currentIndex]
          if (post) {
            addRecentSearch(query)
            setIsOpen(false)
            router.push(`/blogs/${post.slug}`)
            onClose?.()
          }
          return
        }
      }
    },
    [query, recentSearches, suggestions, router, addRecentSearch, setQuery, onClose]
  )

  // Handle search submission
  const handleSearch = useCallback(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      addRecentSearch(trimmedQuery)
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      onClose?.()
    }
  }, [query, addRecentSearch, router, onClose])

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setSelectedIndex(-1)
    setIsOpen(true)
  }

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  // Handle selecting a recent search
  const handleSelectRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery)
    addRecentSearch(recentQuery)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle result selection (close dropdown)
  const handleResultSelect = () => {
    if (query.trim()) {
      addRecentSearch(query.trim())
    }
    setIsOpen(false)
    onClose?.()
  }

  // Handle clear search
  const handleClear = () => {
    clearSearch()
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0)

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        {/* Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="h-11 pl-10 pr-20"
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="search-suggestions"
          role="combobox"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin text-muted-foreground"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {/* Clear Button */}
        {query && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-12 top-1/2 size-8 -translate-y-1/2"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        )}

        {/* Search Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSearch}
          disabled={!query.trim()}
          className="absolute right-2 top-1/2 size-8 -translate-y-1/2"
          aria-label="Submit search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </div>

      {/* Search Suggestions Dropdown */}
      {showDropdown && (
        <SearchSuggestions
          suggestions={suggestions}
          recentSearches={recentSearches}
          isLoading={isLoading}
          error={error}
          query={query}
          selectedIndex={selectedIndex}
          onSelectRecentSearch={handleSelectRecentSearch}
          onRemoveRecentSearch={removeRecentSearch}
          onResultSelect={handleResultSelect}
        />
      )}
    </div>
  )
}
