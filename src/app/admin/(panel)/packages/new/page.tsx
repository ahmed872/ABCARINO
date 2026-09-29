import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { savePackage } from "../actions";
import { PackageForm } from "../PackageForm";

export const metadata: Metadata = { title: "New package" };

export default async function NewPackagePage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New package" back={{ href: "/admin/packages", label: "Packages" }} />
      <PackageForm solutionIds={[]} action={savePackage.bind(null, null)} />
    </>
  );
}
