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
