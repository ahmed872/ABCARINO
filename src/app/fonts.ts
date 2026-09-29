import localFont from "next/font/local";

/** Self-hosted fonts (OFL). No third-party font requests, no layout shift. */
export const latin = localFont({
  src: [
    { path: "../fonts/instrument-sans-latin-wght-normal.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-latin",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const latinExt = localFont({
  src: [
    { path: "../fonts/instrument-sans-latin-ext-wght-normal.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-latin-ext",
  display: "swap",
  preload: false,
});

export const arabic = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const mono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

export const fontVariables = [latin.variable, latinExt.variable, arabic.variable, mono.variable].join(" ");
