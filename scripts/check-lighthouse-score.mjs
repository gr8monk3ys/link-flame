import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Lighthouse score floors for the public routes, run against the production
// build in CI (see the "Lighthouse (score floors)" job in .github/workflows/ci.yml).
//
// Runs with --preset=desktop on purpose: mobile devtools throttling is too noisy
// on shared GitHub runners to gate on. Production mobile numbers are measured
// separately (PageSpeed Insights against https://link-flame.vivancedata.com)
// and are not what this check enforces.
//
// Per-category floors rather than a blanket 100. Each floor is pinned at the
// real observed value (accessibility / best-practices / SEO are deterministic)
// or, for performance, a couple of points below the minimum seen across
// repeated runs, so noise does not fail the build but a genuine regression
// does. A floor that flakes gets bypassed, and a bypassed check is no check at
// all. Raise a floor whenever the real score improves.
const SCORE_FLOORS = {
  // 97 = two under the worst score a shared GitHub runner has produced for
  // these routes (99 on /, 100 on the other two). Locally the same build
  // measures 100 everywhere; the runner is the slower of the two environments,
  // so it is the one the floor is set from.
  performance: 97,
  accessibility: 100,
  // Not 100, and deliberately not "fixed" by touching the CSP. Every page
  // loses the same 4 points to the `errors-in-console` audit because the CSP
  // carries `upgrade-insecure-requests` (correct, and load-bearing in
  // production) while CI serves the app over plain http: Chrome upgrades the
  // prefetched /account/* -> /auth/signin redirect to https://127.0.0.1 and
  // logs ERR_SSL_PROTOCOL_ERROR. It is an artefact of the http harness, not of
  // the site; production scores 100 here. Weakening a security header to buy
  // back a score is not a trade this check is willing to make, so the floor is
  // pinned at the value the harness actually produces.
  bestPractices: 96,
  seo: 100,
};

// Routes with a known, deterministic defect are pinned at what they score
// today so a further regression still fails while the existing one is fixed.
// Delete the override once the route reaches the global floor.
//
// /products, /guides-and-tips and /about-us used to appear here. Their defects
// are fixed (the catalogue now server-renders instead of swapping a 200px
// placeholder for a 3,600px page, the page-size <select> has a label, the
// guide cards are <h2>, and the "Learn more" link says what it leads to), so
// the three routes are gone from this list and held to the global floors:
// measured locally over three runs, /products 98/98/99 and 100 everywhere
// else, /guides-and-tips and /about-us 100 in every category.
const ROUTE_FLOOR_OVERRIDES = {
  "/blogs": {
    // Server-rendered from the database, so it varies where the static routes
    // do not (99, 100, 100 locally). 96 = two under the runner's 98. This one
    // is runner variance rather than a defect, so it outlives the fixes above.
    performance: 96,
    // `target-size`: the category chips on the post cards are text-xs links
    // well under 24x24 px. Left deliberately: they sit inline in the card
    // metadata line, and padding them out to 24px either overlaps the title
    // above or re-spaces every card. That is a design decision, not a bug fix.
    accessibility: 96,
  },
};

// Layout shift is what put /products at 73. A shift small enough to keep the
// performance score at 97 is still a page that jumps, so it gets its own cap
// rather than being left to the score to notice. Measured 2026-09-16 over
// three runs: 0 on all five routes.
const CLS_MAX = 0.05;

// Set LIGHTHOUSE_ATTEMPTS=1 for a quick local measurement pass.
const MAX_ATTEMPTS = Number.parseInt(process.env.LIGHTHOUSE_ATTEMPTS ?? "4", 10);

// Document byte budget for the home route (compressed transfer size of the
// HTML alone). `experimental.inlineCss` inlines the global stylesheet into the
// document, which the Lighthouse work of 2026-09 relied on for first paint,
// and it made the document several times larger. Lighthouse's score does not
// notice the document slowly growing, so this cap does. Set ~25% above the
// measured value; the measured number is printed on every run.
// Measured 2026-09-16 against the production build: 96,591 bytes. Cap = +25%.
const HOME_DOCUMENT_MAX_BYTES = 121_000;

const artifactDir = join(process.cwd(), "artifacts", "lighthouse");
const [baseUrl, ...routes] = process.argv.slice(2);

if (!baseUrl || routes.length === 0) {
  console.error("Usage: node scripts/check-lighthouse-score.mjs <baseUrl> <route...>");
  process.exit(1);
}

const outputDir = mkdtempSync(join(tmpdir(), "link-flame-lighthouse-"));

try {
  mkdirSync(artifactDir, { recursive: true });

  const failedRoutes = [];

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const floors = { ...SCORE_FLOORS, ...(ROUTE_FLOOR_OVERRIDES[route] ?? {}) };
    warmRoute(url);
    let bestAttempt = null;
    let attemptsRun = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      attemptsRun = attempt;
      const reportPath = join(outputDir, `${artifactSlug(route)}-attempt-${attempt}.json`);
      const scores = runLighthouse(url, reportPath);

      console.log(`[lighthouse] ${route} attempt ${attempt} -> ${JSON.stringify(scores)}`);

      if (!bestAttempt || totalScore(scores) > totalScore(bestAttempt.scores)) {
        bestAttempt = { attempt, scores, reportPath };
      }

      if (Object.entries(scores).every(([k, score]) => score >= (floors[k] ?? 100))) {
        break;
      }
    }

    const failures = Object.entries(bestAttempt.scores).filter(([k, score]) => score < (floors[k] ?? 100));
    copyFileSync(bestAttempt.reportPath, join(artifactDir, `${artifactSlug(route)}.json`));

    const cls = readCls(bestAttempt.reportPath);
    console.log(`[lighthouse] ${route} cumulative-layout-shift = ${cls} (cap ${CLS_MAX})`);

    if (failures.length > 0) {
      failedRoutes.push(route);
      console.error(
        `[lighthouse] ${route} fell below its score floors after ${attemptsRun} attempt(s): ${failures
          .map(([category, score]) => `${category}=${score} (floor ${floors[category] ?? 100})`)
          .join(", ")}`
      );
      logFailureDiagnostics(bestAttempt.reportPath);
    } else if (cls > CLS_MAX) {
      failedRoutes.push(route);
      console.error(
        `[lighthouse] ${route} shifted its layout: cumulative-layout-shift ${cls} is over the ${CLS_MAX} cap. ` +
          "Something is rendering after the server HTML without reserving its space."
      );
      logFailureDiagnostics(bestAttempt.reportPath);
    }
  }

  // Measured and printed unconditionally, before any exit: the byte number is
  // the thing worth reading even on a run that failed on scores.
  const budgetOk = checkDocumentBudget(new URL("/", baseUrl).toString());

  if (failedRoutes.length > 0) {
    console.error(`[lighthouse] routes below their floors: ${failedRoutes.join(", ")}`);
  }

  if (failedRoutes.length > 0 || !budgetOk) {
    process.exit(1);
  }
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}

function runLighthouse(url, reportPath) {
  const result = spawnSync(
    "npx",
    [
      "-y",
      "lighthouse",
      url,
      "--preset=desktop",
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${reportPath}`,
    ],
    { encoding: "utf-8" }
  );

  if (result.error) {
    console.error(`Failed to run Lighthouse for ${url}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const report = JSON.parse(readFileSync(reportPath, "utf-8"));
  return {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories["best-practices"].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  };
}

function checkDocumentBudget(url) {
  const result = spawnSync(
    "curl",
    ["--compressed", "-sfo", "/dev/null", "-w", "%{size_download}", "-H", "Accept: text/html", url],
    { encoding: "utf-8" }
  );
  const bytes = Number.parseInt(result.stdout, 10);

  if (result.status !== 0 || !Number.isFinite(bytes) || bytes <= 0) {
    console.error(`[document-budget] could not measure ${url}: curl exited ${result.status} (${result.stderr || result.stdout})`);
    process.exit(1);
  }

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`[document-budget] / compressed document = ${bytes} bytes (${kb(bytes)}); cap ${HOME_DOCUMENT_MAX_BYTES} bytes (${kb(HOME_DOCUMENT_MAX_BYTES)})`);

  if (bytes > HOME_DOCUMENT_MAX_BYTES) {
    console.error(
      `[document-budget] / compressed document is ${bytes} bytes, over the ${HOME_DOCUMENT_MAX_BYTES}-byte cap. ` +
        "Something new is being inlined into the HTML (CSS, RSC payload, data). Either trim it or, if the growth is deliberate, raise HOME_DOCUMENT_MAX_BYTES in this script and say why."
    );
    return false;
  }

  return true;
}

function warmRoute(url) {
  spawnSync("curl", ["-fsSLo", "/dev/null", url], { stdio: "ignore" });
}

function readCls(reportPath) {
  const report = JSON.parse(readFileSync(reportPath, "utf-8"));
  return Math.round((report.audits["cumulative-layout-shift"]?.numericValue ?? 0) * 1000) / 1000;
}

function artifactSlug(route) {
  return route === "/" ? "root" : route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-");
}

function totalScore(scores) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

function logFailureDiagnostics(reportPath) {
  const report = JSON.parse(readFileSync(reportPath, "utf-8"));
  const metrics = report.audits.metrics?.details?.items?.[0];

  if (metrics) {
    const formatMetric = (value) => `${Math.round(value)}ms`;
    console.error(
      `[lighthouse] metrics: fcp=${formatMetric(metrics.firstContentfulPaint)} lcp=${formatMetric(metrics.largestContentfulPaint)} tbt=${formatMetric(metrics.totalBlockingTime)} si=${formatMetric(metrics.speedIndex)} cls=${metrics.cumulativeLayoutShift}`
    );
  }

  const opportunities = Object.values(report.audits)
    .filter((audit) => audit.details?.type === "opportunity" && typeof audit.numericValue === "number")
    .sort((left, right) => right.numericValue - left.numericValue)
    .slice(0, 5)
    .map((audit) => `${audit.id}:${Math.round(audit.numericValue)}ms`);

  if (opportunities.length > 0) {
    console.error(`[lighthouse] top opportunities: ${opportunities.join(", ")}`);
  }

  const layoutShiftItems = report.audits["layout-shift-elements"]?.details?.items
    ?.slice(0, 5)
    .map((item) => {
      const node = item.node ?? {};
      const snippet = node.snippet ?? node.nodeLabel ?? node.path ?? "unknown";
      return `${snippet} (${Math.round((item.score ?? 0) * 1000) / 1000})`;
    });

  if (layoutShiftItems?.length) {
    console.error(`[lighthouse] layout-shift-elements: ${layoutShiftItems.join(" | ")}`);
  }
}
