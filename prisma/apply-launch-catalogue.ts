/**
 * Puts the launch catalogue into a live database without the seed's
 * deletes. Safe to re-run.
 *
 *   npm run catalogue:apply                         # dry run: prints the plan
 *   npm run catalogue:apply -- --apply              # create/update launch products
 *   npm run catalogue:apply -- --apply --remove-placeholders
 *
 * --apply                 creates each launch product (matched by title) or
 *                         updates it in place, and upserts the tee's sizes by SKU.
 * --remove-placeholders   also deletes every other product that no order or
 *                         subscription references (with its cart lines, saved
 *                         items, reviews, value/certification/impact links and
 *                         bundle slots), then bundles left empty and brands
 *                         left without products. Products that an order does
 *                         reference are kept, set to zero stock and listed.
 *
 * Point DATABASE_URL at the target database. Back it up first (Neon:
 * create a branch).
 */
import { PrismaClient } from '@prisma/client';
import { launchProducts, productData, variantData } from './seed-data/launch-catalogue';

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const REMOVE = args.has('--remove-placeholders');

async function upsertLaunchProducts() {
  for (const product of launchProducts) {
    const existing = await prisma.product.findFirst({
      where: { title: product.title },
      select: { id: true },
    });
    console.log(`${existing ? 'update' : 'create'}  ${product.title}`);
    if (!APPLY) continue;

    const data = productData(product);
    const saved = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data });

    for (const [index, variant] of (product.variants ?? []).entries()) {
      const vData = variantData(variant, index);
      await prisma.productVariant.upsert({
        where: { productId_sku: { productId: saved.id, sku: variant.sku } },
        create: { ...vData, productId: saved.id },
        update: vData,
      });
    }
  }
}

async function removePlaceholders() {
  const launchTitles = launchProducts.map((p) => p.title);
  const others = await prisma.product.findMany({
    where: { title: { notIn: launchTitles } },
    select: {
      id: true,
      title: true,
      _count: { select: { orderItems: true, subscriptionItems: true } },
    },
  });

  const referenced = others.filter((p) => p._count.orderItems > 0 || p._count.subscriptionItems > 0);
  const removable = others.filter((p) => !referenced.includes(p));

  for (const p of removable) console.log(`delete  ${p.title}`);
  for (const p of referenced) {
    console.log(
      `keep    ${p.title} (${p._count.orderItems} order lines, ${p._count.subscriptionItems} subscription lines): stock set to 0`
    );
  }
  if (!APPLY) return;

  const ids = removable.map((p) => p.id);
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: { in: ids } } }),
    prisma.savedItem.deleteMany({ where: { productId: { in: ids } } }),
    prisma.review.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productCertification.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productValueAssignment.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productImpact.deleteMany({ where: { productId: { in: ids } } }),
    prisma.imperfectBatch.deleteMany({ where: { productId: { in: ids } } }),
    prisma.bundleProduct.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productVariant.deleteMany({ where: { productId: { in: ids } } }),
    prisma.product.deleteMany({ where: { id: { in: ids } } }),
    prisma.product.updateMany({
      where: { id: { in: referenced.map((p) => p.id) } },
      data: { inventory: 0, featured: false, isSubscribable: false },
    }),
    prisma.productVariant.updateMany({
      where: { productId: { in: referenced.map((p) => p.id) } },
      data: { inventory: 0 },
    }),
  ]);

  const emptyBundles = await prisma.bundle.findMany({
    where: { products: { none: {} } },
    select: { id: true, title: true },
  });
  for (const b of emptyBundles) console.log(`delete  bundle ${b.title}`);
  await prisma.bundleSelection.deleteMany({ where: { bundleId: { in: emptyBundles.map((b) => b.id) } } });
  await prisma.bundle.deleteMany({ where: { id: { in: emptyBundles.map((b) => b.id) } } });

  const emptyBrands = await prisma.brand.findMany({
    where: { products: { none: {} } },
    select: { id: true, name: true },
  });
  for (const b of emptyBrands) console.log(`delete  brand ${b.name}`);
  await prisma.brand.deleteMany({ where: { id: { in: emptyBrands.map((b) => b.id) } } });
}

async function main() {
  console.log(APPLY ? 'Applying launch catalogue' : 'Dry run (pass --apply to write)');
  await upsertLaunchProducts();
  if (REMOVE) await removePlaceholders();
  console.log('Done. Next: npm run catalogue:upload-assets -- --dir <folder with the guide PDFs> --apply');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
