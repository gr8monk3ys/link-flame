/**
 * The free guide given to everyone who joins the email list.
 *
 * One place for its facts, because the page, the home-page section and the
 * welcome email all name them. The PDF is built from the manuscript in the
 * private products repo with `scripts/render-guide-pdf.mjs --free`; update
 * `pages` here when a new render changes the page count.
 */
export const FREE_GUIDE = {
  title: "The First Count",
  summary: "One day of tally marks to find out what your household throws away most.",
  pages: 10,
  /** Public path of the PDF under `public/`. */
  href: "/downloads/link-flame-the-first-count.pdf",
  /** File name the browser saves it as. */
  fileName: "link-flame-the-first-count.pdf",
} as const
