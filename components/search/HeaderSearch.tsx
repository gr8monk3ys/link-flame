'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/shared/icons'
import { SearchDialog } from './SearchDialog'
import { cn } from '@/lib/utils'

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

  // Keyboard shortcut handler (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
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
        onClick={() => setIsOpen(true)}
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
          <kbd className="pointer-events-none ml-4 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
            <span className="text-xs">Cmd</span>K
          </kbd>
        </div>
      </button>

      {/* Search Dialog */}
      <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
