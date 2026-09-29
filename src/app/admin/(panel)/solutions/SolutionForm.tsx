import { asc } from "drizzle-orm";
import {
  BilingualField,
  BlockListField,
  CheckboxField,
  EntityForm,
  LocalizedListField,
  MultiCheckField,
  Section,
  SegmentedField,
  SelectField,
  SlugField,
  TextField,
} from "@/components/admin/fields";
import { GalleryField, MediaField } from "@/components/admin/MediaField";
import { VISUAL_OPTIONS } from "@/components/illustrations/visual-options";
import { categoryOptions, mediaSummaries } from "@/lib/admin/data";
import type { FormState } from "@/lib/admin/form-state";
import { db } from "@/lib/db";
import { packages, type Solution } from "@/lib/db/schema";

const MD_HINT = "Paragraphs are separated by a blank line. Supports ## headings, - lists, **bold** and [links](https://…).";

export async function SolutionForm({
  solution,
  packageIds,
  action,
}: {
  solution?: Solution;
  packageIds: string[];
  action: (state: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [cats, pkgs, mediaMap] = await Promise.all([
    categoryOptions("solution"),
    db.select({ id: packages.id, nameEn: packages.nameEn, status: packages.status }).from(packages).orderBy(asc(packages.sortOrder)),
    mediaSummaries([solution?.imageId, ...(solution?.gallery ?? [])]),
  ]);
  const s = solution;
  return (
    <EntityForm action={action} footer={s ? `Last updated ${s.updatedAt.toLocaleString("en-GB")}` : "New solution"}>
      <Section title="Visibility" description="Available = fully published. Coming soon = shown as “in preparation”. Hidden = not on the website.">
        <SegmentedField
          name="status"
          label="Status"
          defaultValue={s?.status ?? "coming_soon"}
          options={[
            { value: "available", label: "Available", hint: "Published & bookable" },
            { value: "coming_soon", label: "Coming soon", hint: "Visible, marked in preparation" },
            { value: "hidden", label: "Hidden", hint: "Not shown anywhere" },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField name="featured" label="Featured" defaultChecked={s?.featured} hint="Prioritised on the home page." />
          <TextField name="sortOrder" label="Sort order" type="number" defaultValue={s?.sortOrder ?? 0} hint="Lower numbers appear first. Or use the arrows in the list." />
        </div>
      </Section>

      <Section title="Basics">
        <BilingualField base="title" label="Title" en={s?.titleEn} ar={s?.titleAr} required maxLength={120} />
        <SlugField defaultValue={s?.slug} sourceField="titleEn" prefix="/solutions/" />
        <SelectField name="categoryId" label="Category" options={cats} defaultValue={s?.categoryId ?? ""} />
        <BilingualField base="summary" label="Short summary" en={s?.summaryEn} ar={s?.summaryAr} multiline rows={3} maxLength={400} hint="Shown on cards and as the page introduction." />
        <BilingualField base="description" label="Full description" en={s?.descriptionEn} ar={s?.descriptionAr} multiline rows={8} hint={MD_HINT} />
      </Section>

      <Section title="Details">
        <LocalizedListField name="features" label="What's included (features)" defaultValue={s?.features ?? []} />
        <BlockListField name="benefits" label="What it changes (benefits)" defaultValue={s?.benefits ?? []} hint="Two to four short benefits work best." />
      </Section>

      <Section title="Imagery" description="Without an image, the site shows the selected concept illustration. Upload real photography when you have it.">
        <MediaField name="imageId" label="Hero image" defaultValue={s?.imageId ? (mediaMap.get(s.imageId) ?? null) : null} />
        <SelectField name="visualKey" label="Concept illustration (fallback)" options={VISUAL_OPTIONS} defaultValue={s?.visualKey ?? "living"} />
        <GalleryField name="gallery" label="Gallery" defaultValue={(s?.gallery ?? []).map((id) => mediaMap.get(id)).filter((m) => !!m)} />
      </Section>

      <Section title="Call to action & packages">
        <BilingualField base="ctaLabel" label="Button label (optional)" en={s?.ctaLabelEn} ar={s?.ctaLabelAr} maxLength={60} hint="Leave empty to use the default WhatsApp label from Settings." />
        <MultiCheckField
          name="packageIds"
          label="Related packages"
          options={pkgs.map((p) => ({ value: p.id, label: p.nameEn, note: p.status === "available" ? "" : p.status.replace("_", " ") }))}
          defaultValues={packageIds}
        />
      </Section>

      <Section title="SEO" description="Optional. Defaults to the title and summary.">
        <BilingualField base="seoTitle" label="SEO title" en={s?.seoTitleEn} ar={s?.seoTitleAr} maxLength={120} />
        <BilingualField base="seoDescription" label="SEO description" en={s?.seoDescriptionEn} ar={s?.seoDescriptionAr} multiline rows={2} maxLength={320} />
      </Section>
    </EntityForm>
  );
}
