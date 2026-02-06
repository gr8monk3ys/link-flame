# Contributing to Link Flame

Thank you for your interest in contributing to Link Flame! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js**: 20.x or later
- **npm**: 10.x or later
- **Git**: Latest version
- **Code Editor**: VS Code recommended (with recommended extensions)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/link-flame.git
   cd link-flame
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/link-flame.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your development credentials:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/linkflame?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-dev-secret-at-least-32-characters"

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Upstash Redis (optional for development)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Resend (optional for development)
RESEND_API_KEY="re_..."
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma db push

# Seed initial data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the app running.

### 5. Open Prisma Studio (Optional)

```bash
npx prisma studio
```

Access database GUI at http://localhost:5555

## Project Structure

```
link-flame/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── account/           # User account pages
│   ├── blogs/             # Blog pages
│   ├── products/          # Product pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── blogs/            # Blog components
│   ├── cart/             # Cart components
│   ├── collections/      # Product collections
│   ├── layout/           # Layout components (header, footer)
│   ├── products/         # Product components
│   ├── shared/           # Shared/reusable components
│   └── ui/               # UI components (Radix wrappers)
├── lib/                   # Utility functions and business logic
│   ├── auth.ts           # Authentication helpers
│   ├── cache.ts          # Redis caching utilities
│   ├── prisma.ts         # Prisma client singleton
│   ├── providers/        # React Context providers
│   └── utils/            # Generic utilities
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   ├── seed.ts           # Database seeding
│   └── migrations/       # Migration files
├── tests/                # Test files
│   ├── unit/             # Unit tests (Vitest)
│   └── e2e/              # E2E tests (Playwright)
├── public/               # Static assets
└── docs/                 # Documentation files
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the code style guide (below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests
npm test
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add user profile page"
```

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to GitHub and create a PR from your fork
- Fill out the PR template
- Link any related issues

## Code Style Guide

### General Principles

- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **Single Responsibility**: Each function/component should do one thing well
- **Explicit over Implicit**: Code should be clear and obvious

### TypeScript

**Use explicit types**:
```typescript
// ✅ GOOD
function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ BAD
function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}
```

**Use interfaces for objects**:
```typescript
// ✅ GOOD
interface ProductProps {
  id: string;
  title: string;
  price: number;
}

// ❌ BAD (unless you need union/intersection types)
type ProductProps = {
  id: string;
  title: string;
  price: number;
};
```

**Avoid `any` type**:
```typescript
// ✅ GOOD
const data: unknown = await res.json();
const validated = schema.parse(data);  // Validate first

// ❌ BAD
const data: any = await res.json();
```

### React Components

**Use functional components with TypeScript**:
```typescript
// ✅ GOOD
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ children, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

**Use Server Components by default**:
```typescript
// app/products/page.tsx (Server Component - no 'use client')
export default async function ProductsPage() {
  const products = await prisma.product.findMany();
  return <ProductGrid products={products} />;
}
```

**Use 'use client' only when needed**:
```typescript
// components/cart/add-to-cart-button.tsx
'use client';

import { useState } from 'react';

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  // ... client-side logic
}
```

### File Naming

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities**: camelCase (e.g., `formatPrice.ts`)
- **API Routes**: lowercase with hyphens (e.g., `route.ts` in `api/cart-items/`)
- **Pages**: lowercase with hyphens (e.g., `order-history/page.tsx`)

### Imports

**Order imports**:
```typescript
// 1. External dependencies
import { useState } from 'react';
import Link from 'next/link';

// 2. Internal aliases (@/)
import { Button } from '@/components/ui/button';
import { getServerAuth } from '@/lib/auth';

// 3. Relative imports
import { ProductCard } from './product-card';
```

### CSS/Styling

**Use Tailwind utility classes**:
```tsx
// ✅ GOOD
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

**Use class-variance-authority for variants**:
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-green-600 text-white hover:bg-green-700',
        outline: 'border border-gray-300 bg-transparent',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
```

### API Routes

**Use standardized response helpers**:
```typescript
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return unauthorizedResponse();

  const data = await prisma.user.findUnique({ where: { id: userId } });
  return successResponse({ user: data });
}
```

**Validate all inputs with Zod**:
```typescript
import { z } from 'zod';
import { validationErrorResponse } from '@/lib/api-response';

const schema = z.object({
  email: z.string().email(),
  quantity: z.number().min(1).max(999),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return validationErrorResponse(result.error);
  }

  // Use result.data (validated)
}
```

## Testing Requirements

### Unit Tests (Vitest)

**Location**: `tests/unit/`

**What to test**:
- Utility functions
- Validation logic
- Data transformations
- Business logic

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/utils';

describe('formatPrice', () => {
  it('formats USD currency correctly', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('handles zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
```

### E2E Tests (Playwright)

**Location**: `tests/e2e/`

**What to test**:
- Critical user flows (signup, signin, checkout)
- API endpoints (status codes, response format)
- Page rendering
- Form submissions

**Example**:
```typescript
import { test, expect } from '@playwright/test';

test('user can add product to cart', async ({ page }) => {
  await page.goto('/products/1');
  await page.click('button:has-text("Add to Cart")');
  await expect(page.locator('.cart-count')).toHaveText('1');
});
```

### Coverage Requirements

- **Minimum coverage**: 60% overall
- **Critical paths**: 80% coverage (auth, payments, cart)
- **New features**: Must include tests

### Running Tests

```bash
# Unit tests
npm run test:unit              # Run once
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage

# E2E tests
npm run test:e2e               # Run all
npm run test:e2e:ui            # Interactive UI
npm run test:e2e:debug         # Debug mode

# All tests
npm test
```

## Pull Request Process

### Before Creating a PR

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

3. **Update documentation** if needed

### PR Checklist

- [ ] Code follows the style guide
- [ ] Tests added for new features
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete
- [ ] Screenshots included (for UI changes)
- [ ] Database migrations included (if applicable)

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Screenshots (if applicable)
[Add screenshots here]

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Tests added
```

### Review Process

1. **Automated Checks**: CI must pass (lint, test, build)
2. **Code Review**: At least one approval required
3. **Changes Requested**: Address feedback and push updates
4. **Approval**: Maintainer will merge

### After Merge

- Delete your feature branch
- Update your local main:
  ```bash
  git checkout main
  git pull upstream main
  ```

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(cart): add quantity selector to cart items

fix(auth): resolve session expiry issue on page refresh

docs: update README with new setup instructions

refactor(api): simplify error handling in product endpoints

test(e2e): add checkout flow test coverage
```

### Co-authoring

When pairing or using AI assistance:
```bash
feat(admin): add blog post CMS

Co-authored-by: Partner Name <partner@email.com>
Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Issue Reporting

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable
- **Error Messages**: Full error messages/stack traces

### Feature Requests

Include:
- **Use Case**: Why is this needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Additional Context**: Any other relevant information

## Getting Help

- **Documentation**: Check [README.md](README.md) and [CLAUDE.md](CLAUDE.md)
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community (link in README)
- **Email**: support@linkflame.com

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Credited in release notes
- Acknowledged in project README

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Link Flame! 🌱💚
