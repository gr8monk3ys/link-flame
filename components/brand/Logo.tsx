import { cn } from "@/lib/utils"

/**
 * The leaf-flame.
 *
 * Link Flame sells everyday essentials minus the plastic, and the notebook it
 * is drawn in keeps every product on a square plate. The mark is that plate: a
 * square of Moss ink with square corners (no border, no gradient, no shadow)
 * carrying one silhouette cut out of it in paper. The silhouette is a single
 * teardrop whose tip rises and hooks to the right, so it is a leaf and a flame
 * at once, with a thin tapered midrib slit up its centre that gives the leaf
 * its vein and the flame its core. On the 24-unit grid the leaf runs from
 * y = 2 to y = 22, the slit is 3 units wide at the base and the bridge below
 * it 1.5, so nothing finer than a pixel is asked of a 16px favicon.
 *
 * One path, `fill-rule="evenodd"`: the plate is the first subpath, the leaf the
 * second (a true hole, so whatever the mark sits on shows through) and the
 * slit the third (inside the leaf, so it fills back with ink). The ink is
 * `hsl(var(--primary))`, so the same element is Moss on paper by day and the
 * lifted Moss at night with no `dark:` override. `scripts/generate-brand.mjs`
 * carries the same path for the static assets in `public/brand/`;
 * `tests/unit/brand-assets.test.ts` keeps the two equal.
 */
export const MARK_PATH =
  "M0 0H24V24H0ZM16 2C14.3 6.8 20 10 20 15C20 18.8 16.4 22 12 22C7.6 22 4 18.8 4 15C4 8.8 11 5.2 16 2ZM10.4 20.5C10.4 15 12 10.5 14 7C14.1 10.5 13.5 15 13.5 20.5Z"

/**
 * Fraunces 700's cap height as a fraction of the em (`sCapHeight` 1400 over
 * 2000 units per em). The mark's height equals the wordmark's cap height, so
 * a wordmark set beside a mark of `size` px is `size / WORDMARK_CAP_HEIGHT`
 * px of type.
 */
export const WORDMARK_CAP_HEIGHT = 0.7

export interface LogoMarkProps extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  /** Rendered width and height in px. A `size-*` class on `className` overrides it. */
  size?: number
  /** An accessible name. Without one the mark is decorative (`aria-hidden`). */
  title?: string
  className?: string
}

export function LogoMark({ size = 24, title, className, ...rest }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path fill="hsl(var(--primary))" fillRule="evenodd" d={MARK_PATH} />
    </svg>
  )
}

export interface LogoProps {
  /**
   * `horizontal`: mark, 12px gap, wordmark, with the mark as tall as the
   * wordmark's capitals. `stacked`: mark above, 12px gap, wordmark centred
   * beneath, the mark twice the wordmark's cap height. `mark`: the plate alone.
   */
  variant?: "horizontal" | "stacked" | "mark"
  /** The mark's height in px. The wordmark is sized from it. */
  size?: number
  className?: string
}

/**
 * The signature: the plate beside the name. The wordmark is live text in the
 * display face, Ink, with "Flame" in Moss — one phrase in ink. Server-safe;
 * no client hooks.
 */
export function Logo({ variant = "horizontal", size = 24, className }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark size={size} title="Link Flame" className={className} />
  }

  const stacked = variant === "stacked"
  const capHeight = stacked ? size / 2 : size
  const fontSize = capHeight / WORDMARK_CAP_HEIGHT

  return (
    <span
      role="img"
      aria-label="Link Flame"
      className={cn(
        "inline-flex items-center gap-3 text-foreground",
        stacked && "flex-col justify-center",
        className
      )}
    >
      <LogoMark size={size} aria-hidden />
      {/* The wordmark is Fraunces 700 — the display face. `data-voice` marks
          the one sanctioned `font-display` outside a heading for
          scripts/check-design-system.mjs (The Serif Speaks Rule). */}
      <span
        data-voice="display"
        className="whitespace-nowrap font-display font-bold leading-none tracking-tight"
        style={{ fontSize }}
      >
        Link <span className="text-primary">Flame</span>
      </span>
    </span>
  )
}
