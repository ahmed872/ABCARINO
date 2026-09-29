import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { saveArticle } from "../actions";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!article) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={article.titleEn || article.titleAr || "Untitled"} back={{ href: "/admin/articles", label: "Articles" }} />
      {sp.created ? <Notice tone="success">Article created.</Notice> : null}
      <ArticleForm article={article} action={saveArticle.bind(null, article.id)} />
    </>
  );
}
