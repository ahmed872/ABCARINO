import { describe, expect, it } from "vitest";
import { checkPasswordPolicy, generatePassword, hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { can, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { rateLimit, resetRateLimit } from "@/lib/security/rate-limit";

describe("password hashing", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password entirely", hash)).toBe(false);
    expect(needsRehash(hash)).toBe(false);
  });
  it("uses unique salts", async () => {
    expect(await hashPassword("same-password-123")).not.toBe(await hashPassword("same-password-123"));
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
  });
  it("enforces the password policy", () => {
    expect(checkPasswordPolicy("short").ok).toBe(false);
    expect(checkPasswordPolicy("password12345678").ok).toBe(false);
    expect(checkPasswordPolicy("founder-2026-secure!", "founder@abcarino.com").ok).toBe(false);
    expect(checkPasswordPolicy("Tidal-Lamp-Orbit-42").ok).toBe(true);
    expect(generatePassword(20)).toHaveLength(20);
  });
});

describe("authorization", () => {
  it("gives super admins every permission", () => {
    for (const p of PERMISSIONS) expect(can("super_admin", p)).toBe(true);
  });
  it("keeps settings and users restricted to super admins", () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>) {
      if (role === "super_admin") continue;
      expect(can(role, "settings.manage")).toBe(false);
      expect(can(role, "users.manage")).toBe(false);
    }
  });
  it("scopes roles sensibly", () => {
    expect(can("editor", "content.edit")).toBe(true);
    expect(can("editor", "content.delete")).toBe(false);
    expect(can("sales", "leads.manage")).toBe(true);
    expect(can("sales", "content.edit")).toBe(false);
    expect(can(null, "dashboard.view")).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and can be reset", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("t", "k", 3, 60_000).ok).toBe(true);
    const blocked = rateLimit("t", "k", 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    resetRateLimit("t", "k");
    expect(rateLimit("t", "k", 3, 60_000).ok).toBe(true);
  });
});
