import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';

const url = process.argv[2];
const label = process.argv[3];
const widthArg = process.argv[4];

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [width]');
  process.exit(1);
}

const OUT_DIR = './temporary screenshots';
await mkdir(OUT_DIR, { recursive: true });

const existing = await readdir(OUT_DIR);
const nums = existing
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => parseInt(m[1], 10));
const next = nums.length ? Math.max(...nums) + 1 : 1;

const suffix = label ? `-${label}` : '';
const outPath = `${OUT_DIR}/screenshot-${next}${suffix}.png`;

const width = widthArg ? parseInt(widthArg, 10) : 1440;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });

// Scroll through the full page so scroll-triggered reveal animations fire
// before the screenshot is taken (a fullPage capture never scrolls itself).
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < scrollHeight; y += 400) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 60));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 200));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);
