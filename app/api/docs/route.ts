import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const specPath = join(process.cwd(), 'docs/api/openapi.yaml');
    const spec = readFileSync(specPath, 'utf-8');

    return new NextResponse(spec, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    logger.error('Failed to read OpenAPI spec', error);
    return NextResponse.json(
      { error: 'OpenAPI specification not found' },
      { status: 404 }
    );
  }
}
