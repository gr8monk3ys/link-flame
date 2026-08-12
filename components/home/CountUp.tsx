"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  /** Animation length in ms once the number scrolls into view. */
  duration?: number;
  className?: string;
}

function format(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Animates from 0 to `value` the first time the element enters the viewport.
 * Users with reduced motion, and any environment without IntersectionObserver,
 * see the final value immediately — the animation is decoration, never the
 * only way to reach the number.
 */
export function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => format(value));
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasRun.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || hasRun.current) return;
        hasRun.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(format(value * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export default CountUp;
