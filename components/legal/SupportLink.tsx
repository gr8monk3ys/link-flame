import Link from "next/link"
import { SUPPORT_EMAIL } from "@/config/constants"

/**
 * Support contact for policy pages: a mailto link when
 * NEXT_PUBLIC_SUPPORT_EMAIL is set, otherwise a link to the contact form.
 */
export function SupportLink({ className }: { className?: string }) {
  if (SUPPORT_EMAIL) {
    return (
      <a href={`mailto:${SUPPORT_EMAIL}`} className={className}>
        {SUPPORT_EMAIL}
      </a>
    )
  }
  return (
    <Link href="/contact" className={className}>
      our contact form
    </Link>
  )
}
