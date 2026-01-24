-- CreateTable: Wishlist
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visibleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique indexes for Wishlist
CREATE UNIQUE INDEX "Wishlist_visibleId_key" ON "Wishlist"("visibleId");
CREATE UNIQUE INDEX "Wishlist_shareToken_key" ON "Wishlist"("shareToken");
CREATE UNIQUE INDEX "Wishlist_userId_name_key" ON "Wishlist"("userId", "name");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE INDEX "Wishlist_userId_isDefault_idx" ON "Wishlist"("userId", "isDefault");
CREATE INDEX "Wishlist_shareToken_idx" ON "Wishlist"("shareToken");

-- Create default wishlists for all existing users who have saved items
-- Note: This is a SQLite migration, we'll use a subquery to get unique userIds from SavedItem
INSERT INTO "Wishlist" ("id", "visibleId", "userId", "name", "isDefault", "isPublic", "createdAt", "updatedAt")
SELECT
    'wl_' || substr(hex(randomblob(12)), 1, 24) as id,
    'wl_' || substr(hex(randomblob(12)), 1, 24) as visibleId,
    si."userId",
    'Favorites' as name,
    1 as isDefault,
    0 as isPublic,
    CURRENT_TIMESTAMP as createdAt,
    CURRENT_TIMESTAMP as updatedAt
FROM (SELECT DISTINCT "userId" FROM "SavedItem") as si;

-- Rename old SavedItem table
ALTER TABLE "SavedItem" RENAME TO "SavedItem_old";

-- Create new SavedItem table with wishlistId
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "note" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for new SavedItem table
CREATE UNIQUE INDEX "SavedItem_wishlistId_productId_key" ON "SavedItem"("wishlistId", "productId");
CREATE INDEX "SavedItem_userId_idx" ON "SavedItem"("userId");
CREATE INDEX "SavedItem_productId_idx" ON "SavedItem"("productId");
CREATE INDEX "SavedItem_wishlistId_idx" ON "SavedItem"("wishlistId");
CREATE INDEX "SavedItem_userId_addedAt_idx" ON "SavedItem"("userId", "addedAt" DESC);

-- Migrate existing saved items to their user's default wishlist
INSERT INTO "SavedItem" ("id", "userId", "productId", "wishlistId", "note", "addedAt", "createdAt", "updatedAt")
SELECT
    so."id",
    so."userId",
    so."productId",
    w."id" as wishlistId,
    NULL as note,
    so."savedAt" as addedAt,
    so."createdAt",
    so."updatedAt"
FROM "SavedItem_old" so
JOIN "Wishlist" w ON w."userId" = so."userId" AND w."isDefault" = 1;

-- Drop old SavedItem table
DROP TABLE "SavedItem_old";
