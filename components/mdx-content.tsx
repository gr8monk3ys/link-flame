import Link from "next/link"
import { MDXRemote } from "next-mdx-remote/rsc"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

// The project has no @tailwindcss/typography plugin, so `prose` classes are
// inert. Style MDX elements directly instead.
const components = {
  // The page already renders the post title as the only <h1>; demote any
  // top-level heading in the post body so the outline stays valid.
  h1: ({ className, ...props }: ComponentProps<"h2">) => (
    <h2 className={cn("mt-10 scroll-m-20 text-3xl font-bold tracking-tight", className)} {...props} />
  ),
  h2: ({ className, ...props }: ComponentProps<"h2">) => (
    <h2 className={cn("mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight", className)} {...props} />
  ),
  h3: ({ className, ...props }: ComponentProps<"h3">) => (
    <h3 className={cn("mt-8 scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props} />
  ),
  p: ({ className, ...props }: ComponentProps<"p">) => (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentProps<"blockquote">) => (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic text-muted-foreground", className)} {...props} />
  ),
  a: ({ href = "", className, ...props }: ComponentProps<"a">) => {
    const classes = cn("font-medium text-primary underline underline-offset-4", className)
    if (href.startsWith("/")) {
      return <Link href={href} className={classes} {...props} />
    }
    return <a href={href} className={classes} rel="noopener noreferrer" {...props} />
  },
  code: ({ className, ...props }: ComponentProps<"code">) => (
    <code className={cn("rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm", className)} {...props} />
  ),
  hr: (props: ComponentProps<"hr">) => <hr className="my-8" {...props} />,
}

export function MdxContent({ source }: { source: string }) {
  return (
    <div className="text-base text-foreground md:text-lg">
      <MDXRemote source={source} components={components} />
    </div>
  )
}
