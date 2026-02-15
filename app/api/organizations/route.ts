import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerAuth } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import {
  conflictResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import { checkRateLimit, checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const RESERVED_SLUGS = new Set([
  'account',
  'admin',
  'api',
  'auth',
  'billing',
  'blogs',
  'brands',
  'bundles',
  'cart',
  'checkout',
  'collections',
  'contact',
  'faq',
  'gift-cards',
  'guides-and-tips',
  'impact',
  'imperfect',
  'order-confirmation',
  'privacy',
  'products',
  'quiz',
  'robots.txt',
  'sitemap.xml',
  'sustainability',
  'terms',
  'terracycle',
])

const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(80),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .optional(),
})

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
}

async function getUniqueSlug(base: string): Promise<string> {
  const normalizedBase = RESERVED_SLUGS.has(base) ? `${base}-org` : base
  let slug = normalizedBase || 'org'

  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`
    const exists = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!exists) return candidate
  }

  // Extremely unlikely fallback.
  return `${slug}-${Date.now().toString(36)}`
}

/**
 * GET /api/organizations
 * List organizations for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in')
    }

    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkRateLimit(`organizations-list:${identifier}`)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        plan: true,
        billingInterval: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    })

    const shaped = organizations.map((org) => ({
      ...org,
      role: org.members[0]?.role ?? null,
      members: undefined,
    }))

    return successResponse(shaped)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/organizations
 * Create an organization and assign the current user as OWNER.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return errorResponse(
        'Invalid or missing CSRF token',
        'CSRF_VALIDATION_FAILED',
        undefined,
        403
      )
    }

    const { userId, user } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in')
    }

    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(`organizations-create:${identifier}`)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const body = await request.json()
    const validation = CreateOrganizationSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const name = validation.data.name.trim()
    const baseSlug = validation.data.slug ? validation.data.slug : slugify(name)
    const slug = await getUniqueSlug(baseSlug)

    // Create org + owner membership.
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        billingEmail: user?.email ?? undefined,
        billingName: user?.name ?? undefined,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        plan: true,
        billingInterval: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    })

    return successResponse(
      {
        ...organization,
        role: organization.members[0]?.role ?? null,
        members: undefined,
      },
      undefined,
      201
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return conflictResponse('Organization slug is already taken')
    }
    return handleApiError(error)
  }
}
