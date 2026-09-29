import { describe, expect, it } from "vitest";
import { formatPrice, normalizePhoneForWhatsApp, safeExternalUrl, slugify, videoEmbedUrl, whatsappLink } from "@/lib/utils";

describe("slugify", () => {
  it("creates clean URL slugs", () => {
    expect(slugify("  Smart Lighting — Essentials! ")).toBe("smart-lighting-essentials");
    expect(slugify("Café Déco")).toBe("cafe-deco");
  });
});

describe("WhatsApp", () => {
  it("normalises international numbers", () => {
    expect(normalizePhoneForWhatsApp("+20 100 123 4567")).toBe("201001234567");
    expect(normalizePhoneForWhatsApp("0020-100-123-4567")).toBe("201001234567");
  });
  it("rejects implausible numbers", () => {
    expect(normalizePhoneForWhatsApp("123")).toBe("");
    expect(normalizePhoneForWhatsApp("")).toBe("");
  });
  it("builds wa.me links with an encoded message", () => {
    expect(whatsappLink("+201001234567", "Hi & hello")).toBe("https://wa.me/201001234567?text=Hi%20%26%20hello");
    expect(whatsappLink("", "x")).toBeNull();
  });
});

describe("URL safety", () => {
  it("only allows http(s) links", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,x")).toBeNull();
    expect(safeExternalUrl("https://abcarino.com")).toBe("https://abcarino.com/");
  });
  it("converts only YouTube/Vimeo to embeds", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
    expect(videoEmbedUrl("https://evil.example/video")).toBeNull();
  });
});

describe("prices", () => {
  it("formats per locale", () => {
    expect(formatPrice("25000", "EGP", "en")).toMatch(/25,000/);
    expect(formatPrice(null, "EGP", "en")).toBe("");
  });
});

describe("upload filename sanitising (display only)", () => {
  it("keeps Arabic and other Unicode names (regression)", async () => {
    const { sanitizeFilename } = await import("@/lib/utils");
    expect(sanitizeFilename("صورة غرفة المعيشة.png")).toBe("صورة غرفة المعيشة.png");
  });
  it("removes path separators, markup-significant and control characters", async () => {
    const { sanitizeFilename } = await import("@/lib/utils");
    expect(sanitizeFilename("../../etc/passwd.png")).toBe(".etcpasswd.png");
    expect(sanitizeFilename('"><img src=x onerror=alert(1)>.png')).toBe("img src=x onerror=alert(1).png");
    expect(sanitizeFilename("a\u0000b\nc.png")).toBe("abc.png");
  });
  it("removes bidi overrides used to disguise extensions (RTLO)", async () => {
    const { sanitizeFilename } = await import("@/lib/utils");
    expect(sanitizeFilename("invoice‮gnp.exe")).toBe("invoicegnp.exe");
  });
});
