# TODO - Link Flame

## 🔴 Critical Issues

### Documentation Inconsistencies
- [x] **Fix authentication documentation mismatch**
  - README.md incorrectly mentions Clerk authentication (lines 34, 101-103, 256-268)
  - .env.example has Clerk variables instead of NextAuth (lines 17-21)
  - Actual implementation uses NextAuth v5 with JWT strategy
  - Need to update all documentation to reflect NextAuth usage

- [x] **Add missing environment variables to .env.example**
  - `NEXTAUTH_SECRET` (required for JWT encryption)
  - `NEXTAUTH_URL` (required for callbacks)
  - Remove Clerk-related variables

- [x] **Fix CLAUDE.md line 60**
  - Currently says: "├── authentication/         # Auth pages (handled by Clerk)"
  - Should say: "├── authentication/         # Auth pages (NextAuth sign in/up/out)"

## 🟡 High Priority Features

### Security Enhancements
- [x] **Implement CSRF protection**
  - ✅ Created CSRF utility (lib/csrf.ts) with token generation/validation
  - ✅ Added /api/csrf endpoint for token distribution
  - ✅ Protected contact, newsletter, checkout, and cart APIs
  - ✅ Uses HTTP-only cookies with HMAC signatures
  - ✅ 24-hour token expiry with timing-safe comparison
  - Full implementation guide: CSRF_IMPLEMENTATION.md

- [x] **Add rate limiting to auth endpoints**
  - Rate limit /auth/signin to prevent brute force (5 req/min via strict rate limit)
  - Rate limit /auth/signup to prevent abuse (5 req/min via strict rate limit)
  - Implemented using existing checkStrictRateLimit() infrastructure

- [x] **Security audit for XSS/SQL injection**
  - Verified all user inputs are sanitized (DOMPurify with whitelist)
  - No SQL injection vulnerabilities (Prisma ORM, no raw SQL)
  - MDX blog content properly sanitized before rendering
  - Full audit report: SECURITY_AUDIT.md
  - Security rating: 9.2/10 (EXCELLENT) - Updated after CSRF implementation

- [x] **Implement security headers (CSP, HSTS, etc.)**
  - ✅ Content Security Policy (CSP) with strict directives
  - ✅ HTTP Strict Transport Security (HSTS) with preload
  - ✅ X-Frame-Options: DENY (clickjacking protection)
  - ✅ X-Content-Type-Options: nosniff
  - ✅ X-XSS-Protection: enabled
  - ✅ Referrer-Policy: strict-origin-when-cross-origin
  - ✅ Permissions-Policy: restricted access to browser features
  - Configuration: next.config.js headers()

### Testing Infrastructure
- [x] **Set up testing framework**
  - Chose Playwright for E2E testing
  - Configured playwright.config.ts with auto dev server startup
  - Added test scripts to package.json (test, test:ui, test:debug, test:headed, test:report)
  - Created tests/ directory structure

- [x] **Write E2E tests for critical flows**
  - ✅ Authentication: 9 test cases (signup, signin, signout, validation, protected routes)
  - ✅ Rate limiting: 8 test cases (signup, signin, contact, newsletter, IP-based)
  - ✅ Cart operations: 10 test cases (guest cart, authenticated cart, persistence, migration)
  - ⚠️ Checkout flow: Partial (needs Stripe test mode integration)
  - Full documentation: tests/README.md
  - Total: 27 E2E test cases

- [x] **Write unit tests for utilities**
  - ✅ Vitest configured for unit testing with happy-dom environment
  - ✅ lib/csrf.ts (15 tests): Token generation, verification, expiry, tampering, security
  - ✅ lib/api-response.ts (25 tests): Success/error responses, pagination, validation, rate limits
  - ✅ lib/rate-limit.ts (21 tests): Identifier extraction, graceful degradation, IP handling
  - ✅ Total: 61 unit tests passing
  - ✅ Separate test commands for unit (vitest) and E2E (playwright)
  - Note: lib/auth.ts and lib/session.ts depend on Next.js runtime (covered by E2E tests)

### Email Integration
- [x] **Connect email delivery service**
  - ✅ Integrated Resend for email delivery (graceful degradation if not configured)
  - ✅ Newsletter confirmation emails with welcome message
  - ✅ Contact form admin notifications and user confirmations
  - ✅ Beautiful HTML email templates with Link Flame branding
  - Configuration: .env.example updated with RESEND_API_KEY

- [x] **Order confirmation emails**
  - ✅ Sends email after successful Stripe checkout (webhook)
  - ✅ Includes order details, items, subtotal, shipping, tax, and total
  - ✅ Handles email failures gracefully (logs error, doesn't fail webhook)
  - ✅ Full itemized order details with product images and quantities

## 🟢 Medium Priority Features

### Blog System Improvements
- [x] **Resolve dual blog system**
  - ✅ Removed lib/posts.ts (mock data)
  - ✅ Now using unified lib/blog.ts with hybrid approach:
    - Server-side (SSR/build): Fetches from Prisma database
    - Client-side (browser): Fetches from /api/blog/* endpoints
  - ✅ Clean, consistent implementation throughout codebase

- [x] **Add blog search functionality**
  - ✅ Full-text search across blog posts (title, description, content)
  - ✅ Filter by category and tags with dropdown selectors
  - ✅ Dedicated search API endpoint (/api/blog/search)
  - ✅ Debounced search (300ms delay)
  - ✅ Active filter display with individual removal
  - ✅ Clear all filters button
  - ✅ Real-time search results with loading state

- [x] **Blog post SEO enhancements**
  - ✅ Open Graph metadata (type: article, images, published/modified times)
  - ✅ Twitter Card metadata (summary_large_image)
  - ✅ JSON-LD structured data (BlogPosting + BreadcrumbList schema)
  - ✅ Canonical URLs for all blog posts
  - ✅ Optimized meta descriptions with keywords
  - ✅ Author information and publisher data
  - ✅ Enhanced article layout with cover image, author card, category/tags
  - Note: Dynamic OG image generation can be added with @vercel/og package if needed

### E-commerce Features
- [x] **Product reviews and ratings**
  - ✅ Allow authenticated users to leave reviews (1-5 stars + comment)
  - ✅ Display average rating and rating distribution on product pages
  - ✅ Prevent duplicate reviews (one review per user per product)
  - ✅ Show review count and individual reviews with user info
  - ✅ Review form with star rating selector and comment textarea
  - ✅ API endpoints: GET/POST /api/products/[id]/reviews
  - ✅ Real-time review submission and refresh
  - ✅ Integrated into product detail page
  - Note: Helpful/not helpful voting can be added with additional schema fields if needed

- [x] **Wishlist/Saved items persistence**
  - ✅ Added SavedItem model to Prisma schema with unique constraint
  - ✅ Created API endpoints: GET, POST, DELETE /api/saved-items
  - ✅ Migration endpoint: POST /api/saved-items/migrate
  - ✅ Updated useSavedItems hook with database sync
  - ✅ Guest-to-user migration on login
  - ✅ Optimistic updates with error rollback
  - ✅ LocalStorage caching for offline resilience

- [x] **Inventory management**
  - ✅ Product model already has `inventory` field
  - ✅ Inventory checked at checkout (prevents ordering out-of-stock items)
  - ✅ Inventory checked when adding to cart (shows error if insufficient)
  - ✅ Inventory decremented after successful order (in webhook transaction)
  - ✅ Low stock warnings on product detail page (thresholds: 5, 2)
  - ✅ Out of stock badge and disabled "Add to Cart" on product cards
  - Note: Admin interface for inventory can be added when admin dashboard is implemented

- [x] **Product variants**
  - ✅ Added ProductVariant model with size, color, material, price overrides
  - ✅ Updated CartItem with variantId and unique constraint per product+variant
  - ✅ Updated OrderItem with denormalized variant details for historical accuracy
  - ✅ Created VariantSelector component with size/color/material options
  - ✅ Updated product detail page with variant-specific pricing, images, inventory
  - ✅ Updated cart API (GET, POST, PATCH, DELETE) for variant support
  - ✅ Updated CartProvider and cartReducer for variant matching
  - ✅ Updated checkout and webhook for variant pricing and inventory
  - ✅ Order detail page shows variant info (size/color/material)

### User Experience
- [x] **Order tracking**
  - ✅ Added shipping fields to Order model (shippingStatus, trackingNumber, carrier, dates)
  - ✅ Enhanced /api/orders endpoints with pagination, filtering, and tracking data
  - ✅ Customer-facing order history page with status filtering
  - ✅ Order detail page with shipping progress tracker
  - ✅ Tracking URL generation for major carriers (UPS, USPS, FedEx, DHL)
  - Note: Email notifications for status changes can be added when admin dashboard is implemented

- [x] **Account management improvements**
  - ✅ Profile update API (PATCH /api/account/profile) for name and email
  - ✅ Change password functionality (PATCH /api/account/password) with validation
  - ✅ Delete account feature (DELETE /api/account/delete) for GDPR compliance
  - ✅ Account settings page with tabbed UI (Profile, Security, Danger Zone)
  - ✅ Account overview page with navigation to all account sections
  - ✅ Rate limiting on sensitive operations
  - ✅ Order history with filtering (completed in Order tracking task)

## 🔵 Nice to Have

### Performance Optimizations
- [x] **Implement caching strategy**
  - ✅ Redis caching with Upstash (lib/cache.ts)
  - ✅ ISR with revalidate on API routes
  - ✅ Cache-Control headers for static assets and APIs
  - ✅ Service worker for offline support (public/sw.js)
  - ✅ Offline fallback page (/offline)

- [x] **Image optimization**
  - ✅ All images use Next.js Image component
  - ✅ Responsive image sizes with sizes attribute
  - ✅ Priority loading for above-fold images
  - ✅ Lazy loading for below-fold images
  - ✅ Image TTL increased to 24 hours

- [x] **Bundle size optimization**
  - ✅ @next/bundle-analyzer installed and configured
  - ✅ Bundle analysis script (npm run analyze)
  - ✅ Dynamic imports already in use for heavy components
  - ✅ Tree-shaking enabled by default in production

### Developer Experience
- [x] **Add API documentation**
  - ✅ Complete OpenAPI 3.0.3 specification (docs/api/openapi.yaml)
  - ✅ Swagger UI interface (/api-docs)
  - ✅ All endpoints documented with request/response examples
  - ✅ Authentication, rate limiting, and CSRF documented

- [x] **Set up CI/CD pipeline**
  - ✅ GitHub Actions CI workflow (.github/workflows/ci.yml)
  - ✅ Automated testing (unit, E2E, lint, type-check)
  - ✅ GitHub Actions deploy workflow (.github/workflows/deploy.yml)
  - ✅ Staging and production deployment support
  - ✅ Automated database migrations
  - ✅ Environment variable validation

- [x] **Database migration to PostgreSQL**
  - ✅ Comprehensive migration guide (docs/POSTGRESQL_MIGRATION.md)
  - ✅ Schema adjustments documented
  - ✅ Connection pooling options (Prisma Accelerate, Supabase, PgBouncer)
  - ✅ Step-by-step migration instructions
  - ✅ Testing checklist and rollback plan
  - ✅ Common issues and solutions

### Admin Features
- [x] **Admin dashboard**
  - ✅ Admin layout with navigation (/admin/layout.tsx)
  - ✅ Dashboard overview with analytics (/admin)
  - ✅ Order management with filtering (/admin/orders)
  - ✅ Product management with CRUD (/admin/products)
  - ✅ Blog post management (/admin/blog)
  - ✅ Role-based access control (ADMIN role required)

- [x] **Blog post CMS**
  - ✅ Create new posts with MDX editor (/admin/blog/new)
  - ✅ Edit existing posts (/admin/blog/[id]/edit)
  - ✅ Live preview toggle
  - ✅ Publish/unpublish functionality
  - ✅ Featured post toggle
  - ✅ Category and tag management
  - ✅ Cover image with preview
  - ✅ Save as draft or publish

### Community Features
- [ ] **Comments on blog posts**
  - Allow authenticated users to comment
  - Moderation system for spam
  - Email notifications for replies
  - Nested/threaded comments

- [ ] **Social sharing**
  - Share buttons for blog posts
  - Share cart/products
  - Social meta tags optimization

## 📝 Documentation
- [x] **Create SECURITY.md**
  - ✅ Documented security practices (CSRF, rate limiting, auth, headers)
  - ✅ Listed known limitations (SQLite, JWT sessions, file uploads, etc.)
  - ✅ Provided vulnerability reporting process
  - ✅ Included security checklist for deployment

- [x] **Create CONTRIBUTING.md**
  - ✅ Development setup instructions (prerequisites, database, env vars)
  - ✅ Code style guide (TypeScript, React, API routes, naming conventions)
  - ✅ PR process and requirements (checklist, templates, review process)
  - ✅ Testing requirements (unit tests, E2E tests, coverage goals)
  - ✅ Commit message guidelines (Conventional Commits)

- [x] **Create deployment guide**
  - ✅ Environment setup for production (all required variables)
  - ✅ Database migration process (PostgreSQL setup and migrations)
  - ✅ Vercel deployment instructions (dashboard + CLI)
  - ✅ Railway deployment instructions (with PostgreSQL)
  - ✅ Docker deployment instructions (Dockerfile + docker-compose)
  - ✅ Environment variable checklist
  - ✅ Post-deployment verification steps

- [x] **API documentation**
  - ✅ OpenAPI/Swagger specification (docs/api/openapi.yaml)
  - ✅ Interactive Swagger UI at /api-docs
  - ✅ Authentication flow documentation (NextAuth JWT)
  - ✅ Webhook handling guide (Stripe signature verification)
  - ✅ Rate limiting details (strict & standard limits)

## 🐛 Known Issues (Resolved)
- [x] **Fix environment variable validation timing**
  - ✅ Enhanced lib/env.ts with all required variables
  - ✅ Added RESEND_API_KEY and DIRECT_DATABASE_URL
  - ✅ Made Stripe keys optional for build-time
  - ✅ Added development mode warnings instead of hard failures
  - ✅ Validated env object available for import

- [x] **Guest session cookie security**
  - ✅ Reviewed cookie settings - already optimal:
    - httpOnly: true (XSS protection)
    - secure: production only (HTTPS)
    - sameSite: 'lax' (CSRF protection)
    - priority: 'high' (performance)
  - ✅ Documented encryption option (iron-session) for future enhancement
  - Note: Cookie consent banner is a separate feature (not a security issue)

- [x] **Stripe webhook error handling**
  - ✅ Added comprehensive error logging with context
  - ✅ Retry-friendly error responses (500 for transient errors)
  - ✅ Idempotency check prevents duplicate orders
  - ✅ Detailed error categorization (signature vs processing errors)
  - ✅ Stripe automatically retries webhooks with exponential backoff
  - ✅ Email failures logged but don't block webhook

---

## Legend
- 🔴 **Critical**: Blocking issues or documentation errors
- 🟡 **High Priority**: Security, testing, core functionality
- 🟢 **Medium Priority**: Feature enhancements, UX improvements
- 🔵 **Nice to Have**: Performance, DX, advanced features

---

**Last Updated:** 2026-01-13

## 🎉 Recent Completions (2026-01-13)

### Performance Optimizations
- Implemented comprehensive caching strategy with Redis (Upstash)
- Service worker for offline support with fallback page
- Optimized all images with Next.js Image component and responsive sizes
- Bundle analyzer setup for optimization analysis

### Developer Experience
- Complete OpenAPI 3.0.3 API documentation with Swagger UI
- CI/CD pipeline with GitHub Actions (testing + deployment)
- PostgreSQL migration guide with connection pooling options

### Admin Features
- Full admin dashboard with analytics and order/product/blog management
- Blog post CMS with MDX editor, live preview, and publish workflow
- Role-based access control for admin routes
