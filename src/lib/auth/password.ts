import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing with scrypt (memory-hard, built into Node — no native deps).
 * Format: scrypt$N$r$p$saltB64$hashB64 so parameters can be raised later
 * without invalidating existing hashes.
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const MAX_MEM = 128 * N * R * 2;

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LEN, { N, r: R, p: P, maxmem: MAX_MEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: n,
    r,
    p,
    maxmem: 128 * n * r * 2,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  return parts[0] !== "scrypt" || Number(parts[1]) < N || Number(parts[2]) < R;
}

export type PasswordCheck = { ok: true } | { ok: false; reason: string };

/** Minimal but meaningful policy: length over composition rules. */
export function checkPasswordPolicy(password: string, email?: string): PasswordCheck {
  if (password.length < 12) return { ok: false, reason: "Password must be at least 12 characters." };
  if (password.length > 200) return { ok: false, reason: "Password is too long." };
  if (/^(.)\1+$/.test(password)) return { ok: false, reason: "Password is too repetitive." };
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 4) {
    return { ok: false, reason: "Password must not contain your email name." };
  }
  const common = ["password", "123456789", "qwertyuiop", "abcarino", "admin12345"];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    return { ok: false, reason: "Password is too common." };
  }
  return { ok: true };
}

export function generatePassword(length = 20): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_!@#%";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
