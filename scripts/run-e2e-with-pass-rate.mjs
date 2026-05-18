#!/usr/bin/env node

import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const thresholdArg = process.argv[2];
const threshold = Number.isFinite(Number(thresholdArg)) ? Number(thresholdArg) : 90;

const jsonOutputPath = resolve(process.cwd(), 'test-results/e2e-results.json');
mkdirSync(dirname(jsonOutputPath), { recursive: true });

const playwrightResult = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', '--reporter=json'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_FILE: jsonOutputPath,
    },
  }
);
const playwrightExitCode = playwrightResult.status ?? 1;

let parsed;
try {
  parsed = JSON.parse(readFileSync(jsonOutputPath, 'utf8'));
} catch (error) {
  console.error(`Failed to read Playwright JSON report at ${jsonOutputPath}`);
  process.exit(1);
}

const stats = parsed?.stats ?? {};
const expected = Number(stats.expected ?? 0);
const unexpected = Number(stats.unexpected ?? 0);
const flaky = Number(stats.flaky ?? 0);
const skipped = Number(stats.skipped ?? 0);
const passing = expected + flaky;
const executedTotal = passing + unexpected;
const allTotal = executedTotal + skipped;
const passRate = executedTotal > 0 ? (passing / executedTotal) * 100 : 0;

console.log(
  `E2E pass-rate coverage: ${passRate.toFixed(2)}% (${passing} passing / ${executedTotal} executed; ${skipped} skipped; ${allTotal} total)`
);

if (playwrightExitCode !== 0) {
  console.warn(`Playwright exited with code ${playwrightExitCode}; applying pass-rate gate policy`);
}

if (passRate < threshold) {
  console.error(
    `E2E pass-rate coverage ${passRate.toFixed(2)}% is below required threshold ${threshold.toFixed(2)}%`
  );
  process.exit(1);
}

console.log(`E2E pass-rate coverage meets threshold ${threshold.toFixed(2)}%`);
