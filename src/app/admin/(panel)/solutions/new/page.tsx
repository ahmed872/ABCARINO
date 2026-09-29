import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { saveSolution } from "../actions";
import { SolutionForm } from "../SolutionForm";

export const metadata: Metadata = { title: "New solution" };

export default async function NewSolutionPage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New solution" back={{ href: "/admin/solutions", label: "Solutions" }} />
      <SolutionForm packageIds={[]} action={saveSolution.bind(null, null)} />
    </>
  );
}
