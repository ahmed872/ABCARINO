import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { DeleteButton } from "@/components/admin/RowActions";
import { Badge, EmptyState, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { deleteArticle } from "./actions";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const [rows, settings] = await Promise.all([db.select().from(articles).orderBy(desc(articles.updatedAt)), getSettings()]);
  const canDelete = can(user.role, "content.delete");
  return (
    <>
      <PageHeader title="Articles" description="Guides and ideas for the future Insights section. Write in English, Arabic or both." actions={<LinkButton href="/admin/articles/new">New article</LinkButton>} />
      <Notice tone={settings.sections.showInsights ? "success" : "warning"}>
        The public Insights section is currently <strong>{settings.sections.showInsights ? "enabled" : "disabled"}</strong>.{" "}
        <Link href="/admin/settings#sections" className="underline">
          Change in Settings → Sections
        </Link>
        .
      </Notice>
      {sp.deleted ? <Notice tone="success">Article deleted.</Notice> : null}
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Languages</Th>
              <Th>Status</Th>
              <Th>Publish date</Th>
              <Th className="text-end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <Link href={`/admin/articles/${r.id}`} className="font-medium hover:underline">
                    {r.titleEn || r.titleAr}
                  </Link>
                </Td>
                <Td className="text-xs text-stone">{[r.bodyEn && "EN", r.bodyAr && "AR"].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>
                  <Badge status={r.status} />
                </Td>
                <Td className="text-stone">{formatDateTime(r.publishedAt) || "—"}</Td>
                <Td className="whitespace-nowrap text-end">
                  <Link href={`/admin/articles/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                    Edit
                  </Link>
                  {canDelete ? <DeleteButton id={r.id} onDelete={deleteArticle} confirmText={`Delete “${r.titleEn || r.titleAr}”?`} /> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No articles yet" text="Draft articles now and publish them when the Insights section goes live." action={<LinkButton href="/admin/articles/new">Write an article</LinkButton>} />
      )}
    </>
  );
}
