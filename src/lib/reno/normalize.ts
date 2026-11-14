/**
 * Text normalisation for RENO's FAQ matcher (Arabic + English).
 * Pure functions, no dependencies: safe on the server, in the browser and in tests.
 */

const ARABIC_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

/** Lower-cases, strips diacritics/tatweel/punctuation and unifies common Arabic spelling variants. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words that carry no meaning for matching (already normalised). */
const STOPWORDS = new Set([
  // Arabic (MSA + Egyptian)
  "هل", "ايه", "ايش", "ما", "ماذا", "هي", "هو", "هم", "يعني", "انا", "انت", "انتو", "انتم", "احنا", "عايز", "عاوز", "عايزه", "عاوزه",
  "ممكن", "اقدر", "نقدر", "ينفع", "في", "فى", "من", "علي", "على", "الي", "الى", "عن", "مع", "او", "و", "ولا", "لو",
  "اللي", "الذي", "التي", "ده", "دي", "دا", "كده", "كدا", "بس", "طيب", "يا", "لي", "ليا", "لينا", "عندكم", "عندك",
  "بتاع", "بتاعت", "بتاعتكم", "حاجه", "حد", "ازاي", "كيف", "امتي", "اي", "اية", "شويه", "جدا", "انه", "ان",
  "عشان", "علشان", "لازم", "محتاج", "محتاجه", "عاوزين", "عايزين",
  // English
  "a", "an", "the", "is", "are", "am", "be", "do", "does", "did", "you", "your", "yours", "we", "i", "me", "my", "our",
  "can", "could", "would", "will", "to", "of", "for", "in", "on", "at", "with", "and", "or", "it", "this", "that",
  "what", "how", "please", "any", "have", "has", "there", "about", "want", "need", "like", "get", "some",
  "tell", "show", "give", "know",
]);

/** Spelling variants and synonyms mapped to one canonical token (keys and values normalised). */
const CANONICAL: Record<string, string> = {
  منزل: "بيت", شقه: "بيت", فيلا: "بيت", منازل: "بيت", بيوت: "بيت", home: "بيت", house: "بيت", homes: "بيت",
  سمارت: "ذكي", سمرت: "ذكي", ذكيه: "ذكي", smart: "ذكي",
  اضاءه: "اضاءه", نور: "اضاءه", انوار: "اضاءه", لمبات: "اضاءه", lighting: "اضاءه", lights: "اضاءه", light: "اضاءه",
  تكييف: "تكييف", مكيف: "تكييف", تكيف: "تكييف", ac: "تكييف", hvac: "تكييف", climate: "تكييف",
  ستاير: "ستاير", ستائر: "ستاير", ستاره: "ستاير", برادي: "ستاير", curtains: "ستاير", curtain: "ستاير", blinds: "ستاير",
  موبايل: "موبايل", تليفون: "موبايل", جوال: "موبايل", phone: "موبايل", mobile: "موبايل",
  سعر: "سعر", اسعار: "سعر", تكلفه: "سعر", بكام: "سعر", كام: "سعر", price: "سعر", prices: "سعر", pricing: "سعر",
  cost: "سعر", quote: "سعر", quotation: "سعر",
  كاميرا: "كاميرا", كاميرات: "كاميرا", مراقبه: "كاميرا", cctv: "كاميرا", camera: "كاميرا", cameras: "كاميرا",
  موقع: "موقع", مواقع: "موقع", ويب: "موقع", website: "موقع", websites: "موقع", web: "موقع", site: "موقع",
  تطبيق: "تطبيق", تطبيقات: "تطبيق", ابلكيشن: "تطبيق", ابليكيشن: "تطبيق", app: "تطبيق", apps: "تطبيق",
  application: "تطبيق", applications: "تطبيق",
  تواصل: "تواصل", اكلمكم: "تواصل", اكلمكو: "تواصل", اتواصل: "تواصل", رقم: "تواصل", contact: "تواصل", call: "تواصل",
  واتساب: "واتساب", واتس: "واتساب", whatsapp: "واتساب",
  سينما: "سينما", cinema: "سينما", theater: "سينما", theatre: "سينما",
  صوت: "صوت", سماعات: "صوت", audio: "صوت", sound: "صوت", speakers: "صوت", surround: "صوت",
  شبكه: "شبكه", شبكات: "شبكه", نتورك: "شبكه", network: "شبكه", networks: "شبكه", networking: "شبكه", wifi: "شبكه",
  شركه: "شركه", شركات: "شركه", مكتب: "شركه", مكاتب: "شركه", company: "شركه", companies: "شركه", office: "شركه",
  offices: "شركه", business: "شركه", businesses: "شركه",
  مبني: "مبني", مباني: "مبني", عماره: "مبني", building: "مبني", buildings: "مبني",
  اجتماعات: "اجتماع", اجتماع: "اجتماع", meeting: "اجتماع", meetings: "اجتماع",
  معاينه: "معاينه", زياره: "معاينه", visit: "معاينه", survey: "معاينه", inspection: "معاينه",
  مراحل: "مرحله", مرحله: "مرحله", phases: "مرحله", phase: "مرحله", stages: "مرحله", stage: "مرحله",
  خدمات: "خدمه", خدمه: "خدمه", خدماتكم: "خدمه", services: "خدمه", service: "خدمه",
  استشاره: "استشاره", استشارات: "استشاره", consultation: "استشاره", consulting: "استشاره", advice: "استشاره",
  villa: "بيت", villas: "بيت", apartment: "بيت", apartments: "بيت", flat: "بيت",
  اتمته: "اتمته", اوتوميشن: "اتمته", automation: "اتمته", automate: "اتمته", automated: "اتمته", automatic: "اتمته",
  العاب: "لعب", الالعاب: "لعب", جيمنج: "لعب", جيمز: "لعب", بلايستيشن: "لعب", gaming: "لعب", game: "لعب", games: "لعب", playstation: "لعب",
  مسجد: "عباده", مساجد: "عباده", جامع: "عباده", كنيسه: "عباده", كنايس: "عباده", العباده: "عباده", mosque: "عباده", mosques: "عباده",
  masjid: "عباده", church: "عباده", churches: "عباده", worship: "عباده",
  غرفه: "غرفه", غرف: "غرفه", اوضه: "غرفه", اوض: "غرفه", room: "غرفه", rooms: "غرفه",
  باقه: "باقه", باقات: "باقه", الباقات: "باقه", بكدج: "باقه", package: "باقه", packages: "باقه", bundle: "باقه",
  ضمان: "ضمان", الضمان: "ضمان", warranty: "ضمان", guarantee: "ضمان",
  مواعيد: "مواعيد", مواعيدكم: "مواعيد", المواعيد: "مواعيد", hours: "مواعيد",
  عبقرينو: "abcarino", ابكارينو: "abcarino",
  رينو: "reno",
};

const ARABIC_PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال"];

/** One typo apart (a substitution, a missing or an extra letter): "lightning" ~ "lighting", "سينيما" ~ "سينما". */
export function nearlySame(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1 || /\d/.test(a + b)) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  const rest = short.length === long.length ? [short.slice(i + 1), long.slice(i + 1)] : [short.slice(i), long.slice(i + 1)];
  return rest[0] === rest[1];
}


const CANONICAL_KEYS = Object.keys(CANONICAL).filter((k) => k.length >= 5);

/** A known word typed with one slip ("cinma", "lightning") still maps to its canonical token. */
function fuzzyCanonical(w: string): string | undefined {
  if (w.length < 5) return undefined;
  const key = CANONICAL_KEYS.find((k) => nearlySame(k, w));
  return key ? CANONICAL[key] : undefined;
}

/** Normalised, de-stopworded, lightly stemmed and canonicalised tokens. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  for (const raw of normalizeText(input).split(" ")) {
    if (!raw) continue;
    // A known word is used as written; only unknown words lose a leading "ال" (so "ألعاب" is not cut to "عاب").
    let w = CANONICAL[raw] ?? raw;
    if (w === raw) {
      for (const p of ARABIC_PREFIXES) {
        if (w.startsWith(p) && w.length - p.length >= 2) {
          w = w.slice(p.length);
          break;
        }
      }
      if (/^[a-z]+$/.test(w) && w.length > 4 && w.endsWith("s") && !CANONICAL[w]) w = w.slice(0, -1);
      w = CANONICAL[w] ?? fuzzyCanonical(w) ?? w;
    }
    if (STOPWORDS.has(w) || STOPWORDS.has(raw)) continue;
    tokens.push(w);
  }
  return tokens;
}
