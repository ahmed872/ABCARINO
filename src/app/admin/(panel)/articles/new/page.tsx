import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { saveArticle } from "../actions";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New article" back={{ href: "/admin/articles", label: "Articles" }} />
      <ArticleForm action={saveArticle.bind(null, null)} />
    </>
  );
}
