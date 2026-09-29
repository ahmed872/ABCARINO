/* Dev utility: renders every concept illustration into a static HTML sheet for review. */
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ConceptVisual, VISUAL_KEYS } from "../src/components/illustrations/ConceptVisual";

const out = process.argv[2] ?? "illustrations.html";
const cells = VISUAL_KEYS.map(
  (k) =>
    `<figure><div class="f">${renderToStaticMarkup(<ConceptVisual visual={k} uid={k} className="svg" />)}</div><figcaption>${k}</figcaption></figure>`,
).join("");
writeFileSync(
  out,
  `<!doctype html><html><head><style>
  @font-face{font-family:Plex;src:url(file://${process.cwd()}/src/fonts/ibm-plex-mono-latin-400-normal.woff2)}
  body{margin:0;background:#f4f2ed;font-family:sans-serif}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px}
  .f{aspect-ratio:4/3;overflow:hidden;border-radius:12px}.svg{width:100%;height:100%;display:block}.mono{font-family:Plex,monospace}
  figure{margin:0}figcaption{font:12px monospace;padding:6px}</style></head><body><div class="grid">${cells}</div></body></html>`,
);
console.log(`wrote ${out}`);
