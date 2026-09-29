import { z } from "zod";

/** Validation for everything editable in the admin panel (server-side source of truth). */
const text = (max: number) => z.string().trim().max(max);
const required = (max: number, msg = "Required") => z.string().trim().min(1, msg).max(max);
const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid id");
const optionalUuid = z.union([z.literal(""), uuid]).transform((v) => (v === "" ? null : v));
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug is required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const localizedTextSchema = z.object({ en: text(300), ar: text(300) });
export const localizedListSchema = z
  .array(localizedTextSchema)
  .max(40)
  .transform((items) => items.filter((i) => i.en || i.ar));
export const blockListSchema = z
  .array(z.object({ titleEn: text(120), titleAr: text(120), textEn: text(600), textAr: text(600) }))
  .max(12)
  .transform((items) => items.filter((i) => i.titleEn || i.titleAr || i.textEn || i.textAr));
const galleryIds = z.array(uuid).max(24);

const seo = {
  seoTitleEn: text(120),
  seoTitleAr: text(120),
  seoDescriptionEn: text(320),
  seoDescriptionAr: text(320),
};

export const offeringStatusSchema = z.enum(["available", "coming_soon", "hidden"]);

export const solutionSchema = z.object({
  slug: slugSchema,
  categoryId: optionalUuid,
  titleEn: required(120, "English title is required"),
  titleAr: required(120, "Arabic title is required"),
  summaryEn: text(400),
  summaryAr: text(400),
  descriptionEn: text(8000),
  descriptionAr: text(8000),
  benefits: blockListSchema,
  features: localizedListSchema,
  imageId: optionalUuid,
  gallery: galleryIds,
  visualKey: text(40),
  status: offeringStatusSchema,
  featured: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
  ctaLabelEn: text(60),
  ctaLabelAr: text(60),
  packageIds: z.array(uuid).max(50),
  ...seo,
});

export const packageSchema = z
  .object({
    slug: slugSchema,
    categoryId: optionalUuid,
    nameEn: required(120, "English name is required"),
    nameAr: required(120, "Arabic name is required"),
    taglineEn: text(300),
    taglineAr: text(300),
    descriptionEn: text(8000),
    descriptionAr: text(8000),
    includedFeatures: localizedListSchema,
    optionalFeatures: localizedListSchema,
    imageId: optionalUuid,
    gallery: galleryIds,
    visualKey: text(40),
    pricingMode: z.enum(["contact", "starting_from", "fixed", "coming_soon"]),
    price: z
      .string()
      .trim()
      .transform((v) => v.replace(/[,\s]/g, ""))
      .refine((v) => v === "" || (/^\d{1,10}(\.\d{1,2})?$/.test(v) && Number(v) >= 0), "Enter a valid amount")
      .transform((v) => (v === "" ? null : v)),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
    priceNoteEn: text(200),
    priceNoteAr: text(200),
    status: offeringStatusSchema,
    featured: z.boolean(),
    sortOrder: z.number().int().min(-100000).max(100000),
    ctaLabelEn: text(60),
    ctaLabelAr: text(60),
    solutionIds: z.array(uuid).max(50),
    ...seo,
  })
  .refine((v) => !(v.pricingMode === "fixed" || v.pricingMode === "starting_from") || v.price !== null, {
    path: ["price"],
    message: "A price is required for this pricing mode",
  });

export const categorySchema = z.object({
  scope: z.enum(["solution", "article"]),
  slug: slugSchema,
  nameEn: required(80, "English name is required"),
  nameAr: required(80, "Arabic name is required"),
  descriptionEn: text(300),
  descriptionAr: text(300),
  visualKey: text(40),
  sortOrder: z.number().int().min(-100000).max(100000),
  isVisible: z.boolean(),
});

export const projectSchema = z.object({
  slug: slugSchema,
  categoryId: optionalUuid,
  nameEn: required(120, "English name is required"),
  nameAr: required(120, "Arabic name is required"),
  locationEn: text(160),
  locationAr: text(160),
  descriptionEn: text(8000),
  descriptionAr: text(8000),
  imageId: optionalUuid,
  gallery: galleryIds,
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(v), "Use a YouTube or Vimeo link"),
  servicesUsed: z.array(uuid).max(50),
  completedAt: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date")
    .transform((v) => (v === "" ? null : v)),
  status: z.enum(["published", "hidden"]),
  featured: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
  ...seo,
});

export const partnerSchema = z.object({
  name: required(120, "Name is required"),
  logoId: optionalUuid,
  descriptionEn: text(600),
  descriptionAr: text(600),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/.test(v), "Use a full URL starting with https://"),
  category: text(80),
  relationship: z.enum(["partner", "supplier", "technology_brand", "strategic_partner", "company"]),
  status: z.enum(["published", "hidden"]),
  featured: z.boolean(),
  sortOrder: z.number().int().min(-100000).max(100000),
});

export const articleSchema = z
  .object({
    slug: slugSchema,
    categoryId: optionalUuid,
    titleEn: text(200),
    titleAr: text(200),
    excerptEn: text(400),
    excerptAr: text(400),
    bodyEn: text(50000),
    bodyAr: text(50000),
    imageId: optionalUuid,
    status: z.enum(["draft", "scheduled", "published", "hidden"]),
    publishedAt: z
      .string()
      .trim()
      .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Invalid date")
      .transform((v) => (v === "" ? null : new Date(v))),
    ...seo,
  })
  .refine((v) => v.titleEn || v.titleAr, { path: ["titleEn"], message: "Add a title in at least one language" })
  .refine((v) => v.status !== "scheduled" || v.publishedAt !== null, {
    path: ["publishedAt"],
    message: "Choose a publish date for scheduled articles",
  });

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
});

export const userCreateSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase().max(200),
  name: required(120, "Name is required"),
  role: z.enum(["super_admin", "content_manager", "editor", "sales", "operations"]),
  password: z.string().min(1, "Password is required").max(200),
});

export const userUpdateSchema = z.object({
  name: required(120, "Name is required"),
  role: z.enum(["super_admin", "content_manager", "editor", "sales", "operations"]),
  isActive: z.boolean(),
});

/** Convert a zod error into a flat { field: message } map for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
