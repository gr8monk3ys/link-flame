# Deployment Guide

This guide covers deploying Link Flame to production environments including Vercel, Railway, and Docker.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#option-1-vercel-recommended)
  - [Railway](#option-2-railway)
  - [Docker](#option-3-docker)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production:

### Code Readiness
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] Git working directory is clean

### Database
- [ ] PostgreSQL database provisioned (see [POSTGRESQL_MIGRATION.md](./POSTGRESQL_MIGRATION.md))
- [ ] Connection pooling configured (Prisma Accelerate/Supabase/PgBouncer)
- [ ] Backup strategy in place
- [ ] Migrations tested in staging

### External Services
- [ ] Stripe account set up (production mode)
- [ ] Stripe webhook endpoint configured
- [ ] Upstash Redis provisioned (for caching & rate limiting)
- [ ] Resend account set up (for emails)

### Security
- [ ] Strong `NEXTAUTH_SECRET` generated (32+ characters)
- [ ] All API keys rotated from development
- [ ] CORS configuration reviewed
- [ ] Security headers configured

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
# Optional: Direct connection for migrations (if using pooling)
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-strong-random-secret-at-least-32-chars"

# Stripe (Production Keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Upstash Redis (Required for rate limiting & caching)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Resend (Email service)
RESEND_API_KEY="re_..."
```

### Optional Variables

```bash
# Node Environment
NODE_ENV="production"

# Analytics (if using)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### 1. Provision PostgreSQL

Choose a provider:
- **Vercel Postgres** (Vercel deployments)
- **Supabase** (Free tier available)
- **Railway** (Easy setup)
- **Neon** (Serverless PostgreSQL)
- **AWS RDS** (Enterprise)

### 2. Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### 3. Seed Initial Data (Optional)

```bash
npx prisma db seed
```

See [POSTGRESQL_MIGRATION.md](./POSTGRESQL_MIGRATION.md) for detailed database setup.

---

## Deployment Options

## Option 1: Vercel (Recommended)

### Why Vercel?
- Zero-config Next.js deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Preview deployments for PRs
- Vercel Postgres integration

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)

### Deployment Steps

#### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

#### 2. Connect Repository

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

**Option B: Via CLI**
```bash
vercel login
vercel
```

#### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables (see [Environment Variables](#environment-variables))
3. Set for Production, Preview, and Development

#### 4. Configure Build Settings

Add to project settings:
- **Build Command**: `prisma generate && prisma migrate deploy && next build`
- **Install Command**: `npm ci`

Or add `vercel.json`:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

#### 5. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

### Vercel Postgres (Optional)

```bash
# Create Vercel Postgres database
vercel postgres create

# Link to project
vercel link
vercel env pull

# DATABASE_URL is automatically set
```

### Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS (Vercel provides instructions)

---

## Option 2: Railway

### Why Railway?
- Simple deployment
- Built-in PostgreSQL
- Automatic HTTPS
- Great for monorepos
- One-click deploys

### Prerequisites
- GitHub account
- Railway account

### Deployment Steps

#### 1. Create Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

#### 2. Add PostgreSQL

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway automatically sets `DATABASE_URL`

#### 3. Configure Environment Variables

1. Click on your service
2. Go to "Variables" tab
3. Add all required variables

Railway provides these automatically:
- `DATABASE_URL` (from PostgreSQL service)
- `RAILWAY_STATIC_URL` (your app URL)

Set `NEXTAUTH_URL` to: `https://${{RAILWAY_STATIC_URL}}`

#### 4. Configure Build

Add `railway.json` (optional):
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Or use Dockerfile (see Docker section).

#### 5. Deploy

Railway auto-deploys on push to main branch.

Manual deploy:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Custom Domain

1. Go to Settings → Domains
2. Click "Generate Domain" or add custom domain
3. Update `NEXTAUTH_URL` to match

---

## Option 3: Docker

### Why Docker?
- Platform-agnostic
- Reproducible builds
- Self-hosted deployment
- Full control

### Prerequisites
- Docker installed
- Docker Compose (for local testing)

### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Update `next.config.js`:
```javascript
const nextConfig = {
  // ... existing config
  output: 'standalone',  // Required for Docker
};
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - RESEND_API_KEY=${RESEND_API_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=linkflame
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_DB=linkflame
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t link-flame:latest .

# Run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

### Deploy to Production

#### DigitalOcean App Platform
```bash
# Create app.yaml
name: link-flame
services:
  - name: web
    dockerfile_path: Dockerfile
    github:
      repo: yourusername/link-flame
      branch: main
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      # ... other env vars
    http_port: 3000
databases:
  - name: db
    engine: PG
    version: "16"
```

#### AWS ECS/Fargate
1. Push image to ECR
2. Create ECS task definition
3. Configure service with load balancer
4. Set environment variables in task definition

#### Self-Hosted
```bash
# On your server
git clone https://github.com/yourusername/link-flame.git
cd link-flame

# Create .env file
cp .env.example .env
# Edit .env with production values

# Build and run
docker-compose up -d

# Set up Nginx reverse proxy (recommended)
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health (create /api/health endpoint if needed)
curl https://yourdomain.com/api/health

# Check pages load
curl -I https://yourdomain.com

# Test admin access
curl -I https://yourdomain.com/admin
```

### 2. Configure Stripe Webhooks

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test Critical Flows

- [ ] User signup and signin
- [ ] Add product to cart
- [ ] Checkout process (test mode)
- [ ] Order confirmation email
- [ ] Admin dashboard access
- [ ] Blog post CMS

### 4. Set Up Monitoring

**Vercel:**
- Built-in analytics at vercel.com/dashboard
- Error tracking in deployment logs

**Railway:**
- Metrics tab shows CPU, memory, network
- Logs tab for application logs

**Self-Hosted:**
- Use PM2 for process management
- Set up log rotation
- Configure alerting (UptimeRobot, Better Uptime)

### 5. Configure Backups

**Database:**
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260113.sql
```

**Automated backups:**
- Vercel Postgres: Automatic backups
- Supabase: Point-in-time recovery
- Railway: Daily backups (paid plans)
- AWS RDS: Automated backups

### 6. Set Up CI/CD (Optional)

See [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)

---

## Troubleshooting

### Build Fails

**Error: "Prisma Client not generated"**
```bash
# Add to build command
prisma generate && next build
```

**Error: "Cannot find module '@prisma/client'"**
```bash
# Ensure postinstall runs
npm run postinstall
```

### Database Connection Issues

**Error: "Connection timeout"**
- Check `DATABASE_URL` is correct
- Verify firewall allows connections
- Test with `psql $DATABASE_URL`

**Error: "SSL required"**
```bash
# Add to DATABASE_URL
?sslmode=require
```

### Stripe Webhook Issues

**Error: "No signatures found matching the expected signature"**
- Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret
- Check webhook payload is not modified (no middleware)

**Webhooks not received:**
- Check webhook URL is accessible publicly
- Verify HTTPS is configured
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

### Rate Limiting Not Working

**Redis connection fails:**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check Upstash Redis is not paused
- Rate limiting gracefully degrades without Redis

### Images Not Loading

**Error: "Invalid src prop"**
- Check image URLs are accessible
- Verify Next.js Image domains are configured
- Add to `next.config.js`:
  ```javascript
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  }
  ```

### Admin Dashboard 403

**Error: "AccessDenied"**
- User must have `role: 'ADMIN'` in database
- Update user role:
  ```sql
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@linkflame.com';
  ```

---

## Environment Variable Checklist

Copy this checklist for each deployment:

```
Deployment: [Production/Staging]
Date: [YYYY-MM-DD]

Core:
[ ] DATABASE_URL
[ ] NEXTAUTH_URL
[ ] NEXTAUTH_SECRET

Stripe:
[ ] STRIPE_SECRET_KEY (sk_live_...)
[ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)
[ ] STRIPE_WEBHOOK_SECRET (whsec_...)

Redis:
[ ] UPSTASH_REDIS_REST_URL
[ ] UPSTASH_REDIS_REST_TOKEN

Email:
[ ] RESEND_API_KEY

Optional:
[ ] DIRECT_DATABASE_URL (if using connection pooling)
[ ] NODE_ENV=production
[ ] Custom domain configured
[ ] SSL certificate valid
[ ] Webhooks configured
[ ] Backups scheduled
```

---

## Performance Optimization

### CDN Configuration

**Vercel:** Automatic global CDN

**Cloudflare (for other hosts):**
1. Point DNS to Cloudflare
2. Set SSL/TLS to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Configure caching rules

### Image Optimization

**Vercel:** Built-in image optimization

**Self-hosted:** Install sharp
```bash
npm install sharp
```

### Caching Headers

Already configured in `next.config.js`:
- Static assets: 1 year
- API responses: 1 hour with stale-while-revalidate

---

## Rollback Plan

### Vercel
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Railway
1. Go to Deployments
2. Click on previous deployment
3. Click "Redeploy"

### Docker
```bash
# Tag current version
docker tag link-flame:latest link-flame:v1.0.0

# Rollback
docker-compose down
docker pull link-flame:v0.9.0
docker tag link-flame:v0.9.0 link-flame:latest
docker-compose up -d
```

---

## Support

- **Documentation**: [README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/link-flame/issues)
- **Email**: support@linkflame.com

---

**Last Updated:** January 13, 2026
