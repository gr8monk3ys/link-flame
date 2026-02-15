import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const startMs = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const durationMs = Date.now() - startMs

    return successResponse(
      {
        ok: true,
        checks: {
          db: 'up',
        },
      },
      { durationMs }
    )
  } catch (error) {
    logger.error('Health check failed', error)
    return errorResponse('Service unhealthy', 'UNHEALTHY', undefined, 503)
  }
}

