import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { blobConfigured } from "@/lib/blob-config";
import sharp, { type Metadata as SharpMetadata, type OutputInfo } from "sharp";
import { sanitizeFilename } from "@/lib/utils";
export { sanitizeFilename };

/**
 * Local-disk media storage.
 *
 * Every upload is decoded and re-encoded by sharp, which (1) proves it is a real
 * raster image, (2) strips EXIF/GPS metadata, (3) normalises orientation and size,
 * and (4) removes any embedded payloads. The stored name is random, so user input
 * never touches the file system path.
 *
 * Two backends, chosen automatically:
 *  - Vercel Blob when a Blob store is connected (BLOB_STORE_ID or
 *    BLOB_READ_WRITE_TOKEN) — required on Vercel, whose filesystem is not persistent;
 *  - local disk (STORAGE_DIR) otherwise — e.g. Docker with a volume.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "heif", "tiff"]);
export const STORAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export function usesBlobStorage(): boolean {
  return blobConfigured();
}

function mediaDir(): string {
  return path.resolve(process.env.STORAGE_DIR ?? "./storage", "media");
}

export class UploadError extends Error {}

export type StoredImage = {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export async function storeImage(input: Buffer): Promise<StoredImage> {
  // Vercel functions have no persistent (or writable) disk: local storage is not an option there.
  if (process.env.VERCEL && !usesBlobStorage()) {
    throw new UploadError("Media storage is not configured. Connect a Vercel Blob store (Storage → Blob), then redeploy.");
  }
  if (input.byteLength === 0) throw new UploadError("The file is empty.");
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("The file is larger than 15 MB.");

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new UploadError("This file is not a supported image.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new UploadError("Unsupported image format. Use JPEG, PNG, WebP or AVIF.");
  }

  let data: Buffer;
  let info: OutputInfo;
  try {
    ({ data, info } = await sharp(input, { limitInputPixels: 60_000_000, animated: false })
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    // Valid header but undecodable pixel data (truncated/corrupt file).
    throw new UploadError("This image could not be processed. It may be damaged — try exporting it again.");
  }

  const storageKey = `${randomUUID()}.webp`;
  let url: string;
  if (usesBlobStorage()) {
    const blob = await put(`media/${storageKey}`, data, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    url = blob.url;
  } else {
    await mkdir(mediaDir(), { recursive: true });
    await writeFile(path.join(mediaDir(), storageKey), data, { mode: 0o644 });
    url = `/media/${storageKey}`;
  }

  return {
    storageKey,
    url,
    mimeType: "image/webp",
    sizeBytes: data.byteLength,
    width: info.width,
    height: info.height,
  };
}

export async function readStoredFile(storageKey: string): Promise<{ data: Buffer; size: number } | null> {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) return null;
  const file = path.join(mediaDir(), storageKey);
  try {
    const s = await stat(file);
    if (!s.isFile()) return null;
    return { data: await readFile(file), size: s.size };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(storageKey: string, url?: string): Promise<void> {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) return;
  if (url && /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
    await del(url).catch((err) => console.error("[storage] blob delete failed", err));
    return;
  }
  try {
    await unlink(path.join(mediaDir(), storageKey));
  } catch {
    /* already gone */
  }
}
