-- DropIndex
DROP INDEX "Wishlist_userId_name_key";

-- CreateTable
CREATE TABLE "SustainabilityCertification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "verificationUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductCertification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "certificateNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductCertification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCertification_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "SustainabilityCertification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarbonOffset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "offsetAmountKg" REAL NOT NULL,
    "provider" TEXT,
    "certificateUrl" TEXT,
    "projectName" TEXT,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarbonOffset_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "description" TEXT,
    "comparison" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "valuePerUnit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductImpact_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductImpact_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "ImpactMetric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "totalValue" REAL NOT NULL DEFAULT 0,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserImpact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserImpact_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "ImpactMetric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderImpact_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderImpact_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "ImpactMetric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "category" TEXT,
    "discountPercent" REAL NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustomizable" BOOLEAN NOT NULL DEFAULT false,
    "minItems" INTEGER,
    "maxItems" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BundleProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BundleProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BundleProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BundleSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "selectedItems" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL DEFAULT 0,
    "savings" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BundleSelection_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImperfectBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImperfectBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visibleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "categoryFilter" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visibleId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "responses" TEXT NOT NULL,
    "recommendedProductIds" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductValueAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductValueAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductValueAssignment_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "ProductValue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visibleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "frequency" TEXT NOT NULL,
    "nextDeliveryDate" DATETIME NOT NULL,
    "lastDeliveryDate" DATETIME,
    "skipNextDelivery" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtSubscription" REAL NOT NULL,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "pausedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumeAt" DATETIME,
    "resumedAt" DATETIME,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionPause_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "story" TEXT,
    "foundedYear" INTEGER,
    "headquarters" TEXT,
    "certifications" TEXT,
    "values" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LoyaltyPoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "orderId" TEXT,
    "reviewId" TEXT,
    "referralId" TEXT,
    "description" TEXT,
    "expiresAt" DATETIME,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoyaltyPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL,
    "orderId" TEXT,
    "discount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoyaltyRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "discountApplied" REAL,
    "pointsAwarded" INTEGER,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "firstOrderId" TEXT,
    "refereeOrderId" TEXT,
    "completedAt" DATETIME,
    "rewardedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "initialBalance" REAL NOT NULL,
    "currentBalance" REAL NOT NULL,
    "purchaserId" TEXT,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" DATETIME,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GiftCardTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftCardId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftCardTransaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TerraCycleSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visibleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itemCount" INTEGER,
    "weightKg" REAL,
    "shippingLabelUrl" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "processedAt" DATETIME,
    "materialsRecycled" TEXT,
    "impactMetrics" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "pointsAwardedAt" DATETIME,
    "notes" TEXT,
    "labelRequestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" DATETIME,
    "receivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TerraCycleStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalItemsRecycled" INTEGER NOT NULL DEFAULT 0,
    "totalWeightKg" REAL NOT NULL DEFAULT 0,
    "totalPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "plasticSavedKg" REAL NOT NULL DEFAULT 0,
    "co2SavedKg" REAL NOT NULL DEFAULT 0,
    "waterSavedLiters" REAL NOT NULL DEFAULT 0,
    "lastSubmissionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "shippingAddress" TEXT,
    "paymentMethod" TEXT,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "shippingStatus" TEXT DEFAULT 'processing',
    "trackingNumber" TEXT,
    "shippingCarrier" TEXT,
    "estimatedDelivery" DATETIME,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "giftMessage" TEXT,
    "giftRecipientName" TEXT,
    "giftRecipientEmail" TEXT,
    "hidePrice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("amount", "createdAt", "customerEmail", "customerName", "deliveredAt", "estimatedDelivery", "id", "paymentMethod", "shippedAt", "shippingAddress", "shippingCarrier", "shippingStatus", "status", "stripeSessionId", "trackingNumber", "updatedAt", "userId") SELECT "amount", "createdAt", "customerEmail", "customerName", "deliveredAt", "estimatedDelivery", "id", "paymentMethod", "shippedAt", "shippingAddress", "shippingCarrier", "shippingStatus", "status", "stripeSessionId", "trackingNumber", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_shippingStatus_idx" ON "Order"("shippingStatus");
CREATE INDEX "Order_isGift_idx" ON "Order"("isGift");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "salePrice" REAL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Uncategorized',
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "subtitle" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hasVariants" BOOLEAN NOT NULL DEFAULT false,
    "brandId" TEXT,
    "isPlasticFree" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isCrueltyFree" BOOLEAN NOT NULL DEFAULT false,
    "isOrganicCertified" BOOLEAN NOT NULL DEFAULT false,
    "carbonFootprintGrams" INTEGER,
    "isImperfect" BOOLEAN NOT NULL DEFAULT false,
    "imperfectReason" TEXT,
    "imperfectDiscount" INTEGER,
    "isSubscribable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("category", "createdAt", "description", "featured", "hasVariants", "id", "image", "inventory", "price", "salePrice", "subtitle", "title", "updatedAt") SELECT "category", "createdAt", "description", "featured", "hasVariants", "id", "image", "inventory", "price", "salePrice", "subtitle", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_category_featured_idx" ON "Product"("category", "featured");
CREATE INDEX "Product_featured_idx" ON "Product"("featured");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt" DESC);
CREATE INDEX "Product_isPlasticFree_idx" ON "Product"("isPlasticFree");
CREATE INDEX "Product_isVegan_idx" ON "Product"("isVegan");
CREATE INDEX "Product_isCrueltyFree_idx" ON "Product"("isCrueltyFree");
CREATE INDEX "Product_isOrganicCertified_idx" ON "Product"("isOrganicCertified");
CREATE INDEX "Product_isImperfect_idx" ON "Product"("isImperfect");
CREATE INDEX "Product_isSubscribable_idx" ON "Product"("isSubscribable");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE TABLE "new_ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "size" TEXT,
    "color" TEXT,
    "colorCode" TEXT,
    "material" TEXT,
    "price" REAL,
    "salePrice" REAL,
    "image" TEXT,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isImperfect" BOOLEAN NOT NULL DEFAULT false,
    "imperfectReason" TEXT,
    "imperfectDiscount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductVariant" ("color", "colorCode", "createdAt", "id", "image", "inventory", "isDefault", "material", "price", "productId", "salePrice", "size", "sku", "sortOrder", "updatedAt") SELECT "color", "colorCode", "createdAt", "id", "image", "inventory", "isDefault", "material", "price", "productId", "salePrice", "size", "sku", "sortOrder", "updatedAt" FROM "ProductVariant";
DROP TABLE "ProductVariant";
ALTER TABLE "new_ProductVariant" RENAME TO "ProductVariant";
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_productId_isDefault_idx" ON "ProductVariant"("productId", "isDefault");
CREATE INDEX "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder");
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");
CREATE TABLE "new_SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "wishlistId" TEXT,
    "note" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedItem" ("addedAt", "createdAt", "id", "note", "productId", "updatedAt", "userId", "wishlistId") SELECT "addedAt", "createdAt", "id", "note", "productId", "updatedAt", "userId", "wishlistId" FROM "SavedItem";
DROP TABLE "SavedItem";
ALTER TABLE "new_SavedItem" RENAME TO "SavedItem";
CREATE INDEX "SavedItem_userId_idx" ON "SavedItem"("userId");
CREATE INDEX "SavedItem_productId_idx" ON "SavedItem"("productId");
CREATE INDEX "SavedItem_wishlistId_idx" ON "SavedItem"("wishlistId");
CREATE INDEX "SavedItem_userId_savedAt_idx" ON "SavedItem"("userId", "savedAt" DESC);
CREATE INDEX "SavedItem_userId_addedAt_idx" ON "SavedItem"("userId", "addedAt" DESC);
CREATE UNIQUE INDEX "SavedItem_userId_productId_wishlistId_key" ON "SavedItem"("userId", "productId", "wishlistId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "loyaltyTier" TEXT NOT NULL DEFAULT 'SEEDLING',
    "totalLifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SustainabilityCertification_name_key" ON "SustainabilityCertification"("name");

-- CreateIndex
CREATE INDEX "SustainabilityCertification_isActive_idx" ON "SustainabilityCertification"("isActive");

-- CreateIndex
CREATE INDEX "SustainabilityCertification_sortOrder_idx" ON "SustainabilityCertification"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductCertification_productId_idx" ON "ProductCertification"("productId");

-- CreateIndex
CREATE INDEX "ProductCertification_certificationId_idx" ON "ProductCertification"("certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCertification_productId_certificationId_key" ON "ProductCertification"("productId", "certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonOffset_orderId_key" ON "CarbonOffset"("orderId");

-- CreateIndex
CREATE INDEX "CarbonOffset_orderId_idx" ON "CarbonOffset"("orderId");

-- CreateIndex
CREATE INDEX "CarbonOffset_provider_idx" ON "CarbonOffset"("provider");

-- CreateIndex
CREATE INDEX "CarbonOffset_purchasedAt_idx" ON "CarbonOffset"("purchasedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ImpactMetric_name_key" ON "ImpactMetric"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactMetric_slug_key" ON "ImpactMetric"("slug");

-- CreateIndex
CREATE INDEX "ImpactMetric_isActive_sortOrder_idx" ON "ImpactMetric"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ImpactMetric_slug_idx" ON "ImpactMetric"("slug");

-- CreateIndex
CREATE INDEX "ProductImpact_productId_idx" ON "ProductImpact"("productId");

-- CreateIndex
CREATE INDEX "ProductImpact_metricId_idx" ON "ProductImpact"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImpact_productId_metricId_key" ON "ProductImpact"("productId", "metricId");

-- CreateIndex
CREATE INDEX "UserImpact_userId_idx" ON "UserImpact"("userId");

-- CreateIndex
CREATE INDEX "UserImpact_metricId_idx" ON "UserImpact"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "UserImpact_userId_metricId_key" ON "UserImpact"("userId", "metricId");

-- CreateIndex
CREATE INDEX "OrderImpact_orderId_idx" ON "OrderImpact"("orderId");

-- CreateIndex
CREATE INDEX "OrderImpact_metricId_idx" ON "OrderImpact"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderImpact_orderId_metricId_key" ON "OrderImpact"("orderId", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "Bundle_isActive_idx" ON "Bundle"("isActive");

-- CreateIndex
CREATE INDEX "Bundle_category_idx" ON "Bundle"("category");

-- CreateIndex
CREATE INDEX "Bundle_slug_idx" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "BundleProduct_bundleId_idx" ON "BundleProduct"("bundleId");

-- CreateIndex
CREATE INDEX "BundleProduct_productId_idx" ON "BundleProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleProduct_bundleId_productId_key" ON "BundleProduct"("bundleId", "productId");

-- CreateIndex
CREATE INDEX "BundleSelection_bundleId_idx" ON "BundleSelection"("bundleId");

-- CreateIndex
CREATE INDEX "BundleSelection_userId_idx" ON "BundleSelection"("userId");

-- CreateIndex
CREATE INDEX "BundleSelection_sessionId_idx" ON "BundleSelection"("sessionId");

-- CreateIndex
CREATE INDEX "ImperfectBatch_productId_idx" ON "ImperfectBatch"("productId");

-- CreateIndex
CREATE INDEX "ImperfectBatch_isActive_idx" ON "ImperfectBatch"("isActive");

-- CreateIndex
CREATE INDEX "ImperfectBatch_productId_isActive_idx" ON "ImperfectBatch"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_visibleId_key" ON "QuizQuestion"("visibleId");

-- CreateIndex
CREATE INDEX "QuizQuestion_isActive_orderIndex_idx" ON "QuizQuestion"("isActive", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "QuizResponse_visibleId_key" ON "QuizResponse"("visibleId");

-- CreateIndex
CREATE INDEX "QuizResponse_sessionId_idx" ON "QuizResponse"("sessionId");

-- CreateIndex
CREATE INDEX "QuizResponse_userId_idx" ON "QuizResponse"("userId");

-- CreateIndex
CREATE INDEX "QuizResponse_visibleId_idx" ON "QuizResponse"("visibleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductValue_name_key" ON "ProductValue"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductValue_slug_key" ON "ProductValue"("slug");

-- CreateIndex
CREATE INDEX "ProductValue_sortOrder_idx" ON "ProductValue"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductValueAssignment_productId_idx" ON "ProductValueAssignment"("productId");

-- CreateIndex
CREATE INDEX "ProductValueAssignment_valueId_idx" ON "ProductValueAssignment"("valueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductValueAssignment_productId_valueId_key" ON "ProductValueAssignment"("productId", "valueId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_visibleId_key" ON "Subscription"("visibleId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_nextDeliveryDate_idx" ON "Subscription"("nextDeliveryDate");

-- CreateIndex
CREATE INDEX "SubscriptionItem_subscriptionId_idx" ON "SubscriptionItem"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_productId_idx" ON "SubscriptionItem"("productId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_variantId_idx" ON "SubscriptionItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionItem_subscriptionId_productId_variantId_key" ON "SubscriptionItem"("subscriptionId", "productId", "variantId");

-- CreateIndex
CREATE INDEX "SubscriptionPause_subscriptionId_idx" ON "SubscriptionPause"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPause_subscriptionId_resumedAt_idx" ON "SubscriptionPause"("subscriptionId", "resumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_featured_idx" ON "Brand"("featured");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE INDEX "Brand_isActive_sortOrder_idx" ON "Brand"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Brand_isActive_featured_idx" ON "Brand"("isActive", "featured");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_userId_idx" ON "LoyaltyPoints"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_userId_expiresAt_idx" ON "LoyaltyPoints"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_source_idx" ON "LoyaltyPoints"("source");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_orderId_idx" ON "LoyaltyPoints"("orderId");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_earnedAt_idx" ON "LoyaltyPoints"("earnedAt");

-- CreateIndex
CREATE INDEX "LoyaltyRedemption_userId_idx" ON "LoyaltyRedemption"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyRedemption_orderId_idx" ON "LoyaltyRedemption"("orderId");

-- CreateIndex
CREATE INDEX "LoyaltyRedemption_status_idx" ON "LoyaltyRedemption"("status");

-- CreateIndex
CREATE INDEX "LoyaltyRedemption_redeemedAt_idx" ON "LoyaltyRedemption"("redeemedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_ownerId_idx" ON "ReferralCode"("ownerId");

-- CreateIndex
CREATE INDEX "ReferralCode_isActive_idx" ON "ReferralCode"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_refereeId_idx" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referralCodeId_idx" ON "Referral"("referralCodeId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_code_idx" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_purchaserId_idx" ON "GiftCard"("purchaserId");

-- CreateIndex
CREATE INDEX "GiftCard_recipientEmail_idx" ON "GiftCard"("recipientEmail");

-- CreateIndex
CREATE INDEX "GiftCard_status_idx" ON "GiftCard"("status");

-- CreateIndex
CREATE INDEX "GiftCard_expiresAt_idx" ON "GiftCard"("expiresAt");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_orderId_idx" ON "GiftCardTransaction"("orderId");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_type_idx" ON "GiftCardTransaction"("type");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_createdAt_idx" ON "GiftCardTransaction"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TerraCycleSubmission_visibleId_key" ON "TerraCycleSubmission"("visibleId");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_userId_idx" ON "TerraCycleSubmission"("userId");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_status_idx" ON "TerraCycleSubmission"("status");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_userId_status_idx" ON "TerraCycleSubmission"("userId", "status");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_visibleId_idx" ON "TerraCycleSubmission"("visibleId");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_trackingNumber_idx" ON "TerraCycleSubmission"("trackingNumber");

-- CreateIndex
CREATE INDEX "TerraCycleSubmission_labelRequestedAt_idx" ON "TerraCycleSubmission"("labelRequestedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TerraCycleStats_userId_key" ON "TerraCycleStats"("userId");

-- CreateIndex
CREATE INDEX "TerraCycleStats_userId_idx" ON "TerraCycleStats"("userId");

-- CreateIndex
CREATE INDEX "TerraCycleStats_totalItemsRecycled_idx" ON "TerraCycleStats"("totalItemsRecycled" DESC);

-- CreateIndex
CREATE INDEX "TerraCycleStats_totalWeightKg_idx" ON "TerraCycleStats"("totalWeightKg" DESC);
