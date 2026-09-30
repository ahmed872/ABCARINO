/**
 * True when a Vercel Blob store is connected. Newer Vercel connections provide
 * BLOB_STORE_ID (the SDK then authenticates with the deployment's OIDC token);
 * older ones provide BLOB_READ_WRITE_TOKEN. Dependency-free: used by
 * next.config.ts, proxy.ts and server code alike.
 */
export function blobConfigured(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
