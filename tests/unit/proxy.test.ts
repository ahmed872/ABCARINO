import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

const run = (url: string, init: { headers?: Record<string, string> } = {}) => proxy(new NextRequest(url, { headers: init.headers }));

afterEach(() => vi.unstubAllEnvs());

describe("proxy (runs before every page)", () => {
  it("sends HSTS at runtime for HTTPS production deployments (regression: was build-time only)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://abcarino.com");
    const res = run("https://abcarino.com/en");
    expect(res.headers.get("strict-transport-security")).toBe("max-age=63072000; includeSubDomains; preload");
    expect(res.headers.get("content-security-policy")).toContain("upgrade-insecure-requests");
  });

  it("does not send HSTS over plain HTTP", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(run("http://localhost:3000/en").headers.get("strict-transport-security")).toBeNull();
  });

  it("uses a fresh nonce-based script policy without unsafe-eval in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const a = run("http://localhost/en").headers.get("content-security-policy")!;
    const b = run("http://localhost/en").headers.get("content-security-policy")!;
    expect(a).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(a).not.toContain("unsafe-eval");
    expect(a).toContain("frame-ancestors 'none'");
    expect(a).toContain("object-src 'none'");
    expect(a.match(/nonce-([^']+)/)![1]).not.toBe(b.match(/nonce-([^']+)/)![1]);
  });

  it("redirects locale-less paths using cookie, then Accept-Language", () => {
    expect(run("http://localhost/solutions?x=1").headers.get("location")).toBe("http://localhost/en/solutions?x=1");
    expect(run("http://localhost/about", { headers: { "accept-language": "ar-EG,ar;q=0.9" } }).headers.get("location")).toBe("http://localhost/ar/about");
    expect(run("http://localhost/about", { headers: { cookie: "abc_locale=ar" } }).headers.get("location")).toBe("http://localhost/ar/about");
  });

  it("bounces signed-out admin requests but is only an optimistic check", () => {
    expect(run("http://localhost/admin/settings").headers.get("location")).toBe("http://localhost/admin/login");
    // Any cookie passes the proxy — real authorization happens in every page/action (see authz-matrix e2e).
    expect(run("http://localhost/admin/settings", { headers: { cookie: "abc_session=forged" } }).headers.get("location")).toBeNull();
    expect(run("http://localhost/admin/login").headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
