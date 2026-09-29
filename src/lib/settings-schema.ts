import { z } from "zod";

/**
 * Site settings, stored as JSON groups in the `settings` table.
 * Every field has a default so a fresh database renders a complete site, and
 * nothing company-specific (phone, WhatsApp, email…) is hard-coded in the UI.
 */
const str = (max = 500) => z.string().trim().max(max).default("");

export const generalSettingsSchema = z.object({
  companyNameEn: str(80).default("ABCARINO"),
  companyNameAr: str(80).default("عبقرينو"),
  taglineEn: str(160).default("Intelligent technology solutions"),
  taglineAr: str(160).default("حلول تقنية ذكية"),
  logoMediaId: str(64),
  faviconMediaId: str(64),
});

export const contactSettingsSchema = z.object({
  whatsappNumber: str(32),
  whatsappMessageEn: str(300).default("Hello ABCARINO, I’d like to talk about a project."),
  whatsappMessageAr: str(300).default("مرحبًا عبقرينو، أود التحدث عن مشروع."),
  email: z.union([z.literal(""), z.email().max(200)]).default(""),
  phone: str(40),
  addressEn: str(300),
  addressAr: str(300),
  mapUrl: str(500),
  businessHoursEn: str(200),
  businessHoursAr: str(200),
});

export const socialSettingsSchema = z.object({
  instagram: str(300),
  facebook: str(300),
  linkedin: str(300),
  x: str(300),
  tiktok: str(300),
  youtube: str(300),
  behance: str(300),
});

export const seoSettingsSchema = z.object({
  titleEn: str(120).default("ABCARINO — Intelligent Technology Solutions"),
  titleAr: str(120).default("عبقرينو — حلول تقنية ذكية"),
  descriptionEn: str(320).default(
    "ABCARINO designs and integrates technology solutions around people, spaces and businesses — smart homes, lighting, entertainment rooms, workspaces and software.",
  ),
  descriptionAr: str(320).default(
    "عبقرينو تصمّم وتدمج حلولًا تقنية حول الناس والمساحات والأعمال — منازل ذكية، إضاءة، غرف ترفيه، مساحات عمل وبرمجيات.",
  ),
  ogImageMediaId: str(64),
  allowIndexing: z.boolean().default(true),
  googleVerification: str(120),
});

export const sectionsSettingsSchema = z.object({
  showPackages: z.boolean().default(true),
  showPackagePrices: z.boolean().default(true),
  showProjects: z.boolean().default(false),
  showPartners: z.boolean().default(false),
  showInsights: z.boolean().default(false),
  showComingSoon: z.boolean().default(true),
});

export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  messageEn: str(400).default("We’re refining a few details. Please check back shortly."),
  messageAr: str(400).default("نعمل على تحسين بعض التفاصيل. يُرجى العودة قريبًا."),
});

export const localizationSettingsSchema = z.object({
  defaultLocale: z.enum(["en", "ar"]).default("en"),
});

export const ctaSettingsSchema = z.object({
  primaryLabelEn: str(60).default("Talk to us on WhatsApp"),
  primaryLabelAr: str(60).default("تحدّث معنا على واتساب"),
  secondaryLabelEn: str(60).default("Request a consultation"),
  secondaryLabelAr: str(60).default("اطلب استشارة"),
  consultationNoteEn: str(400),
  consultationNoteAr: str(400),
});

export const footerSettingsSchema = z.object({
  statementEn: str(300).default("Technology solutions and systems integration — designed around people, spaces and problems."),
  statementAr: str(300).default("حلول تقنية وتكامل أنظمة — مصمّمة حول الناس والمساحات والمشكلات."),
  legalEn: str(200),
  legalAr: str(200),
});

export const pagesSettingsSchema = z.object({
  heroTitleEn: str(140).default("The future, made comfortable."),
  heroTitleAr: str(140).default("المستقبل، بكل راحة."),
  heroSubtitleEn: str(400).default(
    "ABCARINO designs technology around people, spaces and the problems worth solving — from a single smart light to an entire connected environment.",
  ),
  heroSubtitleAr: str(400).default(
    "تصمّم عبقرينو التقنية حول الناس والمساحات والمشكلات التي تستحق الحل — من إضاءة ذكية واحدة إلى بيئة متكاملة بالكامل.",
  ),
  statementEn: str(400).default(
    "Technology is easy to buy and hard to live with. We start with the people, the space and the problem — then design the system around them.",
  ),
  statementAr: str(400).default(
    "من السهل أن تشتري التقنية، ومن الصعب أن تعيش معها. نحن نبدأ بالناس والمكان والمشكلة، ثم نصمّم النظام من حولهم.",
  ),
  aboutIntroEn: str(800).default(
    "ABCARINO is a technology solutions and systems integration company. We listen first, understand the space and the problem, and then design a solution that brings together the right hardware, software and specialists — so technology feels less like equipment and more like comfort.",
  ),
  aboutIntroAr: str(800).default(
    "عبقرينو شركة حلول تقنية وتكامل أنظمة. نبدأ بالاستماع، ونفهم المكان والمشكلة، ثم نصمّم حلًا يجمع الأجهزة والبرمجيات والمتخصصين المناسبين — لتصبح التقنية راحةً تعيشها، لا معدّات تديرها.",
  ),
});

export const settingsSchema = z.object({
  general: generalSettingsSchema.default(generalSettingsSchema.parse({})),
  contact: contactSettingsSchema.default(contactSettingsSchema.parse({})),
  social: socialSettingsSchema.default(socialSettingsSchema.parse({})),
  seo: seoSettingsSchema.default(seoSettingsSchema.parse({})),
  sections: sectionsSettingsSchema.default(sectionsSettingsSchema.parse({})),
  maintenance: maintenanceSettingsSchema.default(maintenanceSettingsSchema.parse({})),
  localization: localizationSettingsSchema.default(localizationSettingsSchema.parse({})),
  cta: ctaSettingsSchema.default(ctaSettingsSchema.parse({})),
  footer: footerSettingsSchema.default(footerSettingsSchema.parse({})),
  pages: pagesSettingsSchema.default(pagesSettingsSchema.parse({})),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type SettingsGroup = keyof SiteSettings;
export const SETTINGS_GROUPS = Object.keys(settingsSchema.shape) as SettingsGroup[];

export const groupSchemas = settingsSchema.shape;

/** Merge raw DB rows into a fully-populated settings object; invalid groups fall back to defaults. */
export function parseSettings(rows: Array<{ key: string; value: unknown }>): SiteSettings {
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.key] = row.value;
  const out: Record<string, unknown> = {};
  for (const group of SETTINGS_GROUPS) {
    const schema = groupSchemas[group];
    const parsed = schema.safeParse(raw[group] ?? undefined);
    out[group] = parsed.success ? parsed.data : schema.parse(undefined);
  }
  return out as SiteSettings;
}

export const defaultSettings: SiteSettings = parseSettings([]);
