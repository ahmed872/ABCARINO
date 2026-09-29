import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { deleteMedia, updateMedia } from "./actions";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  await requirePageUser("media.manage");
  const rows = await db.select().from(media).orderBy(desc(media.createdAt)).limit(500);
  return (
    <>
      <PageHeader
        title="Media library"
        description="Every upload is converted to optimised WebP, resized to at most 2400px and stripped of location metadata. Add alt text in both languages for accessibility and SEO."
      />
      <MediaLibrary
        items={rows.map((r) => ({
          id: r.id,
          url: r.url,
          width: r.width,
          height: r.height,
          sizeBytes: r.sizeBytes,
          originalName: r.originalName,
          altEn: r.altEn,
          altAr: r.altAr,
          isInspiration: r.isInspiration,
          createdAt: r.createdAt.toISOString(),
        }))}
        update={updateMedia}
        remove={deleteMedia}
      />
    </>
  );
}
