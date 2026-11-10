#!/usr/bin/env node
/**
 * Renders a guide manuscript (Markdown) to a print-ready US Letter PDF in the
 * Link Flame house style, using the site's own fonts and headless Chromium.
 *
 *   node scripts/render-guide-pdf.mjs <manuscript.md> <out.pdf> [--edition "First edition, November 2026"] [--free]
 *
 * Manuscript conventions:
 *   # Title            first line; the italic paragraph after it is the subtitle
 *   ## Chapter         starts a new page
 *   [lines:N]          N ruled write-in lines
 *   - [ ] item         checkbox
 *   > **Label:** text  callout
 *   GFM tables         worksheets; blank cells become write-in boxes
 *
 * The manuscripts themselves are paid products and are NOT kept in this
 * public repository.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error("usage: render-guide-pdf.mjs <manuscript.md> <out.pdf> [--edition text] [--free]");
  process.exit(2);
}
const editionIdx = rest.indexOf("--edition");
const edition = editionIdx >= 0 ? rest[editionIdx + 1] : "First edition, November 2026";
// --free: a guide that is given away. The colophon invites sharing instead of
// licensing the file to a buyer.
const free = rest.includes("--free");
const licence = free
  ? "This guide is free. Print it, copy it and pass it on, as long as you keep it whole and do not sell it."
  : "This guide is licensed to the buyer for personal use. You may print as many copies of the worksheets as your household needs. Please do not resell or redistribute the file.";

// Fonts are inlined: Chromium will not load file:// fonts into setContent pages.
const font = (p) =>
  `data:font/woff2;base64,${readFileSync(resolve(root, "node_modules", p)).toString("base64")}`;
const FONTS = {
  display: font("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2"),
  displayItalic: font("@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2"),
  body: font("@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2"),
  bodyItalic: font("@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-italic.woff2"),
  mono: font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2"),
};

const md = readFileSync(resolve(input), "utf8").replace(/\r\n/g, "\n");
const titleMatch = md.match(/^# (.+)$/m);
if (!titleMatch) throw new Error("Manuscript must start with '# Title'");
const title = titleMatch[1].trim();
const afterTitle = md.slice(titleMatch.index + titleMatch[0].length).trimStart();
const subMatch = afterTitle.match(/^\*([^*]+)\*\s*\n/);
const subtitle = subMatch ? subMatch[1].trim() : "";
const body = subMatch ? afterTitle.slice(subMatch[0].length) : afterTitle;

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let bodyMd = body.replace(/^\[lines:(\d{1,2})\]\s*$/gm, (_, n) =>
  // Blank lines around the HTML block, or Markdown after it is not parsed.
  `
<div class="lines">${'<div class="line"></div>'.repeat(Math.min(Number(n), 30))}</div>
`
);

marked.use({ gfm: true });
let html = marked.parse(bodyMd);
// Task-list checkboxes -> printable boxes.
html = html.replace(/<input (?:checked="" )?disabled="" type="checkbox">/g, '<span class="box"></span>');
// Empty table cells -> write-in cells.
html = html.replace(/<td>\s*<\/td>/g, '<td class="blank"></td>');
// Chapters: wrap each h2 and what follows in a section that starts a page.
const parts = html.split(/(?=<h2[ >])/);
const chapters = parts
  .map((part) => (part.startsWith("<h2") ? `<section class="chapter">${part}</section>` : part))
  .join("\n");

const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title>
<style>
@font-face { font-family: Fraunces; src: url(${FONTS.display}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Fraunces; src: url(${FONTS.displayItalic}) format("woff2"); font-weight: 100 900; font-style: italic; }
@font-face { font-family: Instrument; src: url(${FONTS.body}) format("woff2"); font-weight: 400 700; }
@font-face { font-family: Instrument; src: url(${FONTS.bodyItalic}) format("woff2"); font-weight: 400 700; font-style: italic; }
@font-face { font-family: Plex; src: url(${FONTS.mono}) format("woff2"); }
@page { size: Letter; margin: 0.8in 0.85in 0.9in; }
:root { --ink:#1a1f23; --muted:#606976; --moss:#456336; --hair:#d9d1ca; --tint:#f3f1ec; }
* { box-sizing: border-box; }
html { font-family: Instrument, system-ui, sans-serif; font-size: 10.5pt; line-height: 1.55; color: var(--ink); }
body { margin: 0; }
h1,h2,h3 { font-family: Fraunces, Georgia, serif; font-weight: 560; letter-spacing: -0.01em; line-height: 1.15; }
h2 { font-size: 22pt; margin: 0 0 0.35in; padding-bottom: 10pt; border-bottom: 1px solid var(--hair); }
h3 { font-size: 13pt; margin: 18pt 0 6pt; break-after: avoid; }
p { margin: 0 0 8pt; orphans: 3; widows: 3; }
ul, ol { margin: 0 0 10pt; padding-left: 18pt; }
li { margin: 0 0 3pt; }
li:has(> .box) { list-style: none; margin-left: -18pt; }
.box { display: inline-block; width: 10pt; height: 10pt; border: 1.2px solid var(--ink); margin-right: 7pt; vertical-align: -1pt; }
strong { font-weight: 650; }
blockquote { margin: 12pt 0; padding: 9pt 12pt; background: var(--tint); border-left: 3px solid var(--moss); break-inside: avoid; }
blockquote p:last-child { margin: 0; }
table { width: 100%; border-collapse: collapse; margin: 6pt 0 14pt; font-size: 9.5pt; break-inside: auto; }
th { font-family: Plex, monospace; font-weight: 400; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); text-align: left; padding: 5pt 6pt; border-bottom: 1.2px solid var(--ink); }
td { padding: 6pt; border-bottom: 1px solid var(--hair); vertical-align: top; }
td.blank { height: 22pt; }
tr { break-inside: avoid; }
.lines { margin: 4pt 0 14pt; }
.line { height: 24pt; border-bottom: 1px solid var(--hair); }
hr { border: 0; border-top: 1px solid var(--hair); margin: 16pt 0; }
code { font-family: Plex, monospace; font-size: 9pt; }
.chapter { break-before: page; }
.cover { height: 9.2in; display: flex; flex-direction: column; justify-content: space-between; }
.cover .brand { font-family: Plex, monospace; font-size: 8.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--moss); }
.cover h1 { font-size: 40pt; margin: 0 0 16pt; max-width: 5.6in; }
.cover .sub { font-family: Fraunces, Georgia, serif; font-style: italic; font-size: 15pt; line-height: 1.35; color: var(--muted); max-width: 5.2in; margin: 0; }
.cover .rule { border-top: 1px solid var(--ink); padding-top: 8pt; display: flex; justify-content: space-between; font-family: Plex, monospace; font-size: 8pt; color: var(--muted); }
.colophon { break-before: page; font-size: 9pt; color: var(--muted); }
</style></head><body>
<div class="cover">
  <div class="brand">Link Flame &middot; Field notes</div>
  <div><h1>${escape(title)}</h1>${subtitle ? `<p class="sub">${escape(subtitle)}</p>` : ""}</div>
  <div class="rule"><span>${escape(edition)}</span><span>Measured, not promised.</span></div>
</div>
${chapters}
<div class="colophon">
  <p><strong>${escape(title)}</strong>. ${escape(edition)}.</p>
  <p>Copyright &copy; ${new Date().getFullYear()} Link Flame. ${licence}</p>
  <p>This guide offers general information about reducing household waste. Local recycling and composting rules vary; check with your municipality.</p>
</div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(doc, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;padding:0 0.85in;font-family:'Courier New',monospace;font-size:7pt;color:#606976;display:flex;justify-content:space-between;"><span>${escape(title)}</span><span class="pageNumber"></span></div>`,
  });
  writeFileSync(resolve(output), pdf);
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`${output}: ${pages} pages, ${(pdf.length / 1024).toFixed(0)} KB`);
} finally {
  await browser.close();
}
