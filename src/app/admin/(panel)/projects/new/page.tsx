import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { saveProject } from "../actions";
import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New project" back={{ href: "/admin/projects", label: "Projects" }} />
      <ProjectForm action={saveProject.bind(null, null)} />
    </>
  );
}
