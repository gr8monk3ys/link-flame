'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { PredictiveSearch } from './PredictiveSearch'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Search dialog for mobile and keyboard shortcut access
 * Opens a full-screen search experience with predictive search
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[10%] max-h-[90vh] translate-y-0 overflow-hidden p-0 sm:top-[20%] sm:max-w-xl">
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>
        <div className="p-4">
          <PredictiveSearch autoFocus onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SearchTriggerProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Hook and component for search dialog trigger functionality
 * Supports keyboard shortcut (Cmd/Ctrl + K)
 */
export function useSearchDialog() {
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}

/**
 * Search button that displays the keyboard shortcut hint
 */
export function SearchTrigger({ className, children }: SearchTriggerProps) {
  const { isOpen, setIsOpen, open } = useSearchDialog()

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={className}
        aria-label="Search (Cmd+K)"
      >
        {children || (
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden lg:inline-flex">Search...</span>
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:inline-flex">
              <span className="text-xs">Cmd</span>K
            </kbd>
          </div>
        )}
      </button>
      <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
