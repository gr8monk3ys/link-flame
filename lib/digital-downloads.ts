import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import { FULFILLMENT } from "@/lib/fulfillment";

export const DEFAULT_MAX_DOWNLOADS = 10;
/** Order statuses that keep download links working (a partial refund of a
 * mixed order should not take away the guides that were kept). */
export const DOWNLOADABLE_ORDER_STATUSES = ["paid", "partially_refunded"];

export interface OrderDownloadLink {
  token: string;
  url: string;
  productTitle: string;
  filename: string;
  sizeBytes: number;
  downloadsLeft: number;
}

/** 32 random bytes, URL-safe. The token is the only secret in a download link. */
export function generateDownloadToken(): string {
  return randomBytes(32).toString("base64url");
}

export function downloadUrl(token: string): string {
  return `${getBaseUrl()}/api/downloads/${token}`;
}

/**
 * Creates one download link per digital asset in a paid order.
 * Idempotent: (orderId, assetId) is unique, so a retried webhook adds nothing.
 */
export async function createDownloadsForOrder(
  orderId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const items = await client.orderItem.findMany({
    where: { orderId, product: { fulfillment: FULFILLMENT.DIGITAL } },
    select: {
      product: { select: { digitalAssets: { select: { id: true } } } },
    },
  });

  const assetIds = new Set<string>();
  for (const item of items) {
    for (const asset of item.product.digitalAssets) assetIds.add(asset.id);
  }
  if (assetIds.size === 0) return 0;

  const result = await client.digitalDownload.createMany({
    data: [...assetIds].map((assetId) => ({
      orderId,
      assetId,
      token: generateDownloadToken(),
      maxDownloads: DEFAULT_MAX_DOWNLOADS,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

/** Download links for an order, newest asset order first. Empty unless paid. */
export async function getOrderDownloads(orderId: string): Promise<OrderDownloadLink[]> {
  const downloads = await prisma.digitalDownload.findMany({
    where: { orderId, order: { status: { in: DOWNLOADABLE_ORDER_STATUSES } } },
    select: {
      token: true,
      downloadCount: true,
      maxDownloads: true,
      asset: {
        select: {
          filename: true,
          sizeBytes: true,
          sortOrder: true,
          product: { select: { title: true } },
        },
      },
    },
    orderBy: [{ asset: { productId: "asc" } }, { asset: { sortOrder: "asc" } }],
  });

  return downloads.map((d) => ({
    token: d.token,
    url: downloadUrl(d.token),
    productTitle: d.asset.product.title,
    filename: d.asset.filename,
    sizeBytes: d.asset.sizeBytes,
    downloadsLeft: Math.max(0, d.maxDownloads - d.downloadCount),
  }));
}

export type DownloadClaim =
  | { ok: true; filename: string; contentType: string; data: Uint8Array }
  | { ok: false; reason: "not_found" | "not_paid" | "exhausted" };

/**
 * Validates a token and counts the download atomically. The count only
 * increments while it is below the cap, so concurrent requests cannot
 * exceed it.
 */
export async function claimDownload(token: string): Promise<DownloadClaim> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { ok: false, reason: "not_found" };

  const download = await prisma.digitalDownload.findUnique({
    where: { token },
    select: {
      id: true,
      downloadCount: true,
      maxDownloads: true,
      order: { select: { status: true } },
      assetId: true,
    },
  });
  if (!download) return { ok: false, reason: "not_found" };
  if (!DOWNLOADABLE_ORDER_STATUSES.includes(download.order.status)) return { ok: false, reason: "not_paid" };

  const counted = await prisma.digitalDownload.updateMany({
    where: { id: download.id, downloadCount: { lt: download.maxDownloads } },
    data: { downloadCount: { increment: 1 }, lastDownloadedAt: new Date() },
  });
  if (counted.count === 0) return { ok: false, reason: "exhausted" };

  const asset = await prisma.digitalAsset.findUnique({
    where: { id: download.assetId },
    select: { filename: true, contentType: true, data: true },
  });
  if (!asset) return { ok: false, reason: "not_found" };

  return {
    ok: true,
    filename: asset.filename,
    contentType: asset.contentType,
    data: asset.data,
  };
}
