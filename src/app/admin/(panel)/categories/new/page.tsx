import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { saveCategory } from "../actions";
import { CategoryForm } from "../CategoryForm";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm action={saveCategory.bind(null, null)} />
    </>
  );
}
