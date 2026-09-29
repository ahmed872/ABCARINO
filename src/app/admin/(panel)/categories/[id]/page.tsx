import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { saveCategory } from "../actions";
import { CategoryForm } from "../CategoryForm";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={category.nameEn} description={category.nameAr} back={{ href: "/admin/categories", label: "Categories" }} />
      {sp.created ? <Notice tone="success">Category created.</Notice> : null}
      <CategoryForm category={category} action={saveCategory.bind(null, category.id)} />
    </>
  );
}
