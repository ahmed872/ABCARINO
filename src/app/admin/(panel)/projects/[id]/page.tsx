import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { saveProject } from "../actions";
import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={project.nameEn} back={{ href: "/admin/projects", label: "Projects" }} />
      {sp.created ? <Notice tone="success">Project created.</Notice> : null}
      <ProjectForm project={project} action={saveProject.bind(null, project.id)} />
    </>
  );
}
