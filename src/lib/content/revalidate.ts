import "server-only";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "./public";

/** Expire all cached public content immediately (read-your-writes for admins). */
export function revalidatePublicContent() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
}
