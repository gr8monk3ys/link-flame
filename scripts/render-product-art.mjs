#!/usr/bin/env node
/**
 * Renders the launch catalogue's artwork with the site's own fonts:
 *
 *   public/print/*.png            print files sent to Printful (transparent)
 *   public/images/products/*.png  square product plates for the storefront
 *
 *   node scripts/render-product-art.mjs
 *
 * The product plates for printed goods are flat illustrations of the item,
 * not photographs. Replace them with Printful mockups once the store is
 * connected (Printful dashboard > Mockup generator).
 */
import { mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Fonts are inlined: Chromium will not load file:// fonts into setContent pages.
const font = (p) =>
  `data:font/woff2;base64,${readFileSync(resolve(root, "node_modules", p)).toString("base64")}`;
const FONT_CSS = `
@font-face { font-family: Fraunces; src: url(${font("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Fraunces; src: url(${font("@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2")}) format("woff2"); font-weight: 100 900; font-style: italic; }
@font-face { font-family: Instrument; src: url(${font("@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2")}) format("woff2"); font-weight: 400 700; }
@font-face { font-family: Plex; src: url(${font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2")}) format("woff2"); }
* { margin: 0; box-sizing: border-box; }
html, body { background: transparent; }
`;

const C = {
  ink: "#1a1f23",
  muted: "#606976",
  moss: "#456336",
  paper: "#f9f8f5",
  tinted: "#eeece7",
  warm: "#f5ebe0",
  hair: "#d9d1ca",
  oyster: "#e6dfcf",
  natural: "#d4cdb7",
};

// ---------- Print files ----------

const toteDesign = (scale = 1) => `
<div style="width:${2400 * scale}px;height:${2400 * scale}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 ${180 * scale}px;color:${C.ink};">
  <div style="font-family:Plex;font-size:${78 * scale}px;letter-spacing:.16em;color:${C.moss};margin-bottom:${70 * scale}px;">LINK FLAME</div>
  <div style="font-family:Fraunces;font-weight:560;font-size:${430 * scale}px;line-height:.98;letter-spacing:-.02em;">Measured,</div>
  <div style="font-family:Fraunces;font-style:italic;font-weight:420;font-size:${430 * scale}px;line-height:.98;letter-spacing:-.02em;">not promised.</div>
  <div style="width:100%;border-top:${8 * scale}px solid ${C.ink};margin-top:${110 * scale}px;padding-top:${36 * scale}px;display:flex;justify-content:space-between;font-family:Plex;font-size:${66 * scale}px;letter-spacing:.08em;">
    <span>BAGS REFUSED:</span><span style="display:inline-block;width:${640 * scale}px;border-bottom:${5 * scale}px solid ${C.ink};"></span>
  </div>
</div>`;

const teeDesign = (scale = 1) => `
<div style="width:${1800 * scale}px;height:${2400 * scale}px;display:flex;flex-direction:column;justify-content:flex-start;align-items:center;padding-top:${120 * scale}px;color:${C.ink};text-align:center;">
  <div style="font-family:Fraunces;font-weight:560;font-size:${330 * scale}px;line-height:1;letter-spacing:-.02em;">One swap</div>
  <div style="font-family:Fraunces;font-style:italic;font-weight:420;font-size:${330 * scale}px;line-height:1.05;letter-spacing:-.02em;">at a time.</div>
  <div style="width:${900 * scale}px;border-top:${6 * scale}px solid ${C.ink};margin-top:${80 * scale}px;padding-top:${30 * scale}px;font-family:Plex;font-size:${62 * scale}px;letter-spacing:.18em;color:${C.moss};">LINK FLAME</div>
</div>`;

// ---------- Product plates (1200 x 1200) ----------

const plate = (inner, bg = C.tinted) => `
<div style="width:1200px;height:1200px;background:${bg};position:relative;overflow:hidden;">${inner}</div>`;

const guideCover = ({ title, subtitle, pages, accent }) => `
<div style="position:absolute;left:250px;top:130px;width:700px;height:906px;background:${C.paper};border:2px solid ${C.hair};padding:64px 60px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="font-family:Plex;font-size:20px;letter-spacing:.16em;color:${C.moss};">LINK FLAME &middot; FIELD NOTES</div>
  <div>
    <div style="font-family:Fraunces;font-weight:560;font-size:74px;line-height:1.02;letter-spacing:-.015em;color:${C.ink};">${title}</div>
    <div style="font-family:Fraunces;font-style:italic;font-size:30px;line-height:1.3;color:${C.muted};margin-top:28px;">${subtitle}</div>
  </div>
  <div>
    ${Array.from({ length: 4 }, () => `<div style="height:34px;border-bottom:2px solid ${C.hair};"></div>`).join("")}
    <div style="border-top:2px solid ${C.ink};margin-top:34px;padding-top:12px;display:flex;justify-content:space-between;font-family:Plex;font-size:19px;color:${C.muted};">
      <span>PDF &middot; ${pages} PAGES</span><span style="color:${accent};">MEASURED, NOT PROMISED.</span>
    </div>
  </div>
</div>`;

const bundleCover = () => `
${["The Waste Audit Workbook", "The One-Swap Kitchen", "The Plastic-Free Bathroom Field Guide"]
  .map(
    (title, i) => `<div style="position:absolute;left:${150 + i * 100}px;top:${100 + i * 210}px;width:700px;height:600px;background:${C.paper};border:2px solid ${C.hair};padding:36px 44px;">
  <div style="font-family:Plex;font-size:17px;letter-spacing:.16em;color:${C.moss};">LINK FLAME &middot; FIELD NOTES</div>
  <div style="font-family:Fraunces;font-weight:560;font-size:52px;line-height:1.04;color:${C.ink};margin-top:26px;">${title}</div>
</div>`
  )
  .join("")}
<div style="position:absolute;right:60px;top:56px;font-family:Plex;font-size:22px;letter-spacing:.14em;color:${C.ink};">3 PDFs</div>`;

const totePlate = () => `
<svg width="1200" height="1200" viewBox="0 0 1200 1200" style="position:absolute;inset:0">
  <path d="M470 330 C470 170, 730 170, 730 330" fill="none" stroke="${C.oyster}" stroke-width="34" />
  <path d="M470 330 C470 170, 730 170, 730 330" fill="none" stroke="${C.hair}" stroke-width="2" transform="translate(0,17)" opacity=".7"/>
  <rect x="290" y="320" width="620" height="760" fill="${C.oyster}" stroke="${C.hair}" stroke-width="2"/>
</svg>
<div style="position:absolute;left:330px;top:390px;width:540px;height:540px;">${toteDesign(540 / 2400)}</div>
<div style="position:absolute;left:60px;bottom:56px;font-family:Plex;font-size:20px;letter-spacing:.12em;color:${C.muted};">ILLUSTRATION &middot; ORGANIC COTTON TOTE, OYSTER</div>`;

const teePlate = () => `
<svg width="1200" height="1200" viewBox="0 0 1200 1200" style="position:absolute;inset:0">
  <path d="M430 170 L330 210 L140 360 L230 500 L330 430 L330 1070 L870 1070 L870 430 L970 500 L1060 360 L870 210 L770 170 C740 250, 460 250, 430 170 Z"
    fill="${C.natural}" stroke="${C.hair}" stroke-width="3" stroke-linejoin="round"/>
</svg>
<div style="position:absolute;left:465px;top:330px;width:270px;height:360px;">${teeDesign(270 / 1800)}</div>
<div style="position:absolute;left:60px;bottom:56px;font-family:Plex;font-size:20px;letter-spacing:.12em;color:${C.muted};">ILLUSTRATION &middot; ORGANIC COTTON TEE, STONE</div>`;

const JOBS = [
  { out: "public/print/tote-measured-not-promised.png", w: 2400, h: 2400, html: toteDesign(), transparent: true },
  { out: "public/print/tee-one-swap-at-a-time.png", w: 1800, h: 2400, html: teeDesign(), transparent: true },
  { out: "public/images/products/tote-measured-not-promised.png", w: 1200, h: 1200, html: plate(totePlate()) },
  { out: "public/images/products/tee-one-swap-at-a-time.png", w: 1200, h: 1200, html: plate(teePlate()) },
  {
    out: "public/images/products/guide-waste-audit-workbook.png", w: 1200, h: 1200,
    html: plate(guideCover({ title: "The Waste Audit Workbook", subtitle: "Count one week of household trash, then choose your first swap.", pages: 23, accent: C.moss }), C.warm),
  },
  {
    out: "public/images/products/guide-one-swap-kitchen.png", w: 1200, h: 1200,
    html: plate(guideCover({ title: "The One-Swap Kitchen", subtitle: "Four weeks, four kitchen swaps, with honest notes on each.", pages: 25, accent: C.moss })),
  },
  {
    out: "public/images/products/guide-plastic-free-bathroom.png", w: 1200, h: 1200,
    html: plate(guideCover({ title: "The Plastic-Free Bathroom Field Guide", subtitle: "Swap bathroom items one at a time, only as they run out.", pages: 32, accent: C.moss }), C.warm),
  },
  { out: "public/images/products/guide-swap-starter-set.png", w: 1200, h: 1200, html: plate(bundleCover()) },
];

const browser = await chromium.launch();
try {
  for (const job of JOBS) {
    const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
    await page.setContent(`<!doctype html><html><head><style>${FONT_CSS}</style></head><body>${job.html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const out = resolve(root, job.out);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, omitBackground: Boolean(job.transparent), clip: { x: 0, y: 0, width: job.w, height: job.h } });
    await page.close();
    console.log(job.out);
  }
} finally {
  await browser.close();
}
