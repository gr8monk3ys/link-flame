-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "printfulError" TEXT,
ADD COLUMN     "printfulOrderId" TEXT,
ADD COLUMN     "printfulStatus" TEXT,
ADD COLUMN     "shippingDetails" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fulfillment" TEXT NOT NULL DEFAULT 'stock',
ADD COLUMN     "printFile" TEXT,
ADD COLUMN     "printfulVariantId" INTEGER;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "printfulVariantId" INTEGER;

-- CreateTable
CREATE TABLE "DigitalAsset" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "data" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalDownload" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 10,
    "lastDownloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalAsset_productId_idx" ON "DigitalAsset"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalAsset_productId_filename_key" ON "DigitalAsset"("productId", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalDownload_token_key" ON "DigitalDownload"("token");

-- CreateIndex
CREATE INDEX "DigitalDownload_orderId_idx" ON "DigitalDownload"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalDownload_orderId_assetId_key" ON "DigitalDownload"("orderId", "assetId");

-- CreateIndex
CREATE INDEX "Product_fulfillment_idx" ON "Product"("fulfillment");

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownload" ADD CONSTRAINT "DigitalDownload_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownload" ADD CONSTRAINT "DigitalDownload_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
