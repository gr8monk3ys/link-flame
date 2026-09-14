'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Icons } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

// Dynamically import SearchDialog to reduce initial bundle size
// The search dialog and its dependencies (PredictiveSearch, useSearch hook)
// are only loaded when the user clicks the search button
const SearchDialog = dynamic(
  () => import('./SearchDialog').then(mod => ({ default: mod.SearchDialog })),
  {
    ssr: false,
    loading: () => null, // No loading state needed since dialog opens on user action
  }
)

interface HeaderSearchProps {
  className?: string
}

/**
 * Header search component with predictive search dialog
 * Features:
 * - Click to open search dialog
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * - Desktop shows search hint with keyboard shortcut
 * - Mobile shows simple search icon
 */
export function HeaderSearch({ className }: HeaderSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  // `dynamic()` still fetches its chunk the moment the component mounts, so
  // the closed dialog (Radix Dialog + PredictiveSearch) shipped on every page
  // load. Mount it on first open instead; it stays mounted afterwards so the
  // close animation and any typed query survive reopening.
  const [hasOpened, setHasOpened] = useState(false)
  const openSearch = () => {
    setHasOpened(true)
    setIsOpen(true)
  }

  // Warm the chunk once the browser is idle so the first open is still
  // instant; by then the hero has painted and this no longer competes with it.
  useEffect(() => {
    const warm = () => {
      void import('./SearchDialog')
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm)
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 2000)
    return () => window.clearTimeout(id)
  }, [])

  // Keyboard shortcut handler (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setHasOpened(true)
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Search Button - Mobile: icon only, Desktop: with shortcut hint */}
      <button
        type="button"
        onClick={openSearch}
        className={cn(
          'flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary',
          className
        )}
        aria-label="Search"
      >
        {/* Mobile: Just the icon */}
        <div className="flex items-center lg:hidden">
          <Icons.search className="size-5" />
          <span className="sr-only">Search</span>
        </div>

        {/* Desktop: Search bar hint with keyboard shortcut */}
        <div className="hidden items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 lg:flex">
          <Icons.search className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search...</span>
          <kbd className="pointer-events-none ml-4 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-xs font-medium opacity-100 sm:inline-flex">
            <span>Cmd</span>K
          </kbd>
        </div>
      </button>

      {/* Search Dialog */}
      {hasOpened && <SearchDialog open={isOpen} onOpenChange={setIsOpen} />}
    </>
  )
}
