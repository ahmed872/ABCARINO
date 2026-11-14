/**
 * RENO's live knowledge: built on the server from what the site itself publishes — the CMS
 * catalogue (solutions, packages, categories), the contact settings and the page copy in the
 * dictionaries. Nothing is invented here: every answer quotes published content, and where
 * the site publishes nothing on a topic the answer says so and points to the team.
 *
 * The result is plain JSON (one language of answers per request) served by
 * /api/reno/[locale]; the panel merges it with the hand-written FAQ in content/reno/faq.ts.
 */
import type { RenoCategoryId, RenoFaq, RenoLocale } from "@/content/reno/faq";
import type { Catalog, PublicArticle, PublicPackage, PublicPartner, PublicProject, PublicSolution } from "@/lib/content/queries";
import type { Dictionary } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings-schema";
import { tokenize } from "./normalize";

export type RenoKnowledgeEntry = {
  id: string;
  category: RenoCategoryId;
  /** Phrasings in the visitor's language; the first is shown on chips. */
  q: string[];
  /** Phrasings in the other language, for matching only. */
  alt: string[];
  k: string[];
  a: string;
  link?: { href: string; label: string };
  action?: "whatsapp" | "contact";
  related?: string[];
  hidden?: boolean;
};

export type RenoKnowledge = {
  entries: RenoKnowledgeEntry[];
  /**
   * Live details appended to hand-written answers: keyed by the answer's link
   * ("/solutions/home-cinema") or by "#<faq id>" ("#contact").
   */
  facts: Record<string, string>;
};

export const RENO_LIVE_CATEGORIES: Array<{ id: RenoCategoryId; label: { en: string; ar: string } }> = [
  { id: "catalog", label: { en: "All solutions", ar: "كل الحلول" } },
  { id: "packages", label: { en: "Packages", ar: "الباقات" } },
];

export type KnowledgeInput = {
  locale: RenoLocale;
  t: Dictionary;
  catalog: Catalog;
  settings: SiteSettings;
  projects: PublicProject[];
  partners: PublicPartner[];
  articles: PublicArticle[];
  /** Solution slugs the hand-written FAQ already answers (they get live facts instead of a second entry). */
  coveredSolutionSlugs: ReadonlySet<string>;
  formatPrice: (amount: string | number | null | undefined, currency: string, locale: RenoLocale) => string;
};

const MAX_LIST = 6;

/**
 * Everyday wordings for solutions the built-in FAQ doesn't cover. Matching aids only:
 * the answer is always the solution's own published summary, status and features.
 */
const SOLUTION_WORDINGS: Record<string, { en: string[]; ar: string[] }> = {
  "worship-house-systems": {
    en: ["Mosque sound system", "Sound system for a mosque", "Church sound system", "Lighting for a mosque"],
    ar: ["نظام صوت للمسجد", "سماعات للمسجد", "صوت الكنيسة", "إضاءة المسجد"],
  },
  "home-automation": {
    en: ["Automate my home", "Home routines and scenes", "I want my home to run itself"],
    ar: ["أتمتة البيت", "عايز البيت يشتغل لوحده", "مشاهد وروتين للبيت"],
  },
  "smart-curtains": {
    en: ["Motorized curtains", "Electric blinds", "Curtains that open on their own"],
    ar: ["ستاير كهربا", "ستاير بالريموت", "ستاير بتفتح لوحدها"],
  },
  "gaming-rooms": {
    en: ["Gaming setup", "A room for gaming", "PlayStation room"],
    ar: ["أوضة جيمنج", "غرفة بلايستيشن", "تجهيز غرفة ألعاب"],
  },
  "media-rooms": {
    en: ["TV room", "A room for movies and series"],
    ar: ["أوضة تلفزيون", "غرفة للأفلام والمسلسلات"],
  },
  "sports-simulators": {
    en: ["Sports simulator", "Simulator room"],
    ar: ["محاكي رياضي", "غرفة محاكاة"],
  },
};
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const bullets = (items: string[]) => items.map((i) => `• ${i}`).join("\n");
const sentence = (s: string) => {
  const c = clean(s);
  return !c || /[.!?؟…]$/.test(c) ? c : `${c}.`;
};

export function buildKnowledge(input: KnowledgeInput): RenoKnowledge {
  const { locale, t, catalog, settings, projects, partners, articles, coveredSolutionSlugs, formatPrice } = input;
  const ar = locale === "ar";
  /** Pick the visitor's language. */
  const L = <T,>(en: T, arV: T): T => (ar ? arV : en);
  const entries: RenoKnowledgeEntry[] = [];
  const facts: Record<string, string> = {};
  const add = (e: Omit<RenoKnowledgeEntry, "q" | "alt"> & { en: string[]; ar: string[] }) => {
    const { en, ar: arQ, ...rest } = e;
    if (!clean(rest.a)) return;
    entries.push({ ...rest, q: L(en, arQ), alt: L(arQ, en) });
  };

  const sections = settings.sections;
  const solutions = catalog.solutions.filter((s) => s.status === "available" || sections.showComingSoon);
  const packages = sections.showPackages ? catalog.packages : [];
  const solTitle = (s: PublicSolution) => clean(L(s.titleEn, s.titleAr));
  const pkgName = (p: PublicPackage) => clean(L(p.nameEn, p.nameAr));
  const statusOf = (status: "available" | "coming_soon") => (status === "available" ? t.solutions.availableNow : t.solutions.inPreparation);

  /* ── Solutions ─────────────────────────────────────────────────────── */
  for (const s of solutions) {
    const title = solTitle(s);
    const features = s.features.map((f) => clean(L(f.en, f.ar))).filter(Boolean);
    const shown = features.slice(0, MAX_LIST);
    const more = features.length - shown.length;
    const lines = [`${L("Status", "الحالة")}: ${statusOf(s.status as "available" | "coming_soon")}.`];
    if (s.status === "coming_soon") lines.push(t.solutions.comingSoonNotice);
    if (shown.length) {
      lines.push(`${t.solutions.features}:`, bullets(shown));
      if (more > 0) lines.push(L(`…and ${more} more on the page.`, `…و${more} كمان في الصفحة.`));
    }
    const fact = lines.join("\n");
    const href = `/solutions/${s.slug}`;
    facts[href] = fact;
    if (coveredSolutionSlugs.has(s.slug)) continue;
    const summary = sentence(L(s.summaryEn, s.summaryAr));
    add({
      id: `sol:${s.slug}`,
      category: "catalog",
      en: [`What is ${s.titleEn}?`, s.titleEn, `Tell me about ${s.titleEn}`, `Do you offer ${s.titleEn}?`, `Is ${s.titleEn} available?`, `${s.titleEn} features`, ...(SOLUTION_WORDINGS[s.slug]?.en ?? [])],
      ar: [`إيه هو ${s.titleAr}؟`, s.titleAr, `كلمني عن ${s.titleAr}`, `عندكم ${s.titleAr}؟`, `هل ${s.titleAr} متاح؟`, `مميزات ${s.titleAr}`, ...(SOLUTION_WORDINGS[s.slug]?.ar ?? [])],
      k: [s.titleEn, s.titleAr],
      a: [summary || title, fact].join("\n"),
      link: { href, label: title },
    });
  }

  /* ── Packages ──────────────────────────────────────────────────────── */
  const priceLine = (p: PublicPackage): string => {
    if (p.status === "coming_soon" || p.pricingMode === "coming_soon") return t.packages.pricing.coming_soon;
    if (!sections.showPackagePrices || p.pricingMode === "contact" || !p.price) return t.packages.pricing.contact;
    const amount = formatPrice(p.price, p.currency, locale);
    if (!amount) return t.packages.pricing.contact;
    const note = clean(L(p.priceNoteEn, p.priceNoteAr));
    return `${t.packages.pricing[p.pricingMode]}: ${amount}${note ? ` (${note})` : ""}`;
  };
  for (const p of packages) {
    const name = pkgName(p);
    const included = p.includedFeatures.map((f) => clean(L(f.en, f.ar))).filter(Boolean);
    const optional = p.optionalFeatures.map((f) => clean(L(f.en, f.ar))).filter(Boolean);
    const lines: string[] = [];
    if (included.length) {
      lines.push(`${t.packages.included}:`, bullets(included.slice(0, MAX_LIST)));
      if (included.length > MAX_LIST) lines.push(L(`…and ${included.length - MAX_LIST} more on the page.`, `…و${included.length - MAX_LIST} كمان في الصفحة.`));
    }
    if (optional.length) lines.push(`${t.packages.optional}: ${optional.slice(0, 4).join(L(", ", "، "))}.`);
    lines.push(`${L("Price", "السعر")}: ${priceLine(p)}.`, t.packages.note);
    const fact = lines.join("\n");
    const href = `/packages/${p.slug}`;
    facts[href] = fact;
    const tagline = sentence(L(p.taglineEn, p.taglineAr));
    // A package may share its name with a solution ("Home Cinema", "Gaming Room"): then the bare
    // name belongs to the solution and the package is asked for as a package.
    const words = (x: string) => [...new Set(tokenize(x))].sort().join(" ");
    const sharesName = catalog.solutions.some((x) => words(x.titleEn) === words(p.nameEn) || words(x.titleAr) === words(p.nameAr));
    const bare = sharesName ? { en: [], ar: [] } : { en: [p.nameEn, `How much is ${p.nameEn}?`], ar: [p.nameAr, `${p.nameAr} بكام؟`] };
    add({
      id: `pkg:${p.slug}`,
      category: "packages",
      en: [`What is the ${p.nameEn} package?`, `${p.nameEn} package`, `What does the ${p.nameEn} package include?`, `How much is the ${p.nameEn} package?`, `${p.nameEn} package price`, ...bare.en],
      ar: [`إيه هي باقة ${p.nameAr}؟`, `باقة ${p.nameAr}`, `باقة ${p.nameAr} فيها إيه؟`, `باقة ${p.nameAr} بكام؟`, `سعر باقة ${p.nameAr}`, ...bare.ar],
      k: [`${p.nameEn} package`, `باقة ${p.nameAr}`],
      a: [tagline ? `${name}: ${tagline}` : name, fact].join("\n"),
      link: { href, label: t.common.viewPackage },
      related: ["list:packages", "quote"],
    });
  }

  /* ── Lists ─────────────────────────────────────────────────────────── */
  const available = solutions.filter((s) => s.status === "available");
  const soon = solutions.filter((s) => s.status === "coming_soon");
  const allSolutionsLink = { href: "/solutions", label: L("All solutions", "كل الحلول") };
  if (available.length) {
    add({
      id: "list:available",
      category: "catalog",
      en: ["What is available now?", "Which solutions are available?", "Available solutions"],
      ar: ["إيه المتاح دلوقتي؟", "إيه الحلول المتاحة؟", "الحلول المتاحة"],
      k: ["available", "متاح", "متاحه", "المتاح"],
      a: `${t.solutions.availableNow}:\n${bullets(available.map(solTitle))}`,
      link: allSolutionsLink,
      related: soon.length ? ["list:soon"] : [],
    });
  }
  if (soon.length) {
    add({
      id: "list:soon",
      category: "catalog",
      en: ["What is coming soon?", "What are you preparing next?", "Which solutions are not available yet?"],
      ar: ["إيه اللي جاي قريب؟", "إيه اللي لسه قيد التجهيز؟", "إيه الحلول اللي لسه مش متاحة؟"],
      k: ["coming soon", "قريبا", "قيد التجهيز", "upcoming"],
      a: `${t.home.futureIntro}\n${bullets(soon.map(solTitle))}`,
      link: allSolutionsLink,
      related: available.length ? ["list:available"] : [],
    });
  }
  for (const c of catalog.categories) {
    const inCat = solutions.filter((s) => s.categoryId === c.id);
    if (!inCat.length) continue;
    const name = clean(L(c.nameEn, c.nameAr));
    const desc = sentence(L(c.descriptionEn, c.descriptionAr));
    add({
      id: `cat:${c.slug}`,
      category: "catalog",
      en: [`What is in ${c.nameEn}?`, c.nameEn, `${c.nameEn} solutions`],
      ar: [`إيه حلول ${c.nameAr}؟`, c.nameAr, `حلول ${c.nameAr}`],
      k: [c.nameEn, c.nameAr],
      a: [desc, bullets(inCat.map((s) => `${solTitle(s)} — ${statusOf(s.status as "available" | "coming_soon")}`))].filter(Boolean).join("\n"),
      link: { href: "/solutions", label: name },
    });
  }
  if (packages.length) {
    add({
      id: "list:packages",
      category: "packages",
      en: ["What packages do you have?", "Show me the packages", "List the packages", "Packages"],
      ar: ["إيه الباقات اللي عندكم؟", "وريني الباقات", "عندكم باقات إيه؟", "الباقات"],
      k: ["packages", "باقات", "باقه", "الباقات"],
      a: `${t.home.packagesIntro}\n${bullets(packages.map((p) => `${pkgName(p)} — ${priceLine(p)}`))}`,
      link: { href: "/packages", label: t.nav.packages },
      related: ["site:packages-what", "quote"],
    });
    add({
      id: "site:packages-what",
      category: "packages",
      en: ["What is a package?", "How do packages work?", "What is the difference between a package and a solution?"],
      ar: ["يعني إيه باقة؟", "الباقات بتشتغل إزاي؟", "إيه الفرق بين الباقة والحل؟"],
      k: ["package", "باقه"],
      a: `${t.packages.intro}\n${t.packages.note}`,
      link: { href: "/packages", label: t.nav.packages },
      related: ["list:packages"],
    });
  }

  /* ── The company, in its own published words ───────────────────────── */
  const h = t.home;
  add({
    id: "site:why",
    category: "about",
    en: ["Why choose ABCARINO?", "What makes you different?", "Why should I work with you?", "How are you different from other companies?"],
    ar: ["ليه أختار عبقرينو؟", "ليه أختاركم؟", "إيه اللي يميزكم؟", "ليه أشتغل معاكم؟", "إيه الفرق بينكم وبين غيركم؟"],
    k: ["different", "choose", "يميزكم", "تتميزوا", "اختار"],
    a: `${h.whyTitle}\n${bullets(h.why.map((w) => `${w.title}: ${w.text}`))}`,
    link: { href: "/about", label: t.about.eyebrow },
    related: ["site:process", "site:values"],
  });
  add({
    id: "site:process",
    category: "projects",
    en: ["How do you work?", "What are the steps of a project?", "What is your process?", "How does a project go?"],
    ar: ["بتشتغلوا إزاي؟", "إيه خطوات المشروع؟", "المشروع بيمشي إزاي؟", "إيه طريقة شغلكم؟"],
    k: ["process", "steps", "خطوات", "طريقه شغلكم"],
    a: `${h.processTitle}\n${h.process.map((p, i) => `${i + 1}. ${p.title}: ${p.text}`).join("\n")}`,
    related: ["start-info", "quote"],
    action: "contact",
  });
  add({
    id: "site:values",
    category: "about",
    en: ["What are your values?", "What do you believe in?", "What is your philosophy?"],
    ar: ["إيه قيمكم؟", "بتؤمنوا بإيه؟", "فلسفتكم إيه؟"],
    k: ["values", "believe", "philosophy", "قيم", "قيمكم", "فلسفه", "مبادئ"],
    a: bullets(t.about.beliefs.map((b) => `${b.title}: ${b.text}`)),
    link: { href: "/about", label: t.about.eyebrow },
    related: ["site:why", "site:approach"],
  });
  add({
    id: "site:approach",
    category: "about",
    en: ["What is your approach?", "How do you design a solution?", "How do you choose the technology?"],
    ar: ["إيه أسلوبكم في الشغل؟", "بتصمموا الحل إزاي؟", "بتختاروا التقنية إزاي؟"],
    k: ["approach", "اسلوب", "اسلوبكم", "منهج"],
    a: `${t.about.approachTitle}\n${t.about.approach.join("\n")}`,
    link: { href: "/about", label: t.about.eyebrow },
    related: ["site:process", "site:values"],
  });
  add({
    id: "site:name",
    category: "about",
    en: ["What does the name ABCARINO mean?", "What does ABCARINO mean?", "What does your logo mean?", "Where does the name come from?"],
    ar: ["إيه معنى اسم عبقرينو؟", "اللوجو معناه إيه؟", "الاسم جاي منين؟"],
    k: ["meaning", "logo", "mark", "معني", "لوجو", "شعار", "name"],
    a: `${t.about.nameTitle}\n${t.about.nameText}`,
    link: { href: "/about", label: t.about.eyebrow },
  });
  add({
    id: "site:team",
    category: "about",
    en: ["Who will do the work?", "Who is on the team?", "Do you have your own installers?"],
    ar: ["مين اللي هينفذ الشغل؟", "الفريق بتاعكم مين؟", "عندكم فنيين؟"],
    k: ["installers", "technicians", "فنيين", "هينفذ"],
    a: `${t.about.modelTitle}\n${t.about.modelText}`,
    link: { href: "/about", label: t.about.eyebrow },
    related: ["site:process"],
  });
  add({
    id: "site:day",
    category: "smart-home",
    en: ["What does a day in a smart home look like?", "Give me an example of a smart home", "What can a smart home do during the day?"],
    ar: ["شكل اليوم في البيت الذكي إيه؟", "اديني مثال للبيت الذكي", "البيت الذكي بيعمل إيه على مدار اليوم؟"],
    k: ["example", "مثال", "day", "اليوم"],
    a: `${h.dayIntro}\n${bullets(h.day.map((d) => `${d.time} ${d.title}: ${d.text}`))}`,
    related: ["smart-home"],
  });

  /* ── Topics the site may or may not publish: say which ─────────────── */
  const visibleProjects = sections.showProjects ? projects : [];
  add({
    id: "site:projects",
    category: "projects",
    en: ["Can I see your previous work?", "Do you have a portfolio?", "Show me your projects"],
    ar: ["ينفع أشوف شغلكم؟", "عندكم سابقة أعمال؟", "وريني مشاريعكم"],
    k: ["portfolio", "previous work", "سابقه اعمال", "مشاريعكم", "شغلكم"],
    a: visibleProjects.length
      ? `${t.projects.intro}\n${bullets(visibleProjects.slice(0, MAX_LIST).map((p) => [clean(L(p.nameEn, p.nameAr)), clean(L(p.locationEn, p.locationAr))].filter(Boolean).join(" — ")))}`
      : L(
          "We haven't published projects on the site yet. The best way to judge the fit is a conversation: tell the team about your space and you'll get honest advice and a clear proposal.",
          "لسه ما نشرناش مشاريع على الموقع. أفضل طريقة تحكم بيها إننا نتكلم: احكي للفريق عن المكان وهتاخد نصيحة صريحة وعرض واضح.",
        ),
    ...(visibleProjects.length ? { link: { href: "/projects", label: t.projects.eyebrow } } : { action: "whatsapp" as const }),
  });
  const visiblePartners = sections.showPartners ? partners : [];
  add({
    id: "site:brands",
    category: "projects",
    en: ["Which brands do you work with?", "Who are your partners?", "What products do you use?"],
    ar: ["بتشتغلوا مع أنهي ماركات؟", "مين شركاءكم؟", "بتستخدموا منتجات إيه؟"],
    k: ["brands", "partners", "ماركات", "شركاء", "منتجات", "products"],
    a: visiblePartners.length
      ? `${t.partners.intro}\n${bullets(visiblePartners.slice(0, 10).map((p) => clean(p.name)))}`
      : L(
          "We don't list brands or partners on the site yet. Equipment is chosen for the problem, never the other way round, so tell the team what you need and they'll recommend what fits your space.",
          "لسه مش ناشرين ماركات أو شركاء على الموقع. الأجهزة بتتختار على حسب المشكلة مش العكس، فاحكي للفريق محتاج إيه وهيرشحوا المناسب لمكانك.",
        ),
    ...(visiblePartners.length ? { link: { href: "/partners", label: t.partners.eyebrow } } : { action: "contact" as const }),
  });
  add({
    id: "site:warranty",
    category: "projects",
    en: ["Is there a warranty?", "What does the warranty cover?", "Do you guarantee your work?"],
    ar: ["فيه ضمان؟", "الضمان بيغطي إيه؟", "بتضمنوا الشغل؟"],
    k: ["warranty", "guarantee", "ضمان", "الضمان"],
    a: L(
      "Warranty terms aren't published on the site. They are confirmed in the proposal for your project, so ask the team and they'll tell you exactly what applies to your case.",
      "شروط الضمان مش منشورة على الموقع. بتتحدد في العرض الخاص بمشروعك، فاسأل الفريق وهيقولولك بالظبط إيه اللي ينطبق على حالتك.",
    ),
    action: "whatsapp",
    related: ["quote"],
  });
  const latest = sections.showInsights ? articles.slice(0, 4) : [];
  if (latest.length) {
    add({
      id: "site:insights",
      category: "about",
      en: ["Do you have a blog?", "Do you publish articles?", "Where can I read more?"],
      ar: ["عندكم مقالات؟", "عندكم بلوج؟", "أقرا أكتر فين؟"],
      k: ["blog", "articles", "مقالات", "بلوج"],
      a: `${t.insights.intro}\n${bullets(latest.map((x) => clean(L(x.titleEn, x.titleAr))))}`,
      link: { href: "/insights", label: t.insights.eyebrow },
    });
  }

  /* ── Contact details, exactly as set in the site settings ──────────── */
  const c = settings.contact;
  const hours = clean(L(c.businessHoursEn, c.businessHoursAr));
  const address = clean(L(c.addressEn, c.addressAr));
  const email = clean(c.email);
  const phone = clean(c.phone);
  const contactLines = [email && `${t.common.email}: ${email}`, phone && `${t.common.phone}: ${phone}`, hours && `${t.common.hours}: ${hours}`].filter(Boolean) as string[];
  if (contactLines.length) facts["#contact"] = contactLines.join("\n");
  const whereLines = [address && `${t.common.address}: ${address}`, hours && `${t.common.hours}: ${hours}`].filter(Boolean) as string[];
  if (whereLines.length) facts["#where"] = whereLines.join("\n");
  if (email) {
    add({
      id: "contact:email",
      category: "about",
      hidden: true,
      en: ["What is your email?", "Email address", "Can I email you?"],
      ar: ["إيميلكم إيه؟", "البريد الإلكتروني", "ينفع أبعت إيميل؟"],
      k: ["email", "mail", "ايميل", "بريد"],
      a: L(`You can email the team at ${email}.`, `تقدر تبعت للفريق على ${email}.`),
      action: "contact",
    });
  }
  if (phone) {
    add({
      id: "contact:phone",
      category: "about",
      hidden: true,
      en: ["What is your phone number?", "Can I call you?", "Phone number"],
      ar: ["رقم التليفون كام؟", "ينفع أتصل بيكم؟", "رقم الموبايل"],
      k: ["phone number", "اتصل", "رقم التليفون"],
      a: L(`You can call the team on ${phone}.`, `تقدر تتصل بالفريق على ${phone}.`),
      action: "whatsapp",
    });
  }
  add({
    id: "contact:hours",
    category: "about",
    hidden: true,
    en: ["What are your working hours?", "When are you open?", "Are you open on Friday?", "Opening hours"],
    ar: ["مواعيد العمل إيه؟", "مواعيدكم إيه؟", "مواعيد الشغل", "بتفتحوا إمتى؟", "شغالين يوم الجمعة؟"],
    k: ["hours", "open", "مواعيد", "مواعيدكم", "بتفتحوا", "شغالين"],
    a: hours
      ? `${t.common.hours}: ${hours}`
      : L(
          "Working hours aren't published on the site yet. You can send a message any time and the team will reply.",
          "مواعيد العمل لسه مش منشورة على الموقع. تقدر تبعت رسالة في أي وقت والفريق هيرد عليك.",
        ),
    action: "whatsapp",
  });
  add({
    id: "contact:office",
    category: "about",
    hidden: true,
    en: ["Where is your office?", "Can I visit your office?", "Do you have a showroom?"],
    ar: ["مكتبكم فين؟", "ينفع أزور المكتب؟", "عندكم معرض؟"],
    k: ["office", "showroom", "مكتبكم", "معرض", "المكتب"],
    a: address
      ? L(`The address on our Contact page is: ${address}. Please message the team before you come.`, `العنوان المنشور في صفحة التواصل: ${address}. يُفضّل تكلّم الفريق قبل ما تيجي.`)
      : L(
          "An office address isn't published on the site yet. Tell the team where your project is and they'll arrange the next step with you.",
          "عنوان المكتب لسه مش منشور على الموقع. قول للفريق مشروعك فين وهيرتبوا معاك الخطوة الجاية.",
        ),
    action: "contact",
  });
  const social = (["instagram", "facebook", "linkedin", "x", "tiktok", "youtube", "behance"] as const).filter((k) => clean(settings.social[k]));
  const socialNames: Record<(typeof social)[number], string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", x: "X", tiktok: "TikTok", youtube: "YouTube", behance: "Behance" };
  add({
    id: "contact:social",
    category: "about",
    hidden: true,
    en: ["Are you on Instagram?", "Do you have a Facebook page?", "Your social media accounts"],
    ar: ["عندكم انستجرام؟", "عندكم صفحة فيسبوك؟", "حساباتكم على السوشيال ميديا"],
    k: ["instagram", "facebook", "tiktok", "linkedin", "youtube", "social", "انستجرام", "انستا", "فيسبوك", "تيك توك", "سوشيال", "لينكدان", "يوتيوب"],
    a: social.length
      ? L(`You'll find us on ${social.map((k) => socialNames[k]).join(", ")}. The links are in the footer of every page.`, `هتلاقينا على ${social.map((k) => socialNames[k]).join("، ")}. الروابط موجودة في آخر كل صفحة.`)
      : L("No social media accounts are published on the site yet.", "لسه مفيش حسابات سوشيال ميديا منشورة على الموقع."),
  });

  return { entries, facts };
}

/** Wire entry → the FAQ shape the matcher and panel use. */
export function toFaq(e: RenoKnowledgeEntry, locale: RenoLocale): RenoFaq {
  const other: RenoLocale = locale === "ar" ? "en" : "ar";
  const action = e.link
    ? ({ type: "link", href: e.link.href, label: { en: e.link.label, ar: e.link.label } } as const)
    : e.action
      ? ({ type: e.action } as const)
      : undefined;
  return {
    id: e.id,
    category: e.category,
    questions: { [locale]: e.q, [other]: e.alt } as RenoFaq["questions"],
    keywords: e.k,
    answers: { en: e.a, ar: e.a },
    related: e.related,
    action,
    hidden: e.hidden,
  };
}

const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const isStrList = (v: unknown, maxItems: number, max: number): v is string[] => Array.isArray(v) && v.length <= maxItems && v.every((x) => isStr(x, max));

/** Validate what the API returned before it reaches the panel (it is our own endpoint, but never trust the wire). */
export function parseKnowledge(data: unknown): RenoKnowledge {
  const out: RenoKnowledge = { entries: [], facts: {} };
  if (!data || typeof data !== "object") return out;
  const d = data as { entries?: unknown; facts?: unknown };
  if (Array.isArray(d.entries)) {
    for (const raw of d.entries.slice(0, 300)) {
      if (!raw || typeof raw !== "object") continue;
      const e = raw as Record<string, unknown>;
      if (!isStr(e.id, 120) || !isStr(e.category, 30) || !isStr(e.a, 4000) || !e.a) continue;
      if (!isStrList(e.q, 12, 300) || !e.q.length || !isStrList(e.alt, 12, 300) || !isStrList(e.k, 30, 120)) continue;
      const link = e.link as { href?: unknown; label?: unknown } | undefined;
      const validLink = link && isStr(link.href, 200) && /^\/[a-z0-9/#-]*$/.test(link.href) && isStr(link.label, 200) ? { href: link.href, label: link.label } : undefined;
      out.entries.push({
        id: e.id,
        category: e.category as RenoCategoryId,
        q: e.q,
        alt: e.alt,
        k: e.k,
        a: e.a,
        link: validLink,
        action: e.action === "whatsapp" || e.action === "contact" ? e.action : undefined,
        related: isStrList(e.related, 6, 120) ? e.related : undefined,
        hidden: e.hidden === true,
      });
    }
  }
  if (d.facts && typeof d.facts === "object") {
    for (const [k, v] of Object.entries(d.facts as Record<string, unknown>).slice(0, 300)) if (isStr(k, 200) && isStr(v, 2000)) out.facts[k] = v;
  }
  return out;
}
