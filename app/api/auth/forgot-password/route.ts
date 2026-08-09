import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkStrictRateLimit, getIdentifier, getRateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { validateCsrfToken } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Rate limit — strict (5 req/min per IP)
    const identifier = getIdentifier(request)
    const rateLimitKey = getRateLimitKey('auth-forgot-password', identifier)
    const { success: allowed } = await checkStrictRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Without this, any origin could make a visitor's browser fire password
    // reset mail at an address of the attacker's choosing. The rate limit caps
    // the volume but does not make the request the visitor's own.
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })

    // Look up user — only users with a password (credentials provider) can reset
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, password: true },
    })

    if (!user || !user.password) {
      // Return same response to prevent enumeration
      return successResponse
    }

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), usedAt: null },
      data: { usedAt: new Date() },
    })

    // Generate token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Store hashed token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      },
    })

    // Send email (non-blocking — don't let email failure break the response)
    sendPasswordResetEmail(email.toLowerCase(), token).catch((err) => {
      logger.error('Failed to send password reset email', err)
    })

    return successResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      )
    }
    logger.error('Forgot password error', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
