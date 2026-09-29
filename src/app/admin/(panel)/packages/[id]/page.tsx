import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { packageSolutions, packages } from "@/lib/db/schema";
import { savePackage } from "../actions";
import { PackageForm } from "../PackageForm";

export const metadata: Metadata = { title: "Edit package" };

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) notFound();
  const links = await db.select({ solutionId: packageSolutions.solutionId }).from(packageSolutions).where(eq(packageSolutions.packageId, id));
  const sp = await searchParams;
  return (
    <>
      <PageHeader
        title={pkg.nameEn}
        description={pkg.nameAr}
        back={{ href: "/admin/packages", label: "Packages" }}
        actions={pkg.status !== "hidden" ? <LinkButton href={`/en/packages/${pkg.slug}`} variant="ghost">View on site ↗</LinkButton> : null}
      />
      {sp.created ? <Notice tone="success">Package created.</Notice> : null}
      <PackageForm pkg={pkg} solutionIds={links.map((l) => l.solutionId)} action={savePackage.bind(null, pkg.id)} />
    </>
  );
}
