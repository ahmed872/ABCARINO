import { BilingualField, EntityForm, Section, SegmentedField, SelectField, SlugField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaField";
import { categoryOptions, mediaSummaries } from "@/lib/admin/data";
import type { FormState } from "@/lib/admin/form-state";
import type { Article } from "@/lib/db/schema";

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function ArticleForm({ article, action }: { article?: Article; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const a = article;
  const [cats, mediaMap] = await Promise.all([categoryOptions("article"), mediaSummaries([a?.imageId])]);
  return (
    <EntityForm action={action}>
      <Section title="Publishing" description="Scheduled articles go live automatically at the chosen time (within a few minutes).">
        <SegmentedField
          name="status"
          label="Status"
          defaultValue={a?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "published", label: "Published" },
            { value: "hidden", label: "Hidden" },
          ]}
        />
        <TextField name="publishedAt" label="Publish date & time (server time)" type="datetime-local" defaultValue={toLocalInput(a?.publishedAt)} />
      </Section>
      <Section title="Article">
        <BilingualField base="title" label="Title" en={a?.titleEn} ar={a?.titleAr} maxLength={200} hint="An article appears in a language when it has a title in that language; otherwise the other language is shown." />
        <SlugField defaultValue={a?.slug} sourceField="titleEn" prefix="/insights/" />
        <SelectField name="categoryId" label="Category" options={cats} defaultValue={a?.categoryId ?? ""} />
        <BilingualField base="excerpt" label="Excerpt" en={a?.excerptEn} ar={a?.excerptAr} multiline rows={2} maxLength={400} />
        <BilingualField base="body" label="Body" en={a?.bodyEn} ar={a?.bodyAr} multiline rows={16} hint="Markdown: ## Heading, ### Subheading, - list, 1. list, > quote, **bold**, *italic*, [link](https://…)." />
        <MediaField name="imageId" label="Cover image" defaultValue={a?.imageId ? (mediaMap.get(a.imageId) ?? null) : null} />
      </Section>
      <Section title="SEO">
        <BilingualField base="seoTitle" label="SEO title" en={a?.seoTitleEn} ar={a?.seoTitleAr} maxLength={120} />
        <BilingualField base="seoDescription" label="SEO description" en={a?.seoDescriptionEn} ar={a?.seoDescriptionAr} multiline rows={2} maxLength={320} />
      </Section>
    </EntityForm>
  );
}
