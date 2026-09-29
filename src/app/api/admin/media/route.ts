import { desc, ilike, or, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security/request";
import { MAX_UPLOAD_BYTES, storeImage, UploadError } from "@/lib/storage";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** List media for the picker (content editors and media managers). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(can(user.role, "media.manage") || can(user.role, "content.edit"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1) || 1);
  const pageSize = 48;
  const where = q ? or(ilike(media.originalName, `%${q}%`), ilike(media.altEn, `%${q}%`), ilike(media.altAr, `%${q}%`)) : undefined;
  const [rows, [{ count }]] = await Promise.all([
    db
      .select({ id: media.id, url: media.url, width: media.width, height: media.height, altEn: media.altEn, originalName: media.originalName })
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(media).where(where),
  ]);
  return NextResponse.json({ items: rows, total: count, page, pageSize }, { headers: noStore });
}

/** Upload one image (multipart field "file"). Re-encoded server-side; see lib/storage. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media.manage")) {
    return NextResponse.json({ error: "You do not have permission to upload media." }, { status: 403, headers: noStore });
  }
  const limit = rateLimit("upload", user.id, 60, 10 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429, headers: noStore });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "The file is larger than 15 MB." }, { status: 413, headers: noStore });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400, headers: noStore });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400, headers: noStore });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "The file is larger than 15 MB." }, { status: 413, headers: noStore });

  try {
    const stored = await storeImage(Buffer.from(await file.arrayBuffer()));
    const originalName = file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120);
    const altEn = String(form.get("altEn") ?? "").trim().slice(0, 200);
    const [row] = await db
      .insert(media)
      .values({ ...stored, originalName, altEn, uploadedById: user.id })
      .returning({ id: media.id, url: media.url, width: media.width, height: media.height, altEn: media.altEn, originalName: media.originalName });
    await audit({ userId: user.id, action: "media.upload", entityType: "media", entityId: row.id, summary: `Uploaded ${originalName}`, ip: await getClientIp() });
    revalidatePublicContent();
    return NextResponse.json({ item: row }, { status: 201, headers: noStore });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 422, headers: noStore });
    console.error("[media upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500, headers: noStore });
  }
}
