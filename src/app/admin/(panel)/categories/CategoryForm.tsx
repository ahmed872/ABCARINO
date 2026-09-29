import { BilingualField, CheckboxField, EntityForm, Section, SelectField, SlugField, TextField } from "@/components/admin/fields";
import { VISUAL_OPTIONS } from "@/components/illustrations/visual-options";
import type { FormState } from "@/lib/admin/form-state";
import type { Category } from "@/lib/db/schema";

export function CategoryForm({ category, action }: { category?: Category; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const c = category;
  return (
    <EntityForm action={action}>
      <Section title="Category">
        <SelectField
          name="scope"
          label="Used for"
          defaultValue={c?.scope ?? "solution"}
          options={[
            { value: "solution", label: "Solutions, packages & projects" },
            { value: "article", label: "Articles (Insights)" },
          ]}
        />
        <BilingualField base="name" label="Name" en={c?.nameEn} ar={c?.nameAr} required maxLength={80} />
        <SlugField defaultValue={c?.slug} sourceField="nameEn" prefix="#" />
        <BilingualField base="description" label="Short description" en={c?.descriptionEn} ar={c?.descriptionAr} multiline rows={2} maxLength={300} />
        <SelectField name="visualKey" label="Concept illustration" options={VISUAL_OPTIONS} defaultValue={c?.visualKey ?? "living"} />
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField name="isVisible" label="Visible on the website" defaultChecked={c?.isVisible ?? true} />
          <TextField name="sortOrder" label="Sort order" type="number" defaultValue={c?.sortOrder ?? 0} />
        </div>
      </Section>
    </EntityForm>
  );
}
