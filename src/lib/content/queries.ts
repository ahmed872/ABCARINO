/**
 * Raw public read-models. Returned objects are JSON-safe (no Date instances) so
 * they can be cached by Next's data cache. Hidden records never leave this file.
 */
import { and, asc, desc, eq, inArray, lte, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articles,
  categories,
  media,
  packageSolutions,
  packages,
  partners,
  projects,
  settings,
  solutions,
  type LocalizedBlock,
  type LocalizedText,
  type OfferingStatus,
  type PricingMode,
  type PartnerRelation,
} from "@/lib/db/schema";
import { parseSettings, type SiteSettings } from "@/lib/settings-schema";

export type PublicMedia = {
  id: string;
  url: string;
  width: number;
  height: number;
  altEn: string;
  altAr: string;
  isInspiration: boolean;
};

export type PublicCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  visualKey: string;
};

type Seo = { seoTitleEn: string; seoTitleAr: string; seoDescriptionEn: string; seoDescriptionAr: string };

export type PublicSolution = Seo & {
  id: string;
  slug: string;
  categoryId: string | null;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  descriptionEn: string;
  descriptionAr: string;
  benefits: LocalizedBlock[];
  features: LocalizedText[];
  image: PublicMedia | null;
  gallery: PublicMedia[];
  visualKey: string;
  status: Exclude<OfferingStatus, "hidden">;
  featured: boolean;
  ctaLabelEn: string;
  ctaLabelAr: string;
  packageIds: string[];
  updatedAt: string;
};

export type PublicPackage = Seo & {
  id: string;
  slug: string;
  categoryId: string | null;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  includedFeatures: LocalizedText[];
  optionalFeatures: LocalizedText[];
  image: PublicMedia | null;
  gallery: PublicMedia[];
  visualKey: string;
  pricingMode: PricingMode;
  price: string | null;
  currency: string;
  priceNoteEn: string;
  priceNoteAr: string;
  status: Exclude<OfferingStatus, "hidden">;
  featured: boolean;
  ctaLabelEn: string;
  ctaLabelAr: string;
  solutionIds: string[];
  updatedAt: string;
};

export type Catalog = {
  categories: PublicCategory[];
  solutions: PublicSolution[];
  packages: PublicPackage[];
};

async function loadMedia(ids: Array<string | null | undefined>): Promise<Map<string, PublicMedia>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map();
  const rows = await db
    .select({
      id: media.id,
      url: media.url,
      width: media.width,
      height: media.height,
      altEn: media.altEn,
      altAr: media.altAr,
      isInspiration: media.isInspiration,
    })
    .from(media)
    .where(inArray(media.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}

function resolveGallery(ids: string[], map: Map<string, PublicMedia>): PublicMedia[] {
  return ids.map((id) => map.get(id)).filter((m): m is PublicMedia => !!m);
}

export async function querySettings(): Promise<SiteSettings> {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  return parseSettings(rows);
}

export async function queryCatalog(): Promise<Catalog> {
  const [cats, sols, pkgs, links] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.scope, "solution"), eq(categories.isVisible, true)))
      .orderBy(asc(categories.sortOrder), asc(categories.nameEn)),
    db
      .select()
      .from(solutions)
      .where(ne(solutions.status, "hidden"))
      .orderBy(asc(solutions.sortOrder), asc(solutions.titleEn)),
    db
      .select()
      .from(packages)
      .where(ne(packages.status, "hidden"))
      .orderBy(asc(packages.sortOrder), asc(packages.nameEn)),
    db.select().from(packageSolutions),
  ]);

  const mediaMap = await loadMedia([
    ...sols.flatMap((s) => [s.imageId, ...s.gallery]),
    ...pkgs.flatMap((p) => [p.imageId, ...p.gallery]),
  ]);

  const visiblePackageIds = new Set(pkgs.map((p) => p.id));
  const visibleSolutionIds = new Set(sols.map((s) => s.id));

  return {
    categories: cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      descriptionEn: c.descriptionEn,
      descriptionAr: c.descriptionAr,
      visualKey: c.visualKey,
    })),
    solutions: sols.map((s) => ({
      id: s.id,
      slug: s.slug,
      categoryId: s.categoryId,
      titleEn: s.titleEn,
      titleAr: s.titleAr,
      summaryEn: s.summaryEn,
      summaryAr: s.summaryAr,
      descriptionEn: s.descriptionEn,
      descriptionAr: s.descriptionAr,
      benefits: s.benefits,
      features: s.features,
      image: s.imageId ? (mediaMap.get(s.imageId) ?? null) : null,
      gallery: resolveGallery(s.gallery, mediaMap),
      visualKey: s.visualKey,
      status: s.status as PublicSolution["status"],
      featured: s.featured,
      ctaLabelEn: s.ctaLabelEn,
      ctaLabelAr: s.ctaLabelAr,
      seoTitleEn: s.seoTitleEn,
      seoTitleAr: s.seoTitleAr,
      seoDescriptionEn: s.seoDescriptionEn,
      seoDescriptionAr: s.seoDescriptionAr,
      packageIds: links.filter((l) => l.solutionId === s.id && visiblePackageIds.has(l.packageId)).map((l) => l.packageId),
      updatedAt: s.updatedAt.toISOString(),
    })),
    packages: pkgs.map((p) => ({
      id: p.id,
      slug: p.slug,
      categoryId: p.categoryId,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      taglineEn: p.taglineEn,
      taglineAr: p.taglineAr,
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      includedFeatures: p.includedFeatures,
      optionalFeatures: p.optionalFeatures,
      image: p.imageId ? (mediaMap.get(p.imageId) ?? null) : null,
      gallery: resolveGallery(p.gallery, mediaMap),
      visualKey: p.visualKey,
      pricingMode: p.pricingMode,
      price: p.price,
      currency: p.currency,
      priceNoteEn: p.priceNoteEn,
      priceNoteAr: p.priceNoteAr,
      status: p.status as PublicPackage["status"],
      featured: p.featured,
      ctaLabelEn: p.ctaLabelEn,
      ctaLabelAr: p.ctaLabelAr,
      seoTitleEn: p.seoTitleEn,
      seoTitleAr: p.seoTitleAr,
      seoDescriptionEn: p.seoDescriptionEn,
      seoDescriptionAr: p.seoDescriptionAr,
      solutionIds: links.filter((l) => l.packageId === p.id && visibleSolutionIds.has(l.solutionId)).map((l) => l.solutionId),
      updatedAt: p.updatedAt.toISOString(),
    })),
  };
}

/* ------------------------------------------------ prepared sections */

export type PublicProject = Seo & {
  id: string;
  slug: string;
  categoryId: string | null;
  nameEn: string;
  nameAr: string;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: PublicMedia | null;
  gallery: PublicMedia[];
  videoUrl: string;
  servicesUsed: string[];
  completedAt: string | null;
  featured: boolean;
  updatedAt: string;
};

export async function queryProjects(): Promise<PublicProject[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(asc(projects.sortOrder), desc(projects.completedAt));
  const mediaMap = await loadMedia(rows.flatMap((r) => [r.imageId, ...r.gallery]));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    categoryId: r.categoryId,
    nameEn: r.nameEn,
    nameAr: r.nameAr,
    locationEn: r.locationEn,
    locationAr: r.locationAr,
    descriptionEn: r.descriptionEn,
    descriptionAr: r.descriptionAr,
    image: r.imageId ? (mediaMap.get(r.imageId) ?? null) : null,
    gallery: resolveGallery(r.gallery, mediaMap),
    videoUrl: r.videoUrl,
    servicesUsed: r.servicesUsed,
    completedAt: r.completedAt,
    featured: r.featured,
    seoTitleEn: r.seoTitleEn,
    seoTitleAr: r.seoTitleAr,
    seoDescriptionEn: r.seoDescriptionEn,
    seoDescriptionAr: r.seoDescriptionAr,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export type PublicPartner = {
  id: string;
  name: string;
  logo: PublicMedia | null;
  descriptionEn: string;
  descriptionAr: string;
  websiteUrl: string;
  category: string;
  relationship: PartnerRelation;
  featured: boolean;
};

export async function queryPartners(): Promise<PublicPartner[]> {
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.status, "published"))
    .orderBy(asc(partners.sortOrder), asc(partners.name));
  const mediaMap = await loadMedia(rows.map((r) => r.logoId));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    logo: r.logoId ? (mediaMap.get(r.logoId) ?? null) : null,
    descriptionEn: r.descriptionEn,
    descriptionAr: r.descriptionAr,
    websiteUrl: r.websiteUrl,
    category: r.category,
    relationship: r.relationship,
    featured: r.featured,
  }));
}

export type PublicArticle = Seo & {
  id: string;
  slug: string;
  categoryId: string | null;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  bodyEn: string;
  bodyAr: string;
  image: PublicMedia | null;
  publishedAt: string;
  updatedAt: string;
};

/** Published articles, including scheduled ones whose publish time has passed. */
export async function queryArticles(now = new Date()): Promise<PublicArticle[]> {
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        or(eq(articles.status, "published"), eq(articles.status, "scheduled")),
        lte(articles.publishedAt, now),
      ),
    )
    .orderBy(desc(articles.publishedAt));
  const mediaMap = await loadMedia(rows.map((r) => r.imageId));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    categoryId: r.categoryId,
    titleEn: r.titleEn,
    titleAr: r.titleAr,
    excerptEn: r.excerptEn,
    excerptAr: r.excerptAr,
    bodyEn: r.bodyEn,
    bodyAr: r.bodyAr,
    image: r.imageId ? (mediaMap.get(r.imageId) ?? null) : null,
    publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    seoTitleEn: r.seoTitleEn,
    seoTitleAr: r.seoTitleAr,
    seoDescriptionEn: r.seoDescriptionEn,
    seoDescriptionAr: r.seoDescriptionAr,
  }));
}

export async function queryArticleCategories(): Promise<PublicCategory[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.scope, "article"), eq(categories.isVisible, true)))
    .orderBy(asc(categories.sortOrder));
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
    descriptionEn: c.descriptionEn,
    descriptionAr: c.descriptionAr,
    visualKey: c.visualKey,
  }));
}

export async function queryMediaById(id: string): Promise<PublicMedia | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const map = await loadMedia([id]);
  return map.get(id) ?? null;
}
