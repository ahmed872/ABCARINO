import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Local-disk media storage.
 *
 * Every upload is decoded and re-encoded by sharp, which (1) proves it is a real
 * raster image, (2) strips EXIF/GPS metadata, (3) normalises orientation and size,
 * and (4) removes any embedded payloads. The stored name is random, so user input
 * never touches the file system path.
 *
 * To move to S3/R2 later, implement the same three functions against the bucket.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "heif", "tiff"]);
export const STORAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

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
  if (input.byteLength === 0) throw new UploadError("The file is empty.");
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("The file is larger than 15 MB.");

  let meta: sharp.Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new UploadError("This file is not a supported image.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new UploadError("Unsupported image format. Use JPEG, PNG, WebP or AVIF.");
  }

  const { data, info } = await sharp(input, { limitInputPixels: 60_000_000, animated: false })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const storageKey = `${randomUUID()}.webp`;
  await mkdir(mediaDir(), { recursive: true });
  await writeFile(path.join(mediaDir(), storageKey), data, { mode: 0o644 });

  return {
    storageKey,
    url: `/media/${storageKey}`,
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

export async function deleteStoredFile(storageKey: string): Promise<void> {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) return;
  try {
    await unlink(path.join(mediaDir(), storageKey));
  } catch {
    /* already gone */
  }
}
