# 🌱 Link Flame - E-commerce & Blog Platform

A Next.js 15 full-stack application demonstrating modern web development patterns with blog management, e-commerce functionality, and user authentication.

## Project Status

**This is a demonstration/learning project** showcasing:
- Modern Next.js App Router architecture
- Stripe payment integration
- Clerk authentication
- Prisma ORM with SQLite/PostgreSQL
- TypeScript throughout
- API design patterns

**Known Limitations:**
- No production deployment configuration
- Business model undefined
- Branding/naming needs refinement for production use
- No CSRF protection implemented
- No email delivery service (newsletter/contact forms store data only)

## Tech Stack

### Core
- **Next.js 15.1.1** - App Router, Server Components, API Routes
- **React 18** - UI library
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend
- **Prisma ORM** - Database modeling and migrations
- **SQLite** (dev) / **PostgreSQL** (production-ready)
- **Clerk** - Authentication and user management
- **Stripe** - Payment processing and webhooks

### Infrastructure
- **Upstash Redis** - Rate limiting
- **Zod** - Runtime validation
- **DOMPurify** - XSS protection
- **Zustand** - Client-side state management

## Implemented Features

### ✅ E-commerce
- Product catalog with categories
- Shopping cart with session management
- Stripe checkout integration
- Order history and tracking
- Webhook handling for payment events

### ✅ Blog System
- Database-backed blog posts with Prisma
- Category and tag-based filtering
- Featured posts
- Author profiles with roles
- Dynamic sitemap generation
- SEO-optimized metadata

### ✅ User Management
- Clerk authentication (OAuth, email/password)
- Protected routes and API endpoints
- User-specific cart and order data
- Guest session handling with unique IDs

### ✅ Security & Performance
- Rate limiting on API endpoints
- Input validation with Zod schemas
- XSS protection with sanitization
- CSRF considerations (see TODO.md)
- Database indexing for query performance
- Error boundaries for fault tolerance

## Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **SQLite** (for local development)

### Environment Setup

1. **Clone and install:**
```bash
git clone https://github.com/gr8monk3ys/link-flame.git
cd link-flame
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Clerk Authentication (https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Stripe (https://stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Upstash Redis (https://upstash.com) - Optional for rate limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

3. **Initialize database:**
```bash
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
```

4. **Start development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Detailed Service Configuration

#### Clerk Authentication Setup

1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application
3. Navigate to **API Keys** in the dashboard
4. Copy your publishable and secret keys to `.env`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
5. Configure allowed redirect URLs in Clerk dashboard:
   - Add `http://localhost:3000` for development
   - Add your production domain for deployment

#### Stripe Payment Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get test API keys from **Developers > API Keys**:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. **Configure webhooks** (important for order processing):

   **Development (using Stripe CLI):**
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   # Copy the webhook signing secret to .env
   ```

   **Production:**
   - Go to **Developers > Webhooks** in Stripe dashboard
   - Add endpoint: `https://yourdomain.com/api/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy signing secret to production `.env`

4. **Create test products** (optional):
   - Stripe dashboard > **Products**
   - Or use the seeded products from `npx prisma db seed`

#### Upstash Redis (Optional - for Rate Limiting)

1. Create account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token to `.env`:
   ```env
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. If not configured, rate limiting will be disabled (development only)

### Database Commands
```bash
npx prisma studio           # Open database GUI
npx prisma migrate dev      # Create and apply migrations
npx prisma generate         # Regenerate Prisma Client
npx prisma db push          # Push schema changes (dev only)
```

## Project Structure

```
link-flame/
├── app/                    # Next.js 13 app directory
│   ├── blogs/             # Blog posts and listings
│   ├── eco-living/        # Sustainable living guides
│   ├── community/         # Community features
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions and data
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Architecture Overview

### Directory Structure
```
app/
├── api/                    # API routes
│   ├── blog/              # Blog CRUD (partially implemented)
│   ├── cart/              # Shopping cart operations
│   ├── checkout/          # Stripe checkout sessions
│   ├── contact/           # Contact form submissions
│   ├── newsletter/        # Newsletter subscriptions
│   ├── orders/            # Order history endpoints
│   └── webhook/           # Stripe webhook handler
├── account/               # User account pages
├── blogs/                 # Blog listing and posts
├── cart/                  # Shopping cart page
├── checkout/              # Checkout flow
├── contact/               # Contact form page
├── products/              # Product catalog
└── layout.tsx             # Root layout (providers, auth)

components/
├── blogs/                 # Blog-specific components
├── cart/                  # Cart UI components
├── checkout/              # Checkout components
├── layout/                # Header, footer, error boundary
├── shared/                # Reusable components
└── ui/                    # Radix UI wrappers

lib/
├── api-response.ts        # Standardized API responses
├── auth.ts                # Auth helpers
├── blog.ts                # Blog data fetching
├── cart.ts                # Cart utilities
├── prisma.ts              # Prisma client singleton
├── rate-limit.ts          # Rate limiting logic
├── session.ts             # Guest session management
└── utils/                 # General utilities

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts                # Sample data seeder

types/
├── blog.ts                # Blog-related types
├── cart.ts                # Cart types
├── contact.ts             # Contact form types
├── newsletter.ts          # Newsletter types
├── order.ts               # Order and OrderItem types
├── product.ts             # Product types
└── index.ts               # Central type exports
```

## Contributing

This project welcomes contributions that address items in [TODO.md](./TODO.md). **Current progress: 45/53 tasks complete (85%)**

**High Priority:**
1. Add CSRF protection to API routes
2. Fix product type definitions mismatch (TypeScript vs Prisma)
3. Optimize cart syncing efficiency

**Medium Priority:**
4. Implement wishlist feature
5. Sync saved items to database
6. Implement caching strategy

**Low Priority:**
7. Set up test infrastructure (Jest/Vitest)
8. Add comprehensive test coverage
9. Create API documentation
10. Optimize bundle size

See [TODO.md](./TODO.md) for complete task list with detailed descriptions and complexity ratings.

## License

GNU GPL 3.0
