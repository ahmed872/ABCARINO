import { readStoredFile, STORAGE_KEY_PATTERN } from "@/lib/storage";

/**
 * Serves uploaded media. Names are random UUIDs validated against a strict
 * pattern (no path traversal) and files are immutable, so they cache forever.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!STORAGE_KEY_PATTERN.test(file)) return new Response("Not found", { status: 404 });
  const stored = await readStoredFile(file);
  if (!stored) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(stored.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": "inline",
    },
  });
}
