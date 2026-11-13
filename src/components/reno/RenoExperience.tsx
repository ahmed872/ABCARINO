"use client";

import "./reno.css";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG, prefersReducedMotion, readSession, writeSession } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { RenoCompanion } from "./RenoCompanion";
import { RenoIntro } from "./RenoIntro";

export type RenoProps = {
  locale: RenoLocale;
  t: Dictionary["reno"];
  whatsapp: string | null;
  stackAboveWhatsApp: boolean;
};

type Phase = "intro" | "docked";

function shouldPlayIntro(pathname: string, locale: RenoLocale): boolean {
  const cfg = RENO_CONFIG.intro;
  // ?reno-intro=1 always plays; ?reno-intro=auto applies the normal rules even in automated browsers (tests).
  const param = new URLSearchParams(window.location.search).get(cfg.forceParam);
  if (param === "1") return true;
  if (!cfg.enabled || cfg.frequency === "never") return false;
  if (cfg.skipForAutomation && navigator.webdriver && param !== "auto") return false;
  if (cfg.pages === "home" && pathname !== `/${locale}`) return false;
  if (cfg.frequency === "session" && readSession(RENO_CONFIG.storage.intro)) return false;
  return true;
}

/** Client-only RENO: decides once per load whether to play the arrival, then keeps the companion docked. */
export default function RenoExperience({ locale, t, whatsapp, stackAboveWhatsApp }: RenoProps) {
  const pathname = usePathname();
  // Client-only component (loaded with ssr: false), so the browser APIs are available at render.
  // Decided once, on the landing page; later client-side navigations never replay the intro.
  const [phase, setPhase] = useState<Phase>(() => (shouldPlayIntro(pathname, locale) ? "intro" : "docked"));
  const [reduced] = useState(prefersReducedMotion);
  const [arrived, setArrived] = useState(false);

  return (
    <>
      {phase === "intro" ? (
        <RenoIntro
          locale={locale}
          t={t}
          reduced={reduced}
          stackAboveWhatsApp={stackAboveWhatsApp}
          onDone={(how) => {
            writeSession(RENO_CONFIG.storage.intro, how);
            setArrived(true);
            setPhase("docked");
          }}
        />
      ) : null}
      {phase === "docked" && RENO_CONFIG.companion.enabled ? (
        <RenoCompanion locale={locale} t={t} whatsapp={whatsapp} stackAboveWhatsApp={stackAboveWhatsApp} arriving={arrived} />
      ) : null}
    </>
  );
}
