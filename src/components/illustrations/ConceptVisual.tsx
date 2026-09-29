import {
  AudioScene,
  CinemaScene,
  GamingScene,
  LightingScene,
  LivingScene,
  OfficeScene,
  PlanScene,
  SimulatorScene,
  SoftwareScene,
  WorshipScene,
} from "./scenes";

export const VISUALS = {
  living: { scene: LivingScene, en: "Home — evening scene", ar: "المنزل — مشهد المساء" },
  lighting: { scene: LightingScene, en: "Lighting scenes", ar: "مشاهد الإضاءة" },
  cinema: { scene: CinemaScene, en: "Private cinema", ar: "سينما منزلية" },
  gaming: { scene: GamingScene, en: "Gaming room", ar: "غرفة ألعاب" },
  office: { scene: OfficeScene, en: "Meeting room", ar: "غرفة اجتماعات" },
  plan: { scene: PlanScene, en: "Comfort & safety plan", ar: "مخطط الراحة والأمان" },
  audio: { scene: AudioScene, en: "Multi-room audio", ar: "صوت متعدد الغرف" },
  simulator: { scene: SimulatorScene, en: "Sports simulator", ar: "محاكي رياضي" },
  worship: { scene: WorshipScene, en: "Worship space", ar: "دار عبادة" },
  software: { scene: SoftwareScene, en: "Web & mobile software", ar: "برمجيات الويب والجوال" },
} as const;

export type VisualKey = keyof typeof VISUALS;
export const VISUAL_KEYS = Object.keys(VISUALS) as VisualKey[];

export function isVisualKey(v: string): v is VisualKey {
  return v in VISUALS;
}

/**
 * Built-in concept illustration. Used wherever the founders have not yet uploaded
 * real photography — clearly a drawing, never mistaken for a completed project.
 */
export function ConceptVisual({
  visual,
  uid,
  locale = "en",
  className,
  animated,
}: {
  visual: string;
  /** Unique per page instance (SVG gradient ids). */
  uid: string;
  locale?: "en" | "ar";
  className?: string;
  animated?: boolean;
}) {
  const key: VisualKey = isVisualKey(visual) ? visual : "living";
  const { scene: Scene, en, ar } = VISUALS[key];
  const prefix = locale === "ar" ? "رسم توضيحي: " : "Concept illustration: ";
  return (
    <Scene
      uid={`v-${uid.replace(/[^a-zA-Z0-9-]/g, "")}`}
      className={className}
      animated={animated}
      title={`${prefix}${locale === "ar" ? ar : en}`}
    />
  );
}
