---
draft: true
slug: low-waste-coffee-and-tea
title: "A Low-Waste Coffee and Tea Routine at Home"
description: "Make coffee and tea at home with less waste: reusable filters, loose-leaf tea, a cup you bring along, and a use for grounds and leaves after brewing."
coverImage: /images/blogs/default-hero.jpg
authorId: author2  # Emma Green, Sustainability Expert (per prisma/seed.ts) — swap for real author record on import
categoryId: catZeroWaste  # "Zero Waste" category (per prisma/seed.ts)
tags: zero-waste,coffee,tea,kitchen,reusables
featured: false
readingTime: "5 min read"
---

# A Low-Waste Coffee and Tea Routine at Home

Most people make coffee or tea at least once a day, often more. That makes the morning drink one of the most repeated habits in the kitchen, and every repetition can leave something behind: a paper filter, a tea bag, a single-use pod, a takeaway cup. None of these is large on its own, but together they add up to a steady stream of waste that nobody really notices.

The good news is that a low-waste routine doesn't mean giving up the drink you like. It mostly means changing what the coffee or tea passes through on its way to your cup, and what happens to everything afterwards.

## Coffee: Start with the Filter

If you brew pour-over or drip coffee, the paper filter is the one thing you throw away every single time. A washable filter removes it from the routine.

### A Reusable Cloth Filter
Our [Reusable Coffee Filter](/products) is made of organic cotton and fits most pour-over coffee makers. After brewing, knock the grounds out, rinse the filter under the tap, and let it dry before the next use. Cloth filters slowly darken with use; that's normal and doesn't affect the coffee. If you'd rather not deal with cloth at all, a metal mesh filter is another reusable option, though it lets more of the coffee's oils and fine sediment through, so the cup tastes heavier.

### Rethink Single-Use Pods
Pod machines are convenient, but each pod is a single-use package around one cup of coffee. If you already own one, a refillable pod that you fill with your own ground coffee keeps the machine in use without the disposable capsules. If you're choosing a brewer from scratch, a pour-over cone, a French press or a stovetop pot all work with nothing more than coffee and water.

### Buy Beans with Less Packaging
Coffee usually comes in multi-layer bags that are hard to recycle. Some roasters and bulk stores let you fill your own container, which skips the bag entirely. Bring a clean, dry, airtight jar; one from the [Glass Food Storage Set](/products) works, and glass doesn't hold on to the smell of last month's beans.

## Tea: Loose Leaf over Bags

Tea bags look harmless, but some are sealed with plastic, which means they don't fully break down in compost. Brands vary, and many now say what their bags are made of on the box, so check before you assume.

### Switch to Loose-Leaf Tea
Loose-leaf tea avoids the question entirely. Brew it in a teapot with a built-in strainer, a simple infuser basket that sits in your mug, or a French press if you already own one for coffee. You can control the strength more easily too: more leaves for a stronger cup, fewer for a lighter one.

### Store It Well
Tea keeps its flavour longest away from light, air and moisture. An airtight glass jar in a dark cupboard is enough. Buying loose tea from a shop that lets you refill your own container cuts out the packaging the same way it does for coffee.

## Take It with You

The biggest source of coffee-related waste often isn't at home at all. It's the takeaway cup and lid bought on the way to work.

### Bring Your Own Cup
Fill an insulated bottle at home and you won't need a disposable cup later. The [Bamboo Water Bottle](/products) has a stainless steel inside and keeps hot drinks hot, so it works for coffee or tea as well as water. Many cafés will fill your own cup if you ask, and some offer a small discount for doing so.

### Keep One at Work
A mug that stays at your desk covers the days you forget your bottle, and it's one less reason to reach for the stack of paper cups by the office kettle.

## After Brewing: Grounds and Leaves

Used coffee grounds and tea leaves are food scraps, and they belong in the compost rather than the bin. Keep a [Compost Bin with Charcoal Filter](/products) on the counter next to the kettle so emptying the filter or teapot takes a single step. Grounds and leaves add nitrogen-rich material to a compost heap; our [Ultimate Guide to Composting](/blogs/ultimate-guide-to-composting) explains how to balance them with drier material like leaves and cardboard.

If you don't compost yet, a thin layer of spent grounds can go straight onto garden beds. Use them in moderation, and mix them into the soil rather than leaving a thick layer on top.

## Keep the Gear Clean

Reusable equipment only stays useful if you look after it. Rinse filters, infusers and teapots straight after use, before the residue dries. A [Bamboo Dish Brush](/products) reaches into cone filters and infuser baskets, and its head can be replaced when it wears out instead of throwing away the whole brush.

## The Bottom Line

You don't need to replace everything at once. Start with the item you throw away most often, whether that's a paper filter, a tea bag or a takeaway cup, and swap that first. Use up what you have, then buy the reusable version when you run out. For more ideas, the [Zero Waste guides](/guides-and-tips/zero-waste) cover the rest of the kitchen and home, and [Getting Started with Sustainable Living](/blogs/getting-started) is a good place to begin if this is your first change.

---

**Editorial note for reviewer (remove before publish):** Staged as a file per the same convention as the other posts in `content/drafts/`: the `BlogPost` Prisma model has no `draft`/`published` boolean, so any row is live as soon as it is seeded, and nothing in the app reads `content/drafts/`. To ship this post, add a `prisma.blogPost.create(...)` block to `prisma/seed.ts` alongside the existing posts (or wire up a real draft/publish flag). The products referenced (`Reusable Coffee Filter`, `Glass Food Storage Set`, `Bamboo Water Bottle`, `Compost Bin with Charcoal Filter`, `Bamboo Dish Brush`) all exist in `prisma/seed-data/products.ts`, and each is described only from its own seed description; the bottle's hot/cold hold times in that description are deliberately not repeated here. Product links go to `/products` because product pages are keyed by database id (`/products/[id]`); swap in the real product URLs once the ids are known. The post links only to published posts (`ultimate-guide-to-composting`, `getting-started`), not to the unpublished `zero-waste-kitchen-swaps` draft, which also mentions the reusable coffee filter; link the two once both are live. The statements that some tea bags contain plastic and that some cafés discount for a customer's own cup are hedged as "some"; an editor may want to add a current source. Cover image is the generic hero placeholder; swap in a coffee- or tea-specific image before publishing. The post contains no statistics; if an editor adds figures, cite a current source.
