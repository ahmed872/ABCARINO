/**
 * ABCARINO content & operations schema.
 *
 * Conventions
 * - Bilingual content lives in paired columns (`titleEn` / `titleAr`), never in
 *   runtime translation. Lists of bilingual strings use `LocalizedText[]` JSON.
 * - Every public entity has `status` + `sortOrder` so the founders can publish,
 *   hide and reorder without code.
 * - Column names are camelCase in TypeScript and snake_case in Postgres
 *   (drizzle `casing: "snake_case"`).
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type LocalizedText = { en: string; ar: string };
export type LocalizedBlock = { titleEn: string; titleAr: string; textEn: string; textAr: string };

/* ------------------------------------------------------------------ enums */

export const userRole = pgEnum("user_role", [
  "super_admin",
  "content_manager",
  "editor",
  "sales",
  "operations",
]);

/** Visibility of a solution or package on the public site. */
export const offeringStatus = pgEnum("offering_status", ["available", "coming_soon", "hidden"]);

export const pricingMode = pgEnum("pricing_mode", ["contact", "starting_from", "fixed", "coming_soon"]);

export const publishStatus = pgEnum("publish_status", ["published", "hidden"]);

export const articleStatus = pgEnum("article_status", ["draft", "scheduled", "published", "hidden"]);

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
]);

export const contactMethod = pgEnum("contact_method", ["whatsapp", "phone", "email"]);

export const partnerRelation = pgEnum("partner_relation", [
  "partner",
  "supplier",
  "technology_brand",
  "strategic_partner",
  "company",
]);

export const categoryScope = pgEnum("category_scope", ["solution", "article"]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const seoColumns = {
  seoTitleEn: text().notNull().default(""),
  seoTitleAr: text().notNull().default(""),
  seoDescriptionEn: text().notNull().default(""),
  seoDescriptionAr: text().notNull().default(""),
};

/* ------------------------------------------------------------ identity */

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text().notNull(),
  role: userRole().notNull().default("editor"),
  isActive: boolean().notNull().default(true),
  failedLoginCount: integer().notNull().default(0),
  lockedUntil: timestamp({ withTimezone: true }),
  lastLoginAt: timestamp({ withTimezone: true }),
  passwordChangedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token. The raw token only ever lives in the cookie. */
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ip: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ---------------------------------------------------------------- media */

export const media = pgTable(
  "media",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** File name inside the storage directory (random, never user supplied). */
    storageKey: text().notNull().unique(),
    url: text().notNull(),
    originalName: text().notNull().default(""),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    altEn: text().notNull().default(""),
    altAr: text().notNull().default(""),
    /** Marks stock / concept imagery so it is never presented as ABCARINO's own work. */
    isInspiration: boolean().notNull().default(false),
    uploadedById: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("media_created_idx").on(t.createdAt)],
);

/* ------------------------------------------------------------- catalog */

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    scope: categoryScope().notNull().default("solution"),
    slug: text().notNull(),
    nameEn: text().notNull(),
    nameAr: text().notNull(),
    descriptionEn: text().notNull().default(""),
    descriptionAr: text().notNull().default(""),
    /** Key of the built-in concept illustration used when no image is set. */
    visualKey: text().notNull().default("living"),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("categories_scope_idx").on(t.scope, t.sortOrder),
    uniqueIndex("categories_scope_slug_idx").on(t.scope, t.slug),
  ],
);

export const solutions = pgTable(
  "solutions",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    titleEn: text().notNull(),
    titleAr: text().notNull(),
    summaryEn: text().notNull().default(""),
    summaryAr: text().notNull().default(""),
    descriptionEn: text().notNull().default(""),
    descriptionAr: text().notNull().default(""),
    benefits: jsonb().$type<LocalizedBlock[]>().notNull().default([]),
    features: jsonb().$type<LocalizedText[]>().notNull().default([]),
    imageId: uuid().references(() => media.id, { onDelete: "set null" }),
    gallery: jsonb().$type<string[]>().notNull().default([]),
    visualKey: text().notNull().default("living"),
    status: offeringStatus().notNull().default("hidden"),
    featured: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    ctaLabelEn: text().notNull().default(""),
    ctaLabelAr: text().notNull().default(""),
    ...seoColumns,
    ...timestamps,
  },
  (t) => [index("solutions_status_idx").on(t.status, t.sortOrder)],
);

export const packages = pgTable(
  "packages",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    nameEn: text().notNull(),
    nameAr: text().notNull(),
    taglineEn: text().notNull().default(""),
    taglineAr: text().notNull().default(""),
    descriptionEn: text().notNull().default(""),
    descriptionAr: text().notNull().default(""),
    includedFeatures: jsonb().$type<LocalizedText[]>().notNull().default([]),
    optionalFeatures: jsonb().$type<LocalizedText[]>().notNull().default([]),
    imageId: uuid().references(() => media.id, { onDelete: "set null" }),
    gallery: jsonb().$type<string[]>().notNull().default([]),
    visualKey: text().notNull().default("living"),
    pricingMode: pricingMode().notNull().default("contact"),
    price: numeric({ precision: 12, scale: 2 }),
    currency: text().notNull().default("EGP"),
    priceNoteEn: text().notNull().default(""),
    priceNoteAr: text().notNull().default(""),
    status: offeringStatus().notNull().default("hidden"),
    featured: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    ctaLabelEn: text().notNull().default(""),
    ctaLabelAr: text().notNull().default(""),
    ...seoColumns,
    ...timestamps,
  },
  (t) => [index("packages_status_idx").on(t.status, t.sortOrder)],
);

export const packageSolutions = pgTable(
  "package_solutions",
  {
    packageId: uuid()
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    solutionId: uuid()
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.solutionId] })],
);

/* ------------------------------------------- prepared (initially hidden) */

export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
  nameEn: text().notNull(),
  nameAr: text().notNull(),
  locationEn: text().notNull().default(""),
  locationAr: text().notNull().default(""),
  descriptionEn: text().notNull().default(""),
  descriptionAr: text().notNull().default(""),
  imageId: uuid().references(() => media.id, { onDelete: "set null" }),
  gallery: jsonb().$type<string[]>().notNull().default([]),
  videoUrl: text().notNull().default(""),
  /** Solution ids used on the project. */
  servicesUsed: jsonb().$type<string[]>().notNull().default([]),
  completedAt: date(),
  status: publishStatus().notNull().default("hidden"),
  featured: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  ...seoColumns,
  ...timestamps,
});

export const partners = pgTable("partners", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  logoId: uuid().references(() => media.id, { onDelete: "set null" }),
  descriptionEn: text().notNull().default(""),
  descriptionAr: text().notNull().default(""),
  websiteUrl: text().notNull().default(""),
  category: text().notNull().default(""),
  relationship: partnerRelation().notNull().default("partner"),
  status: publishStatus().notNull().default("hidden"),
  featured: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  ...timestamps,
});

export const articles = pgTable(
  "articles",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    titleEn: text().notNull().default(""),
    titleAr: text().notNull().default(""),
    excerptEn: text().notNull().default(""),
    excerptAr: text().notNull().default(""),
    /** Lightweight Markdown (headings, lists, emphasis, links). */
    bodyEn: text().notNull().default(""),
    bodyAr: text().notNull().default(""),
    imageId: uuid().references(() => media.id, { onDelete: "set null" }),
    status: articleStatus().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    ...seoColumns,
    ...timestamps,
  },
  (t) => [index("articles_status_idx").on(t.status, t.publishedAt)],
);

/* ---------------------------------------------------------------- leads */

export const leads = pgTable(
  "leads",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    phone: text().notNull().default(""),
    email: text().notNull().default(""),
    projectType: text().notNull().default(""),
    message: text().notNull().default(""),
    preferredContact: contactMethod().notNull().default("whatsapp"),
    locale: text().notNull().default("en"),
    sourcePath: text().notNull().default(""),
    status: leadStatus().notNull().default("new"),
    /** HMAC of the submitter IP — enough for abuse analysis, not reversible. */
    ipHash: text().notNull().default(""),
    userAgent: text().notNull().default(""),
    ...timestamps,
  },
  (t) => [index("leads_status_idx").on(t.status, t.createdAt)],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    leadId: uuid()
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_notes_lead_idx").on(t.leadId)],
);

/* ------------------------------------------------------ settings & audit */

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedById: uuid().references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    summary: text().notNull().default(""),
    meta: jsonb().$type<Record<string, unknown>>(),
    ip: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Solution = typeof solutions.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadNote = typeof leadNotes.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type OfferingStatus = (typeof offeringStatus.enumValues)[number];
export type PricingMode = (typeof pricingMode.enumValues)[number];
export type LeadStatus = (typeof leadStatus.enumValues)[number];
export type ArticleStatus = (typeof articleStatus.enumValues)[number];
export type PublishStatus = (typeof publishStatus.enumValues)[number];
export type PartnerRelation = (typeof partnerRelation.enumValues)[number];
export type ContactMethod = (typeof contactMethod.enumValues)[number];
