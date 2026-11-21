import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getProductionReadinessIssues } from '@/lib/production-readiness'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const startMs = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const durationMs = Date.now() - startMs

    const issues = getProductionReadinessIssues()
    if (issues.length > 0) {
      logger.error('Production is not ready to take money', undefined, { issues })
      return errorResponse(
        'Service not ready',
        'NOT_READY',
        { checks: { db: 'up', config: 'not-ready' }, issues },
        503
      )
    }

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

