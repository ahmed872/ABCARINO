import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { DeleteButton, MoveButtons, StatusSelect } from "@/components/admin/RowActions";
import { EmptyState, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { deleteProject, moveProject, setProjectStatus } from "./actions";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const [rows, settings] = await Promise.all([db.select().from(projects).orderBy(asc(projects.sortOrder)), getSettings()]);
  const canDelete = can(user.role, "content.delete");
  return (
    <>
      <PageHeader title="Projects" description="Real, completed work only. Keep the section hidden until you have projects you're proud to show." actions={<LinkButton href="/admin/projects/new">New project</LinkButton>} />
      <Notice tone={settings.sections.showProjects ? "success" : "warning"}>
        The public Projects page is currently <strong>{settings.sections.showProjects ? "enabled" : "disabled"}</strong>.{" "}
        <Link href="/admin/settings#sections" className="underline">
          Change in Settings → Sections
        </Link>
        .
      </Notice>
      {sp.deleted ? <Notice tone="success">Project deleted.</Notice> : null}
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th className="w-20">Order</Th>
              <Th>Project</Th>
              <Th>Completed</Th>
              <Th>Status</Th>
              <Th className="text-end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <MoveButtons id={r.id} onMove={moveProject} />
                </Td>
                <Td>
                  <Link href={`/admin/projects/${r.id}`} className="font-medium hover:underline">
                    {r.nameEn}
                  </Link>
                  <p className="text-xs text-stone">{r.locationEn}</p>
                </Td>
                <Td className="text-stone">{r.completedAt ?? "—"}</Td>
                <Td>
                  <StatusSelect id={r.id} value={r.status} options={[{ value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }]} onChange={setProjectStatus} />
                </Td>
                <Td className="whitespace-nowrap text-end">
                  <Link href={`/admin/projects/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                    Edit
                  </Link>
                  {canDelete ? <DeleteButton id={r.id} onDelete={deleteProject} confirmText={`Delete “${r.nameEn}”?`} /> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No projects yet" text="When ABCARINO completes real installations, document them here with photos, the solutions used and the location." action={<LinkButton href="/admin/projects/new">Add first project</LinkButton>} />
      )}
    </>
  );
}
