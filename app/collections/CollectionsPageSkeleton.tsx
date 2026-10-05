/**
 * Placeholder for the catalogue, shaped like the catalogue.
 *
 * The route renders its real content on the server, so this is a safety net
 * rather than the usual path - but a safety net that is 200px tall under a
 * 3,600px page is how this page earned a 0.59 CLS in the first place. Every
 * box below mirrors the real one: the heading and standfirst are the real
 * text, the value chips are the height of real chips, the sidebar and the grid
 * reserve the columns they will occupy.
 */
export default function CollectionsPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="pt-8">
        <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          Shop all products
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Every product is screened for what it is made of and who made it.
          Filter by the values that matter to you.
        </p>
      </div>

      <div className="border-b border-border py-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Shop by Values</h2>
        <div className="flex gap-2 overflow-hidden px-0.5 py-1">
          {[1, 2, 3, 4, 5].map((chip) => (
            <div
              key={chip}
              className="h-[38px] w-28 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8 py-8 lg:flex-row">
        <div className="w-full space-y-6 lg:w-64">
          <div className="space-y-2">
            <div className="mb-4 h-5 w-24 animate-pulse rounded bg-muted" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <div key={row} className="flex items-center gap-3 p-2">
                <div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
                <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="space-y-8">
            {[1, 2, 3, 4].map((section) => (
              <div key={section}>
                <div className="h-7 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
              <div key={card} className="animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-muted" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
