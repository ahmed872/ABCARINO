import path from "node:path";
import type { NextConfig } from "next";
import { isHttpsProduction } from "./src/lib/site-url";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isHttpsProduction() ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Self-hosted: in-memory data cache so restarts never resurrect stale content (see cache-handler.cjs).
  ...(process.env.VERCEL ? {} : { cacheHandler: path.join(process.cwd(), "cache-handler.cjs"), cacheMaxMemorySize: 0 }),
  // The dynamic STORAGE_DIR path in src/lib/storage.ts makes the tracer copy local uploads
  // (and a test file) into .next/standalone. Media must never ship inside the build.
  outputFileTracingExcludes: { "/*": ["./storage/**/*", "./.e2e-storage/**/*", "./tests/**/*"] },
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/media/**", search: "" },
      { pathname: "/brand/**", search: "" },
    ],
    // Media stored on Vercel Blob (see src/lib/storage.ts) — only allowed when a Blob store is configured,
    // otherwise the optimizer would proxy images from any Blob store.
    remotePatterns: process.env.BLOB_READ_WRITE_TOKEN
      ? [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/media/**" }]
      : [],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2400],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
