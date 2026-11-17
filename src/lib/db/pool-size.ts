/**
 * Connections per app instance, from DATABASE_POOL_SIZE.
 *
 * Unset or blank means the default (10; 3 on Vercel, where every serverless
 * instance holds its own pool). `.env.example` ships the variable blank, and a
 * blank value must not become `Number("") === 0`: postgres.js then never opens
 * a connection and every query waits forever, with no error.
 * Anything else that isn't a whole number ≥ 1 is a configuration mistake and
 * fails loudly instead of hanging.
 */
export function databasePoolSize(raw: string | undefined, onVercel: boolean): number {
  const fallback = onVercel ? 3 : 10;
  const value = raw?.trim();
  if (!value) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error(`DATABASE_POOL_SIZE must be a whole number of at least 1 (got "${value}"). Leave it empty for the default (${fallback}).`);
  }
  return Number(value);
}
