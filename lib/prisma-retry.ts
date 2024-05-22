import { Prisma } from '@prisma/client'

const TRANSIENT_PRISMA_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Connection pool timeout
])

const TRANSIENT_MESSAGE_FRAGMENTS = [
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'Connection reset by peer',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENETUNREACH',
]

function isTransientPrismaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (TRANSIENT_PRISMA_CODES.has(error.code)) {
      return true
    }
  }

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  if (!message) {
    return false
  }

  return TRANSIENT_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
}

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 150)

  let lastError: unknown = undefined

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientPrismaError(error) || attempt >= attempts) {
        throw error
      }

      await sleep(baseDelayMs * attempt)
    }
  }

  throw lastError
}
