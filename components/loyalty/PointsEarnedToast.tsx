'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface PointsEarnedToastProps {
  points: number
  message?: string
  source?: string
  onClose?: () => void
  duration?: number
  className?: string
}

/**
 * Toast notification for when users earn loyalty points.
 * Auto-dismisses after the specified duration.
 */
export function PointsEarnedToast({
  points,
  message,
  source,
  onClose,
  duration = 5000,
  className,
}: PointsEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    leaveTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [duration, handleClose])

  if (!isVisible) return null

  const defaultMessage = getDefaultMessage(source)

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm overflow-hidden rounded-lg border bg-background shadow-lg transition-all duration-300',
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Celebration header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Points Earned!</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl font-bold text-green-600">+{points}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {message || defaultMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Keep earning to unlock more rewards!
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-green-500 transition-all ease-linear"
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

function getDefaultMessage(source?: string): string {
  switch (source) {
    case 'PURCHASE':
      return 'Thank you for your purchase!'
    case 'REVIEW':
      return 'Thanks for sharing your review!'
    case 'REFERRAL':
      return 'Your referral was successful!'
    case 'SIGNUP':
      return 'Welcome to Link Flame Rewards!'
    default:
      return 'You earned loyalty points!'
  }
}

/**
 * Hook to manage points earned toast notifications
 */
export function usePointsToast() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; points: number; message?: string; source?: string }>
  >([])

  const showPointsEarned = (params: {
    points: number
    message?: string
    source?: string
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, ...params }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const PointsToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <PointsEarnedToastWithStyle
          key={toast.id}
          points={toast.points}
          message={toast.message}
          source={toast.source}
          onClose={() => removeToast(toast.id)}
          className={cn(index > 0 && `bottom-${4 + index * 6}`)}
          style={{ bottom: `${1 + index * 7}rem` }}
        />
      ))}
    </>
  )

  return { showPointsEarned, PointsToastContainer }
}

// Extended interface to support style prop
interface ExtendedPointsEarnedToastProps extends PointsEarnedToastProps {
  style?: React.CSSProperties
}

// Re-export with style support
export function PointsEarnedToastWithStyle({
  style,
  onClose,
  duration = 5000,
  points,
  message,
  source,
  className,
}: ExtendedPointsEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    leaveTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [duration, handleClose])

  if (!isVisible) return null

  const defaultMessage = getDefaultMessage(source)

  return (
    <div
      className={cn(
        'fixed z-50 max-w-sm overflow-hidden rounded-lg border bg-background shadow-lg transition-all duration-300',
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        className
      )}
      style={{ right: '1rem', ...style }}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Points Earned!</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl font-bold text-green-600">+{points}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {message || defaultMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Keep earning to unlock more rewards!
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-green-500"
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
