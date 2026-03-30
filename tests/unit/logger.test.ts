import { afterEach, describe, expect, it, vi } from 'vitest';

const originalNodeEnv = process.env.NODE_ENV;

async function importLoggerWithEnv(nodeEnv: string) {
  process.env.NODE_ENV = nodeEnv;
  vi.resetModules();
  return import('@/lib/logger');
}

describe('logger', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('extracts request id from headers', async () => {
    const { getRequestIdFromRequest } = await importLoggerWithEnv('test');

    const requestWithId = new Request('http://localhost/api/test', {
      headers: { 'x-request-id': 'req_123' },
    });
    const requestWithoutId = new Request('http://localhost/api/test');

    expect(getRequestIdFromRequest(requestWithId)).toBe('req_123');
    expect(getRequestIdFromRequest(requestWithoutId)).toBeUndefined();
  });

  it('logs debug/info/api request in development', async () => {
    const { logger } = await importLoggerWithEnv('development');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.debug('Debug event', { foo: 'bar' });
    logger.info('Info event', { foo: 'bar' });
    logger.apiRequest('GET', '/api/products', { page: 1 });

    expect(logSpy).toHaveBeenCalledWith('[DEBUG] Debug event', { foo: 'bar' });
    expect(logSpy).toHaveBeenCalledWith('[INFO] Info event', { foo: 'bar' });
    expect(logSpy).toHaveBeenCalledWith('[API] GET /api/products', { page: 1 });
  });

  it('does not log debug/info/api request in production', async () => {
    const { logger } = await importLoggerWithEnv('production');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.debug('Debug event', { foo: 'bar' });
    logger.info('Info event', { foo: 'bar' });
    logger.apiRequest('GET', '/api/products', { page: 1 });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs warn and error with metadata', async () => {
    const { logger } = await importLoggerWithEnv('test');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');

    logger.warn('Warning event', { level: 'medium' });
    logger.error('Error event', err, { area: 'checkout' });

    expect(warnSpy).toHaveBeenCalledWith('[WARN] Warning event', { level: 'medium' });
    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR] Error event',
      expect.objectContaining({ message: 'boom' }),
      { area: 'checkout' }
    );
  });

  it('logs api responses in development and for error statuses', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger: testLogger } = await importLoggerWithEnv('test');
    testLogger.apiResponse('POST', '/api/checkout', 500, 120, { requestId: 'r1' });
    expect(logSpy).toHaveBeenCalledWith('[API] POST /api/checkout - 500 (120ms)', { requestId: 'r1' });

    logSpy.mockClear();
    const { logger: devLogger } = await importLoggerWithEnv('development');
    devLogger.apiResponse('GET', '/api/products', 200, 15, { requestId: 'r2' });
    expect(logSpy).toHaveBeenCalledWith('[API] GET /api/products - 200 (15ms)', { requestId: 'r2' });
  });

  it('supports request-scoped logging helpers', async () => {
    const { logger } = await importLoggerWithEnv('development');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const scoped = logger.withRequestId('req_scoped');

    scoped.debug('Scoped debug', { resource: 'products' });
    scoped.info('Scoped info', { resource: 'products' });
    scoped.warn('Scoped warn', { resource: 'products' });
    scoped.error('Scoped error', new Error('fail'), { resource: 'products' });

    expect(logSpy).toHaveBeenCalledWith(
      '[DEBUG] Scoped debug',
      expect.objectContaining({ requestId: 'req_scoped', resource: 'products' })
    );
    expect(logSpy).toHaveBeenCalledWith(
      '[INFO] Scoped info',
      expect.objectContaining({ requestId: 'req_scoped', resource: 'products' })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] Scoped warn',
      expect.objectContaining({ requestId: 'req_scoped', resource: 'products' })
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR] Scoped error',
      expect.objectContaining({ message: 'fail' }),
      expect.objectContaining({ requestId: 'req_scoped', resource: 'products' })
    );
  });

  it('exposes convenience logger exports', async () => {
    const {
      logDebug,
      logInfo,
      logWarn,
      logError,
    } = await importLoggerWithEnv('development');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logDebug('Debug helper', { x: 1 });
    logInfo('Info helper', { x: 2 });
    logWarn('Warn helper', { x: 3 });
    logError('Error helper', new Error('helper-fail'), { x: 4 });

    expect(logSpy).toHaveBeenCalledWith('[DEBUG] Debug helper', { x: 1 });
    expect(logSpy).toHaveBeenCalledWith('[INFO] Info helper', { x: 2 });
    expect(warnSpy).toHaveBeenCalledWith('[WARN] Warn helper', { x: 3 });
    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR] Error helper',
      expect.objectContaining({ message: 'helper-fail' }),
      { x: 4 }
    );
  });
});
