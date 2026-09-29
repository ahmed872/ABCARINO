import { BilingualField, CheckboxField, EntityForm, Section, SegmentedField, SelectField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaField";
import { mediaSummaries } from "@/lib/admin/data";
import type { FormState } from "@/lib/admin/form-state";
import type { Partner } from "@/lib/db/schema";

export async function PartnerForm({ partner, action }: { partner?: Partner; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const p = partner;
  const mediaMap = await mediaSummaries([p?.logoId]);
  return (
    <EntityForm action={action}>
      <Section title="Visibility">
        <SegmentedField name="status" label="Status" defaultValue={p?.status ?? "hidden"} options={[{ value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }]} />
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField name="featured" label="Featured" defaultChecked={p?.featured} />
          <TextField name="sortOrder" label="Sort order" type="number" defaultValue={p?.sortOrder ?? 0} />
        </div>
      </Section>
      <Section title="Partner">
        <TextField name="name" label="Name" defaultValue={p?.name} required maxLength={120} />
        <SelectField
          name="relationship"
          label="Relationship type"
          defaultValue={p?.relationship ?? "partner"}
          options={[
            { value: "partner", label: "Partner" },
            { value: "supplier", label: "Supplier" },
            { value: "technology_brand", label: "Technology brand" },
            { value: "strategic_partner", label: "Strategic partner" },
            { value: "company", label: "Company" },
          ]}
        />
        <TextField name="category" label="Category (free text)" defaultValue={p?.category} maxLength={80} placeholder="e.g. Lighting, Audio, Networking" />
        <TextField name="websiteUrl" label="Website" defaultValue={p?.websiteUrl} placeholder="https://" />
        <BilingualField base="description" label="Description" en={p?.descriptionEn} ar={p?.descriptionAr} multiline rows={3} maxLength={600} />
        <MediaField name="logoId" label="Logo" defaultValue={p?.logoId ? (mediaMap.get(p.logoId) ?? null) : null} hint="PNG or WebP with a transparent or light background works best." />
      </Section>
    </EntityForm>
  );
}
