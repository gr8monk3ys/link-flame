import { cn } from '@/lib/utils'

/**
 * Typographic stand-in for a brand logo.
 *
 * Seed data used to ship random stock photos in the `logo` field — a sneaker
 * standing in for a phone-case company. A designed monogram is honest about
 * what we have: the brand's name, set in the site's serif, on a tint chosen
 * deterministically from the name so each brand keeps its color everywhere
 * it appears. When a real logo URL exists, callers render it instead.
 */

const PALETTES = [
  { bg: 'bg-green-100 dark:bg-green-900/40', fg: 'text-green-800 dark:text-green-200' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', fg: 'text-emerald-800 dark:text-emerald-200' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', fg: 'text-amber-800 dark:text-amber-200' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40', fg: 'text-teal-800 dark:text-teal-200' },
  { bg: 'bg-stone-200 dark:bg-stone-800/60', fg: 'text-stone-700 dark:text-stone-200' },
  { bg: 'bg-lime-100 dark:bg-lime-900/40', fg: 'text-lime-800 dark:text-lime-200' },
] as const

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

function paletteFor(name: string): (typeof PALETTES)[number] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997
  }
  return PALETTES[hash % PALETTES.length]
}

export interface BrandMarkProps {
  name: string
  className?: string
}

export function BrandMark({ name, className }: BrandMarkProps) {
  const palette = paletteFor(name)
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex size-full select-none items-center justify-center',
        palette.bg,
        className
      )}
    >
      {/* SVG text scales with its container, so the same mark works at 64px and at hero size */}
      <svg viewBox="0 0 100 100" className={cn('size-full', palette.fg)}>
        <text
          x="50"
          y="50"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize="34"
          className="font-serif font-semibold"
          fill="currentColor"
          letterSpacing="2"
        >
          {initialsOf(name)}
        </text>
      </svg>
    </div>
  )
}

export default BrandMark
