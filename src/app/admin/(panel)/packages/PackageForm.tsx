import { asc } from "drizzle-orm";
import {
  BilingualField,
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
import { solutions, type Package } from "@/lib/db/schema";

export async function PackageForm({
  pkg,
  solutionIds,
  action,
}: {
  pkg?: Package;
  solutionIds: string[];
  action: (state: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [cats, sols, mediaMap] = await Promise.all([
    categoryOptions("solution"),
    db.select({ id: solutions.id, titleEn: solutions.titleEn, status: solutions.status }).from(solutions).orderBy(asc(solutions.sortOrder)),
    mediaSummaries([pkg?.imageId, ...(pkg?.gallery ?? [])]),
  ]);
  const p = pkg;
  return (
    <EntityForm action={action} footer={p ? `Last updated ${p.updatedAt.toLocaleString("en-GB")}` : "New package"}>
      <Section title="Visibility">
        <SegmentedField
          name="status"
          label="Status"
          defaultValue={p?.status ?? "coming_soon"}
          options={[
            { value: "available", label: "Available", hint: "Published" },
            { value: "coming_soon", label: "Coming soon", hint: "Visible, not yet offered" },
            { value: "hidden", label: "Hidden", hint: "Not shown" },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField name="featured" label="Featured" defaultChecked={p?.featured} hint="Shown on the home page first." />
          <TextField name="sortOrder" label="Sort order" type="number" defaultValue={p?.sortOrder ?? 0} />
        </div>
      </Section>

      <Section title="Basics">
        <BilingualField base="name" label="Name" en={p?.nameEn} ar={p?.nameAr} required maxLength={120} />
        <SlugField defaultValue={p?.slug} sourceField="nameEn" prefix="/packages/" />
        <SelectField name="categoryId" label="Category" options={cats} defaultValue={p?.categoryId ?? ""} />
        <BilingualField base="tagline" label="Tagline" en={p?.taglineEn} ar={p?.taglineAr} maxLength={300} />
        <BilingualField base="description" label="Description" en={p?.descriptionEn} ar={p?.descriptionAr} multiline rows={6} hint="Paragraphs separated by a blank line; supports - lists and **bold**." />
      </Section>

      <Section title="Pricing" description="You never have to publish a fixed price. “Price on request” is always available.">
        <SegmentedField
          name="pricingMode"
          label="Pricing mode"
          defaultValue={p?.pricingMode ?? "contact"}
          options={[
            { value: "contact", label: "Price on request", hint: "Contact for quote" },
            { value: "starting_from", label: "Starting from", hint: "Shows “from” + amount" },
            { value: "fixed", label: "Fixed price", hint: "Shows the amount" },
            { value: "coming_soon", label: "Coming soon", hint: "No price shown" },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="price" label="Amount" defaultValue={p?.price ?? ""} placeholder="e.g. 25000" hint="Only for Starting from / Fixed." />
          <TextField name="currency" label="Currency" defaultValue={p?.currency ?? "EGP"} maxLength={3} />
        </div>
        <BilingualField base="priceNote" label="Price note (optional)" en={p?.priceNoteEn} ar={p?.priceNoteAr} maxLength={200} hint="e.g. “excluding installation materials”." />
      </Section>

      <Section title="What's included">
        <LocalizedListField name="includedFeatures" label="Included features" defaultValue={p?.includedFeatures ?? []} />
        <LocalizedListField name="optionalFeatures" label="Optional additions" defaultValue={p?.optionalFeatures ?? []} />
      </Section>

      <Section title="Imagery">
        <MediaField name="imageId" label="Main image" defaultValue={p?.imageId ? (mediaMap.get(p.imageId) ?? null) : null} />
        <SelectField name="visualKey" label="Concept illustration (fallback)" options={VISUAL_OPTIONS} defaultValue={p?.visualKey ?? "living"} />
        <GalleryField name="gallery" label="Gallery" defaultValue={(p?.gallery ?? []).map((id) => mediaMap.get(id)).filter((m) => !!m)} />
      </Section>

      <Section title="Call to action & solutions">
        <BilingualField base="ctaLabel" label="Button label (optional)" en={p?.ctaLabelEn} ar={p?.ctaLabelAr} maxLength={60} hint="Defaults to “Request a quote”." />
        <MultiCheckField
          name="solutionIds"
          label="Part of these solutions"
          options={sols.map((s) => ({ value: s.id, label: s.titleEn, note: s.status === "available" ? "" : s.status.replace("_", " ") }))}
          defaultValues={solutionIds}
        />
      </Section>

      <Section title="SEO" description="Optional. Defaults to the name and tagline.">
        <BilingualField base="seoTitle" label="SEO title" en={p?.seoTitleEn} ar={p?.seoTitleAr} maxLength={120} />
        <BilingualField base="seoDescription" label="SEO description" en={p?.seoDescriptionEn} ar={p?.seoDescriptionAr} multiline rows={2} maxLength={320} />
      </Section>
    </EntityForm>
  );
}
