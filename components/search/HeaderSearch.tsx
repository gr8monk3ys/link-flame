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
      {/* Search Button - Mobile: icon only, Desktop: with shortcut hint.

          No aria-label: it read "Search" while the button visibly read
          "Search… Cmd K", so someone using speech input to say the words in
          front of them could not reach this control (WCAG 2.5.3 Label in
          Name). The name now comes from whichever of the two layouts below is
          the visible one. */}
      <button type="button" onClick={openSearch} className={cn('inline-flex', className)}>
        {/* Mobile: a round hairline pill with the icon */}
        <span className="cta-secondary size-8 rounded-full sm:size-9 lg:hidden">
          <Icons.search className="size-4" aria-hidden="true" />
          <span className="sr-only">Search</span>
        </span>

        {/* Desktop: the same pill, stretched, with the shortcut as a wall label */}
        <span className="cta-secondary hidden h-9 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground lg:inline-flex">
          <Icons.search className="size-4" aria-hidden="true" />
          <span>Search…</span>
          <kbd className="label-mono pointer-events-none ml-3 hidden select-none items-center gap-1 normal-case tracking-normal sm:inline-flex">
            <span>Cmd</span>K
          </kbd>
        </span>
      </button>

      {/* Search Dialog */}
      {hasOpened && <SearchDialog open={isOpen} onOpenChange={setIsOpen} />}
    </>
  )
}
