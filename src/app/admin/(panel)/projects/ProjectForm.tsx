import { asc } from "drizzle-orm";
import { BilingualField, CheckboxField, EntityForm, MultiCheckField, Section, SegmentedField, SelectField, SlugField, TextField } from "@/components/admin/fields";
import { GalleryField, MediaField } from "@/components/admin/MediaField";
import { categoryOptions, mediaSummaries } from "@/lib/admin/data";
import type { FormState } from "@/lib/admin/form-state";
import { db } from "@/lib/db";
import { solutions, type Project } from "@/lib/db/schema";

export async function ProjectForm({ project, action }: { project?: Project; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const p = project;
  const [cats, sols, mediaMap] = await Promise.all([
    categoryOptions("solution"),
    db.select({ id: solutions.id, titleEn: solutions.titleEn }).from(solutions).orderBy(asc(solutions.sortOrder)),
    mediaSummaries([p?.imageId, ...(p?.gallery ?? [])]),
  ]);
  return (
    <EntityForm action={action}>
      <Section title="Visibility">
        <SegmentedField name="status" label="Status" defaultValue={p?.status ?? "hidden"} options={[{ value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }]} />
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField name="featured" label="Featured" defaultChecked={p?.featured} />
          <TextField name="sortOrder" label="Sort order" type="number" defaultValue={p?.sortOrder ?? 0} />
        </div>
      </Section>
      <Section title="Project">
        <BilingualField base="name" label="Project name" en={p?.nameEn} ar={p?.nameAr} required maxLength={120} />
        <SlugField defaultValue={p?.slug} sourceField="nameEn" prefix="/projects/" />
        <BilingualField base="location" label="Location" en={p?.locationEn} ar={p?.locationAr} maxLength={160} />
        <SelectField name="categoryId" label="Category" options={cats} defaultValue={p?.categoryId ?? ""} />
        <TextField name="completedAt" label="Completion date" type="date" defaultValue={p?.completedAt ?? ""} />
        <BilingualField base="description" label="Description" en={p?.descriptionEn} ar={p?.descriptionAr} multiline rows={8} hint="Tell the story: the space, the problem, what was designed and installed." />
        <MultiCheckField name="servicesUsed" label="Solutions used" options={sols.map((s) => ({ value: s.id, label: s.titleEn }))} defaultValues={p?.servicesUsed ?? []} />
      </Section>
      <Section title="Media">
        <MediaField name="imageId" label="Cover image" defaultValue={p?.imageId ? (mediaMap.get(p.imageId) ?? null) : null} />
        <GalleryField name="gallery" label="Gallery" defaultValue={(p?.gallery ?? []).map((id) => mediaMap.get(id)).filter((m) => !!m)} />
        <TextField name="videoUrl" label="Video (YouTube or Vimeo link)" defaultValue={p?.videoUrl} placeholder="https://www.youtube.com/watch?v=…" />
      </Section>
      <Section title="SEO">
        <BilingualField base="seoTitle" label="SEO title" en={p?.seoTitleEn} ar={p?.seoTitleAr} maxLength={120} />
        <BilingualField base="seoDescription" label="SEO description" en={p?.seoDescriptionEn} ar={p?.seoDescriptionAr} multiline rows={2} maxLength={320} />
      </Section>
    </EntityForm>
  );
}
