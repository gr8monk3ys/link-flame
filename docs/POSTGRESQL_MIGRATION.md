# PostgreSQL Migration Guide

This guide walks you through migrating Link Flame from SQLite (development) to PostgreSQL (production).

## Table of Contents
- [Why PostgreSQL?](#why-postgresql)
- [Prerequisites](#prerequisites)
- [Migration Steps](#migration-steps)
- [Connection Pooling](#connection-pooling)
- [Environment Configuration](#environment-configuration)
- [Testing Checklist](#testing-checklist)
- [Rollback Plan](#rollback-plan)
- [Common Issues](#common-issues)

---

## Why PostgreSQL?

### SQLite Limitations (Development Only)
- **Concurrent writes**: SQLite locks the entire database for writes
- **Scalability**: Not suitable for high-traffic production environments
- **Features**: Limited full-text search, no stored procedures
- **Hosting**: Most production platforms don't support SQLite file storage

### PostgreSQL Benefits (Production Ready)
- **Concurrent access**: Multi-version concurrency control (MVCC)
- **Performance**: Better query optimization, indexing, and caching
- **Features**: Full-text search, JSON support, advanced data types
- **Reliability**: ACID compliance, replication, point-in-time recovery
- **Ecosystem**: Wide support across hosting platforms

---

## Prerequisites

### 1. PostgreSQL Database
Choose a managed PostgreSQL provider:

**Recommended Providers:**
- **Vercel Postgres** (integrated with Vercel deployment)
- **Supabase** (free tier available, excellent dashboard)
- **Railway** (easy setup, automatic backups)
- **Neon** (serverless, auto-scaling)
- **AWS RDS** (enterprise-grade)

### 2. Connection Pooling (Required)
PostgreSQL connections are expensive. Use one of:
- **Prisma Accelerate** (recommended, built-in pooling + caching)
- **PgBouncer** (self-hosted or via provider)
- **Supabase Pooler** (if using Supabase)

### 3. Backup Current Data
```bash
# Export SQLite data to JSON
npx prisma db seed # Ensure seed script is current
# Or manually export important data
```

---

## Migration Steps

### Step 1: Update Database Provider

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
  // Optional: Use connection pooling URL
  directUrl = env("DIRECT_DATABASE_URL")
}
```

### Step 2: Schema Adjustments

PostgreSQL requires some schema changes from SQLite:

#### A. Auto-increment IDs
SQLite uses `autoincrement()`, PostgreSQL uses `autoincrement()` (same in Prisma).
No changes needed if using `@default(autoincrement())`.

#### B. DateTime Defaults
```prisma
// SQLite style (works but not optimal)
createdAt DateTime @default(now())

// PostgreSQL optimal (same syntax, better performance)
createdAt DateTime @default(now())
```

#### C. Text Fields
PostgreSQL distinguishes between VARCHAR and TEXT:
```prisma
// For short strings (use default)
email     String  // becomes VARCHAR(255)

// For long text (explicit)
content   String  @db.Text  // becomes TEXT

// For very long text
description String @db.Text
```

#### D. Case-Sensitive Searches
PostgreSQL is case-sensitive by default. Update queries:
```typescript
// Before (SQLite)
where: { email: userEmail }

// After (PostgreSQL - case insensitive)
where: { email: { equals: userEmail, mode: 'insensitive' } }
```

#### E. JSON Fields (Optional Enhancement)
PostgreSQL has native JSON support:
```prisma
// If you want to store JSON data
metadata Json?  // Becomes JSONB in PostgreSQL
```

### Step 3: Environment Variables

Update `.env` and `.env.production`:

```bash
# PostgreSQL Connection (from your provider)
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public&sslmode=require"

# Optional: Direct connection for migrations (bypasses pooling)
DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database?schema=public&sslmode=require"

# Keep other variables
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_live_..."
# etc.
```

**Connection String Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA&sslmode=require
```

**Common Ports:**
- PostgreSQL: `5432` (default)
- Supabase: `5432` (use pooler port `6543` for pooling)

### Step 4: Install Dependencies

```bash
# Reinstall Prisma Client for PostgreSQL
npm install

# Generate new Prisma Client
npx prisma generate
```

### Step 5: Create Database Schema

```bash
# Push schema to PostgreSQL (creates tables)
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate dev --name init_postgresql

# The migration creates:
# - All tables
# - Indexes
# - Foreign key constraints
# - Unique constraints
```

### Step 6: Seed Data

```bash
# Run seed script to populate initial data
npx prisma db seed

# Verify data
npx prisma studio
```

### Step 7: Test Locally

```bash
# Start dev server with PostgreSQL
npm run dev

# Test critical flows:
# - Authentication (signup, signin)
# - Cart operations (add, update, delete)
# - Checkout process
# - Order creation
# - Blog posts
# - Product listing and search
```

### Step 8: Update Code (If Needed)

Search for SQLite-specific code:

```bash
# Search for potential issues
grep -r "SQLITE" .
grep -r "sqlite" app/ lib/ components/

# Common fixes needed:
# 1. Case-insensitive email lookups
# 2. Full-text search (use PostgreSQL's built-in FTS)
# 3. Date formatting (PostgreSQL is stricter)
```

**Example: Case-Insensitive Email**

```typescript
// Before (SQLite)
const user = await prisma.user.findUnique({
  where: { email: email }
});

// After (PostgreSQL)
const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() }  // Store emails in lowercase
});
// Or use case-insensitive mode in queries
const user = await prisma.user.findFirst({
  where: { email: { equals: email, mode: 'insensitive' } }
});
```

---

## Connection Pooling

### Why Connection Pooling?

PostgreSQL connections are expensive:
- Each connection = separate OS process (~10MB RAM)
- Serverless functions create many connections
- Without pooling, you'll hit connection limits quickly

### Option 1: Prisma Accelerate (Recommended)

**Benefits:**
- Built-in connection pooling + global caching
- No infrastructure to manage
- Works with any PostgreSQL provider

**Setup:**
```bash
# Sign up at https://www.prisma.io/data-platform
# Get your Accelerate connection string

# Update .env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"
DIRECT_DATABASE_URL="postgresql://..." # Your actual DB URL
```

**Pricing:**
- Free tier: 1GB data transfer, 10M queries/month
- Pro: $29/month for production apps

### Option 2: Supabase Pooler

If using Supabase:
```bash
# Transaction mode (recommended for Prisma)
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.compute.supabase.com:5432/postgres"
```

### Option 3: PgBouncer (Self-Hosted)

For custom deployments:
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25

# Update DATABASE_URL to use PgBouncer port
DATABASE_URL="postgresql://user:pass@localhost:6432/mydb"
```

---

## Environment Configuration

### Local Development (.env.local)
```bash
DATABASE_URL="postgresql://localhost:5432/linkflame_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
```

### Staging (.env.staging)
```bash
DATABASE_URL="postgresql://user:pass@staging-db.provider.com:5432/linkflame_staging"
NEXTAUTH_URL="https://staging.linkflame.com"
NEXTAUTH_SECRET="staging-secret"
```

### Production (.env.production)
```bash
# Use pooled connection for app
DATABASE_URL="prisma://accelerate..." # or pooler URL

# Direct connection for migrations only
DIRECT_DATABASE_URL="postgresql://user:pass@prod-db.provider.com:5432/linkflame_prod"

NEXTAUTH_URL="https://linkflame.com"
NEXTAUTH_SECRET="strong-random-secret"
```

---

## Testing Checklist

### Before Migration
- [ ] Export critical data from SQLite
- [ ] Document current database size
- [ ] List all active users/orders for verification
- [ ] Test backup/restore process

### After Migration
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Verify data integrity:
  ```bash
  # Check record counts
  npx prisma studio

  # Compare counts
  SELECT COUNT(*) FROM "User";
  SELECT COUNT(*) FROM "Product";
  SELECT COUNT(*) FROM "Order";
  SELECT COUNT(*) FROM "BlogPost";
  ```

### Manual Testing
- [ ] **Authentication**
  - Sign up new user
  - Sign in existing user
  - Password reset flow
  - Protected route access

- [ ] **E-commerce**
  - Browse products
  - Add to cart (guest and authenticated)
  - Update cart quantities
  - Checkout process
  - Order confirmation email
  - View order history

- [ ] **Blog**
  - List blog posts
  - View individual post
  - Search functionality
  - Category filtering

- [ ] **Performance**
  - Page load times (< 2s)
  - API response times (< 500ms)
  - Database query performance
  - Connection pool metrics

---

## Rollback Plan

If migration fails, here's how to rollback:

### Step 1: Revert Schema
```bash
# Switch back to SQLite in schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# Update .env
DATABASE_URL="file:./dev.db"

# Regenerate client
npx prisma generate
```

### Step 2: Restore Data
```bash
# If you have SQLite backup
cp backup.db prisma/dev.db

# Or re-seed
npx prisma db push
npx prisma db seed
```

### Step 3: Redeploy
```bash
# Redeploy previous version
git revert <migration-commit>
git push origin main
```

---

## Common Issues

### Issue 1: Connection Limit Exceeded
**Error:** `remaining connection slots reserved for non-replication superuser connections`

**Solution:**
- Implement connection pooling (see above)
- Reduce `connection_limit` in Prisma schema
- Upgrade database plan for more connections

### Issue 2: SSL Required
**Error:** `no pg_hba.conf entry for host`

**Solution:**
```bash
# Add SSL mode to connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

### Issue 3: Slow Queries
**Error:** Queries take > 1s

**Solution:**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_product_category ON "Product"("category");
CREATE INDEX idx_order_userid ON "Order"("userId");
CREATE INDEX idx_blogpost_slug ON "BlogPost"("slug");

-- Or use Prisma schema
@@index([category])
@@index([userId])
```

### Issue 4: Case-Sensitive Email Issues
**Error:** User can't login with email

**Solution:**
```typescript
// Always lowercase emails on signup/signin
const email = formData.email.toLowerCase();

// Or use case-insensitive queries
where: { email: { equals: email, mode: 'insensitive' } }
```

### Issue 5: Migration Fails
**Error:** `Migration failed to apply`

**Solution:**
```bash
# Reset database (development only!)
npx prisma migrate reset

# Or manually fix
npx prisma migrate resolve --applied <migration-name>
npx prisma migrate deploy
```

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] PostgreSQL database provisioned
- [ ] Connection pooling configured
- [ ] Environment variables set in hosting platform
- [ ] Database migration tested in staging
- [ ] Backup strategy in place
- [ ] Monitoring setup (database metrics, error tracking)

### Deployment Steps (Vercel Example)
```bash
# 1. Add environment variables in Vercel dashboard
DATABASE_URL="prisma://accelerate..."
DIRECT_DATABASE_URL="postgresql://..."

# 2. Add build command to run migrations
# package.json
"scripts": {
  "build": "prisma generate && prisma migrate deploy && next build"
}

# 3. Deploy
vercel --prod

# 4. Verify migration
vercel logs --prod | grep "prisma migrate"
```

### Post-Deployment Monitoring
```bash
# Check database connections
# In PostgreSQL dashboard or via SQL:
SELECT count(*) FROM pg_stat_activity;

# Monitor slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Performance Optimization

### 1. Indexes
Add indexes for frequently queried fields:
```prisma
model Product {
  id       Int    @id @default(autoincrement())
  name     String
  category String
  price    Float

  @@index([category])      // Product filtering
  @@index([price])         // Price range queries
  @@index([name])          // Search
}

model Order {
  id        Int      @id @default(autoincrement())
  userId    Int
  createdAt DateTime @default(now())

  @@index([userId])        // User's orders
  @@index([createdAt])     // Recent orders
}
```

### 2. Query Optimization
```typescript
// Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
  // Don't fetch password hash
});

// Use include sparingly
const orders = await prisma.order.findMany({
  include: {
    items: { include: { product: true } }
  },
  take: 10  // Limit results
});
```

### 3. Caching
Already implemented in `lib/cache.ts` using Upstash Redis:
```typescript
// Cache product catalog
const products = await getOrSetCached(
  CacheKeys.PRODUCTS,
  () => prisma.product.findMany(),
  CacheTTL.LONG
);
```

---

## Support

### Resources
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

### Troubleshooting
If you encounter issues during migration:
1. Check database connection: `npx prisma db pull`
2. Verify environment variables: `echo $DATABASE_URL`
3. Review migration logs: `npx prisma migrate status`
4. Test connection: `npx prisma studio`

---

**Migration completed successfully? Update TODO.md and deploy to production!** 🚀
