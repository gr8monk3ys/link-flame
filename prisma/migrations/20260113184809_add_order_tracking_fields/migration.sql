-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "estimatedDelivery" DATETIME;
ALTER TABLE "Order" ADD COLUMN "shippedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "shippingCarrier" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingStatus" TEXT DEFAULT 'processing';
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;

-- CreateIndex
CREATE INDEX "Order_shippingStatus_idx" ON "Order"("shippingStatus");
