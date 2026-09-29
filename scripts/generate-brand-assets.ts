/**
 * Regenerates raster brand assets in public/brand from the SVG mark:
 * app icons (sharp) and bilingual Open Graph images (Playwright + local fonts).
 * Run: npm run brand:assets
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { MARK_A_PATH, MARK_NUQTA_PATH } from "../src/components/brand/Mark";

const out = (f: string) => path.join(process.cwd(), "public/brand", f);
const font = (f: string) => `data:font/woff2;base64,${readFileSync(path.join(process.cwd(), "src/fonts", f)).toString("base64")}`;

function iconSvg(size: number, pad = 0.2) {
  const inner = size * (1 - pad * 2);
  const scale = inner / 48;
  const offset = size * pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0e0f11"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})"><path d="${MARK_A_PATH}" fill="#f4f2ed"/><path d="${MARK_NUQTA_PATH}" fill="#ff5b1f"/></g></svg>`;
}

function ogHtml(locale: "en" | "ar") {
  const ar = locale === "ar";
  return `<!doctype html><html lang="${locale}" dir="${ar ? "rtl" : "ltr"}"><head><style>
  @font-face{font-family:Latin;src:url(${font("instrument-sans-latin-wght-normal.woff2")});font-weight:400 700}
  @font-face{font-family:Arabic;src:url(${font("ibm-plex-sans-arabic-arabic-600-normal.woff2")});font-weight:600}
  @font-face{font-family:Mono;src:url(${font("ibm-plex-mono-latin-400-normal.woff2")})}
  *{margin:0;box-sizing:border-box}
  html{overflow:hidden;width:1200px;height:630px}
  body{width:1200px;height:630px;background:#0e0f11;color:#f4f2ed;font-family:${ar ? "Arabic, Latin" : "Latin"};position:relative;overflow:hidden}
  .grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(244,242,237,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(244,242,237,.04) 1px,transparent 1px);background-size:56px 56px}
  .glow{position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(255,201,138,.22),transparent 65%);top:-260px;${ar ? "left" : "right"}:-200px}
  .wrap{position:absolute;inset:72px;display:flex;flex-direction:column;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:22px}
  .word{font-family:Latin;font-weight:600;font-size:30px;letter-spacing:.2em}
  .arname{font-family:Arabic;font-size:22px;opacity:.6;margin-top:6px}
  h1{font-size:${ar ? 76 : 84}px;line-height:${ar ? 1.25 : 1};letter-spacing:${ar ? 0 : "-.035em"};font-weight:${ar ? 600 : 560};max-width:900px}
  .meta{font-family:${ar ? "Arabic" : "Mono"};font-size:${ar ? 22 : 17}px;letter-spacing:${ar ? 0 : ".14em"};text-transform:uppercase;color:rgba(244,242,237,.55);display:flex;align-items:center;gap:14px}
  .dot{width:10px;height:10px;background:#ff5b1f;transform:rotate(45deg)}
  </style></head><body><div class="grid"></div><div class="glow"></div><div class="wrap">
  <div class="brand"><svg width="64" height="64" viewBox="0 0 48 48"><path d="${MARK_A_PATH}" fill="#f4f2ed"/><path d="${MARK_NUQTA_PATH}" fill="#ff5b1f"/></svg>
  <div><div class="word" dir="ltr">ABCARINO</div><div class="arname">عبقرينو</div></div></div>
  <h1>${ar ? "المستقبل، بكل راحة." : "The future, made comfortable."}</h1>
  <div class="meta"><span class="dot"></span>${ar ? "حلول تقنية وتكامل أنظمة" : "Technology solutions & systems integration"}</div>
  </div></body></html>`;
}

async function main() {
  await sharp(Buffer.from(iconSvg(180, 0.16))).png().toFile(out("apple-touch-icon.png"));
  await sharp(Buffer.from(iconSvg(192, 0.18))).png().toFile(out("icon-192.png"));
  await sharp(Buffer.from(iconSvg(512, 0.18))).png().toFile(out("icon-512.png"));
  await sharp(Buffer.from(iconSvg(400, 0.2))).png().toFile(out("social-avatar.png"));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const locale of ["en", "ar"] as const) {
    await page.setContent(ogHtml(locale), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    await sharp(png).png({ compressionLevel: 9, palette: false }).toFile(out(`og-${locale}.png`));
  }
  await browser.close();
  console.log("Brand assets written to public/brand");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
