import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkStrictRateLimit, getIdentifier, getRateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Rate limit — strict (5 req/min per IP)
    const identifier = getIdentifier(request)
    const rateLimitKey = getRateLimitKey('auth-reset-password', identifier)
    const { success: allowed } = await checkStrictRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Hash the provided token to look up in DB
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find the token record
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 }
      )
    }

    // Check if already used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'This reset link has already been used.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password and update user
    const hashedPassword = await hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }
    logger.error('Reset password error', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
