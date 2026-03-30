import { request, type APIResponse, type FullConfig } from '@playwright/test'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForEndpoint(
  baseURL: string,
  path: string,
  validate: (response: APIResponse) => Promise<boolean>,
  timeoutMs = 90_000
) {
  const start = Date.now()
  const context = await request.newContext({ baseURL })

  try {
    let attempt = 0
    while (Date.now() - start < timeoutMs) {
      attempt += 1
      try {
        const response = await context.get(path, {
          timeout: 10_000,
        })
        if (await validate(response)) {
          return
        }
      } catch {
        // Retry while the dev server compiles routes.
      }

      await sleep(Math.min(1_500, 250 * attempt))
    }
  } finally {
    await context.dispose()
  }

  throw new Error(`Timed out waiting for ${path} to become ready`)
}

export default async function globalSetup(config: FullConfig) {
  const projectUse = config.projects[0]?.use
  const configuredBaseUrl = projectUse?.baseURL
  const baseURL =
    typeof configuredBaseUrl === 'string' && configuredBaseUrl.length > 0
      ? configuredBaseUrl
      : 'http://localhost:4010'

  await waitForEndpoint(baseURL, '/auth/signin', async (response) => {
    return response.status() === 200
  })

  await waitForEndpoint(baseURL, '/collections', async (response) => {
    return response.status() === 200
  })

  await waitForEndpoint(
    baseURL,
    '/api/products?page=1&pageSize=1',
    async (response) => {
      if (!response.ok()) {
        return false
      }

      const contentType = response.headers()['content-type'] || ''
      if (!contentType.includes('application/json')) {
        return false
      }

      const body = await response.json().catch(() => null)
      return Array.isArray(body?.data)
    }
  )

  await waitForEndpoint(
    baseURL,
    '/api/csrf',
    async (response) => {
      if (!response.ok()) {
        return false
      }
      const contentType = response.headers()['content-type'] || ''
      if (!contentType.includes('application/json')) {
        return false
      }
      const body = await response.json().catch(() => null)
      return typeof body?.token === 'string' && body.token.length > 0
    }
  )
}
