---
description: Initialize a new project with production-ready scaffolding
argument-hint: <project-type> [project-name]
---

# Project Scaffolding Wizard

Initialize a new project with **$ARGUMENTS**.

## Available Project Types

### Web Applications
| Type | Description |
|------|-------------|
| `nextjs` | Next.js 15 App Router with TypeScript, Tailwind, ESLint |
| `nextjs-supabase` | Next.js + Supabase Auth, Database, Storage |
| `react-vite` | React 19 + Vite + TypeScript |
| `vue` | Vue 3 + Vite + TypeScript + Pinia |
| `svelte` | SvelteKit + TypeScript |
| `astro` | Astro + TypeScript (content sites) |

### Backend / API
| Type | Description |
|------|-------------|
| `api-express` | Express.js + TypeScript + Zod validation |
| `api-fastify` | Fastify + TypeScript (high performance) |
| `api-hono` | Hono + TypeScript (edge-first) |
| `python-fastapi` | FastAPI + Pydantic + SQLAlchemy |
| `python-django` | Django + DRF + PostgreSQL |

### Full-Stack
| Type | Description |
|------|-------------|
| `t3` | T3 Stack (Next.js + tRPC + Prisma + NextAuth) |
| `saas` | SaaS Starter (Auth, Billing, Dashboard) |
| `monorepo` | Turborepo monorepo with apps/packages |

### Mobile
| Type | Description |
|------|-------------|
| `expo` | Expo + React Native + TypeScript |
| `tauri` | Tauri desktop app + React/Vue/Svelte |

## Scaffolding Process

### Step 1: Analyze Request
Parse the project type and name from: `$ARGUMENTS`

If no arguments provided, ask:
1. What type of project? (web app, API, mobile, CLI)
2. What framework preference?
3. What database? (Supabase, Prisma, Drizzle, none)
4. What styling? (Tailwind, CSS Modules, styled-components)
5. What testing? (Vitest, Jest, Playwright)

### Step 2: Create Project Structure

For a **Next.js + Supabase** project, create:

```
project-name/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, type-check, test
│       └── deploy.yml          # Vercel deployment
├── .claude/
│   └── commands/               # Project-specific commands
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── health/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Reusable UI components
│   └── forms/                  # Form components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils.ts
│   └── validations.ts
├── types/
│   └── database.types.ts
├── .env.example
├── .env.local                  # gitignored
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── CLAUDE.md                   # AI context file
├── middleware.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### Step 3: Generate Core Files

#### CLAUDE.md (Critical for AI assistance)
```markdown
# Project: [name]

## Quick Commands
- `npm run dev` - Start development (localhost:3000)
- `npm run test` - Run tests
- `npm run db:types` - Regenerate Supabase types
- `npm run lint` - Lint and fix

## Architecture
- **Framework**: Next.js 15 App Router
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Patterns
- Server Components by default
- Use `'use client'` only when needed
- Validate inputs with Zod at API boundaries
- Return `{ success: true, data }` or `{ success: false, error }`

## File Conventions
- `page.tsx` - Route pages
- `route.ts` - API endpoints
- `actions.ts` - Server Actions
- `*.test.ts` - Test files (colocated)
```

### Step 4: Install Dependencies

```bash
# Create project
npx create-next-app@latest [name] --typescript --tailwind --eslint --app --src-dir=false

# Add Supabase
npm install @supabase/supabase-js @supabase/ssr

# Add validation & utilities
npm install zod

# Add dev dependencies
npm install -D vitest @testing-library/react @vitejs/plugin-react
```

### Step 5: Configure Environment

Create `.env.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Generate Initial Tests

Create `__tests__/setup.ts` and sample test files to establish testing patterns.

### Step 7: Initialize Git

```bash
git init
git add .
git commit -m "Initial scaffold: Next.js + Supabase + TypeScript"
```

## Post-Scaffold Checklist

After scaffolding, guide the user through:

- [ ] Copy `.env.example` to `.env.local` and fill in values
- [ ] Create Supabase project at supabase.com
- [ ] Run `npm run db:types` after schema changes
- [ ] Review and customize CLAUDE.md for project specifics
- [ ] Run `npm run dev` to verify setup

## Interactive Mode

If the user just runs `/scaffold` without arguments, enter interactive mode:

1. **Project Type**: Present options with descriptions
2. **Features**: Multi-select (auth, database, testing, CI/CD)
3. **Preferences**: Framework-specific options
4. **Confirmation**: Show planned structure before creating

Use the AskUserQuestion tool to gather preferences interactively.
