import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteStoredFile, readStoredFile, storeImage, UploadError } from "@/lib/storage";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "abc-storage-"));
  process.env.STORAGE_DIR = dir;
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("media storage", () => {
  it("re-encodes images to WebP, strips metadata and caps dimensions", async () => {
    const png = await sharp({ create: { width: 3200, height: 1600, channels: 3, background: "#ff5b1f" } })
      .withMetadata({ exif: { IFD0: { Copyright: "secret-location" } } })
      .png()
      .toBuffer();
    const stored = await storeImage(png);
    expect(stored.mimeType).toBe("image/webp");
    expect(stored.width).toBe(2400);
    expect(stored.height).toBe(1200);
    expect(stored.url).toBe(`/media/${stored.storageKey}`);
    const file = await readStoredFile(stored.storageKey);
    const meta = await sharp(file!.data).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    await deleteStoredFile(stored.storageKey);
    expect(await readdir(path.join(dir, "media"))).toHaveLength(0);
  });
  it("rejects non-images, including disguised files", async () => {
    await expect(storeImage(Buffer.from("<svg onload=alert(1)>"))).rejects.toBeInstanceOf(UploadError);
    await expect(storeImage(Buffer.from("GIF89a<?php echo 1; ?>"))).rejects.toBeInstanceOf(UploadError);
    await expect(storeImage(Buffer.alloc(0))).rejects.toBeInstanceOf(UploadError);
  });
  it("refuses path traversal when reading", async () => {
    expect(await readStoredFile("../../etc/passwd")).toBeNull();
    expect(await readStoredFile("not-a-uuid.webp")).toBeNull();
  });
});

describe("media storage — adversarial inputs (regression)", () => {
  it("rejects truncated/corrupt images with an UploadError, not a crash", async () => {
    const png = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#ff5b1f" } }).png().toBuffer();
    await expect(storeImage(png.subarray(0, Math.floor(png.length / 2)))).rejects.toBeInstanceOf(UploadError);
  });
  it("rejects decompression bombs (tiny file declaring 900 MP)", async () => {
    const { crc32 } = await import("node:zlib");
    const png = Buffer.from(await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toBuffer());
    png.writeUInt32BE(30000, 16);
    png.writeUInt32BE(30000, 20);
    png.writeUInt32BE(crc32(png.subarray(12, 29)) >>> 0, 29);
    await expect(storeImage(png)).rejects.toBeInstanceOf(UploadError);
  });
  it("strips GPS location data from photos", async () => {
    const jpg = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#123456" } })
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "30/1 2/1 0/1" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(jpg).metadata()).exif).toBeDefined();
    const stored = await storeImage(jpg);
    const out = await readStoredFile(stored.storageKey);
    expect((await sharp(out!.data).metadata()).exif).toBeUndefined();
  });
  it("rejects SVG even when well-formed (script-capable format)", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script><rect width="10" height="10"/></svg>');
    await expect(storeImage(svg)).rejects.toBeInstanceOf(UploadError);
  });
  it("on Vercel without a Blob store, refuses uploads with an actionable message (no disk writes)", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toBuffer();
    const before = await readdir(dir, { recursive: true });
    process.env.VERCEL = "1";
    try {
      await expect(storeImage(png)).rejects.toThrow(/Vercel Blob/);
      await expect(storeImage(png)).rejects.toBeInstanceOf(UploadError);
    } finally {
      delete process.env.VERCEL;
    }
    expect(await readdir(dir, { recursive: true })).toEqual(before);
  });
});
