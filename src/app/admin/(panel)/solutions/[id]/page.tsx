import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { packageSolutions, solutions } from "@/lib/db/schema";
import { saveSolution } from "../actions";
import { SolutionForm } from "../SolutionForm";

export const metadata: Metadata = { title: "Edit solution" };

export default async function EditSolutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [solution] = await db.select().from(solutions).where(eq(solutions.id, id)).limit(1);
  if (!solution) notFound();
  const links = await db.select({ packageId: packageSolutions.packageId }).from(packageSolutions).where(eq(packageSolutions.solutionId, id));
  const sp = await searchParams;
  return (
    <>
      <PageHeader
        title={solution.titleEn}
        description={solution.titleAr}
        back={{ href: "/admin/solutions", label: "Solutions" }}
        actions={solution.status !== "hidden" ? <LinkButton href={`/en/solutions/${solution.slug}`} variant="ghost">View on site ↗</LinkButton> : null}
      />
      {sp.created ? <Notice tone="success">Solution created.</Notice> : null}
      <SolutionForm solution={solution} packageIds={links.map((l) => l.packageId)} action={saveSolution.bind(null, solution.id)} />
    </>
  );
}
