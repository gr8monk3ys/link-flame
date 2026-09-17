import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Browse sustainable products curated for eco-friendly living and everyday essentials.',
};

// Segment config is per route, not inherited through the re-export below, so
// /products has to repeat what /collections declares. Without it this route
// goes back to being statically prerendered, which bails the catalogue out to
// client-only rendering and brings the 0.59 CLS back with it.
export const dynamic = 'force-dynamic';

export { default } from "../collections/page";
