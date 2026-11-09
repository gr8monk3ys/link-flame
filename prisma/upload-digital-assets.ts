/**
 * Loads the guide PDFs into the database (DigitalAsset rows), where the
 * download route serves them from. The PDFs are paid products and are not
 * kept in this public repository.
 *
 *   npm run catalogue:upload-assets -- --dir <folder with the PDFs> [--apply]
 *
 * Each launch product lists the filenames its buyers receive
 * (prisma/seed-data/launch-catalogue.ts, `assetFiles`); the folder must hold
 * a file of each name. Without --apply it only checks and prints the plan.
 * Re-running replaces a file's bytes in place, so links already sent keep
 * working and serve the new version.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { launchProducts } from './seed-data/launch-catalogue';

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const dirIndex = argv.indexOf('--dir');
const dir = dirIndex >= 0 ? argv[dirIndex + 1] : undefined;
const APPLY = argv.includes('--apply');

// Postgres bytea and the route's in-memory response both handle this easily;
// a bigger file is probably the wrong file.
const MAX_BYTES = 25 * 1024 * 1024;

async function main() {
  if (!dir) {
    console.error('usage: upload-digital-assets --dir <folder> [--apply]');
    process.exit(2);
  }

  let missing = 0;
  for (const product of launchProducts) {
    if (!product.assetFiles?.length) continue;

    const row = await prisma.product.findFirst({
      where: { title: product.title },
      select: { id: true, fulfillment: true },
    });
    if (!row) {
      console.error(`missing product "${product.title}": run catalogue:apply first`);
      missing++;
      continue;
    }

    for (const [sortOrder, filename] of product.assetFiles.entries()) {
      const path = resolve(dir, filename);
      if (!existsSync(path)) {
        console.error(`missing file ${path}`);
        missing++;
        continue;
      }
      const data = readFileSync(path);
      if (data.subarray(0, 5).toString('latin1') !== '%PDF-') {
        console.error(`not a PDF: ${path}`);
        missing++;
        continue;
      }
      if (data.length > MAX_BYTES) {
        console.error(`too large (${data.length} bytes): ${path}`);
        missing++;
        continue;
      }
      const sha256 = createHash('sha256').update(data).digest('hex');
      console.log(`${APPLY ? 'upload' : 'would upload'}  ${product.title} <- ${filename} (${Math.round(data.length / 1024)} KB, ${sha256.slice(0, 12)})`);
      if (!APPLY) continue;

      const fields = {
        contentType: 'application/pdf',
        data: new Uint8Array(data),
        sizeBytes: data.length,
        sha256,
        sortOrder,
      };
      await prisma.digitalAsset.upsert({
        where: { productId_filename: { productId: row.id, filename } },
        create: { productId: row.id, filename, ...fields },
        update: fields,
      });
    }
  }

  if (missing > 0) {
    console.error(`${missing} problem(s); nothing is wrong in the database, fix and re-run.`);
    process.exit(1);
  }
  if (!APPLY) console.log('Dry run. Pass --apply to write.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
